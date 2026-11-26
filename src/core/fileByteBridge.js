/**
 * 文件 ↔ 字节 / 编码桥接（filefmt / run 单向）
 *
 * 覆盖 V8 的 9 个文件工具入口（bytes_to_str / str_to_bytes / file_read ×3 / file_convert ×4），
 * 合并为一个参数化 op。口径对齐反编源码：
 *   - str_to_bytes：Python bytes 字面量 repr（UTF-8 字节，可打印字符保留、其余 \xNN）
 *   - bytes_to_str：解析 \xNN / \n / 八进制等转义后按 UTF-8 还原
 *   - file_read：文本不硬切行；2/8/16 进制流每字节定宽（8bit / 2hex / 八进制）
 *   - file_convert：Base64/hex ↔ 文件，hex 清洗 0x/空白/逗号，类型可按魔数猜
 *
 * 与磁盘相关的产物一律走 `files` 下载通道，不直接写用户磁盘；二进制输入优先取 params.rawBytes。
 */
import { register } from "./registry.js";

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder("utf-8", { fatal: false });
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const MAGIC_EXT = [
  ["504b0304", "zip"], ["52617221", "rar"], ["377abcaf271c", "7z"],
  ["38425053", "psd"], ["89504e470d0a1a0a", "png"], ["474946383961", "gif"],
  ["474946383761", "gif"], ["ffd8ff", "jpg"], ["424d", "bmp"],
  ["255044462d", "pdf"], ["00000100", "ico"], ["7f454c46", "elf"],
  ["4d5a", "exe"], ["1f8b08", "gz"], ["664c6143", "flac"],
];

function toU8(x) {
  if (x instanceof Uint8Array) return x;
  if (x instanceof ArrayBuffer) return new Uint8Array(x);
  if (ArrayBuffer.isView(x)) return new Uint8Array(x.buffer, x.byteOffset, x.byteLength);
  return null;
}

function inputBytes(input, p) {
  const raw = p && toU8(p.rawBytes);
  if (raw && raw.length) return raw;
  const s = typeof input === "string" ? input : "";
  const compact = s.replace(/\s+/g, "");
  if (compact.length >= 2 && compact.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(compact)) {
    const out = new Uint8Array(compact.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(compact.substr(i * 2, 2), 16);
    return out;
  }
  return ENCODER.encode(s);
}

function inputText(input, p) {
  const raw = p && toU8(p.rawBytes);
  if (raw && raw.length) return DECODER.decode(raw);
  return typeof input === "string" ? input : "";
}

function hexOf(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Python bytes repr：`b'\xe4\xbd\xa0...'`，可打印 ASCII 原样保留 */
function pythonBytesRepr(bytes) {
  let s = "b'";
  for (const b of bytes) {
    if (b === 0x27) s += "\\'";
    else if (b === 0x5c) s += "\\\\";
    else if (b === 0x0a) s += "\\n";
    else if (b === 0x0d) s += "\\r";
    else if (b === 0x09) s += "\\t";
    else if (b >= 0x20 && b < 0x7f) s += String.fromCharCode(b);
    else s += "\\x" + b.toString(16).padStart(2, "0");
  }
  return s + "'";
}

/** 解析 Python bytes 字面量里的转义，得到原始字节 */
function parseBytesLiteral(text) {
  let s = String(text || "").trim();
  const m = /^[bB](['"])([\s\S]*)\1$/.exec(s);
  if (m) s = m[2];
  const out = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c !== "\\") { out.push(...ENCODER.encode(c)); continue; }
    const n = s[i + 1];
    if (n === undefined) { out.push(0x5c); break; }
    if (n === "x") {
      const h = s.substr(i + 2, 2);
      if (!/^[0-9a-fA-F]{2}$/.test(h)) throw new Error(`bytes 字面量：\\x 后需要两位十六进制，实际「${h}」`);
      out.push(parseInt(h, 16)); i += 3;
    } else if (n >= "0" && n <= "7") {
      let oct = "";
      while (oct.length < 3 && /[0-7]/.test(s[i] || "")) { oct += s[i]; i++; }
      out.push(parseInt(oct, 8) & 0xff); i--;
    } else if (n === "n") { out.push(10); i++; }
    else if (n === "r") { out.push(13); i++; }
    else if (n === "t") { out.push(9); i++; }
    else if (n === "b") { out.push(8); i++; }
    else if (n === "f") { out.push(12); i++; }
    else if (n === "u") {
      const h = s.substr(i + 2, 4);
      if (!/^[0-9a-fA-F]{4}$/.test(h)) throw new Error("bytes 字面量：\\u 后需要四位十六进制");
      out.push(...ENCODER.encode(String.fromCharCode(parseInt(h, 16)))); i += 5;
    } else { out.push(...ENCODER.encode(n)); i++; }
  }
  return Uint8Array.from(out);
}

/** 文本解码：按编码参数依次尝试 UTF-8 / GBK / latin-1，最后兜底不丢字节 */
function decodeText(bytes, enc) {
  const order = enc === "gbk" ? ["gbk", "utf-8"]
    : enc === "latin1" ? ["latin-1"]
      : ["utf-8", "gbk"];
  const tried = [];
  for (const label of order) {
    try {
      const d = new TextDecoder(label, { fatal: true });
      const s = d.decode(bytes);
      tried.push(`${label} ✓`);
      return { text: s, used: label, tried };
    } catch {
      tried.push(`${label} ✗`);
    }
  }
  tried.push("latin-1（兜底）");
  return { text: Array.from(bytes).map((b) => String.fromCharCode(b)).join(""), used: "latin1", tried };
}

function encodeBase64(bytes) {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = i + 1 < bytes.length ? bytes[i + 1] : 0, c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64[a >> 2] + B64[((a & 3) << 4) | (b >> 4)] + (i + 1 < bytes.length ? B64[((b & 15) << 2) | (c >> 6)] : "=") + (i + 2 < bytes.length ? B64[c & 63] : "=");
  }
  return out;
}

function decodeBase64(text) {
  let s = String(text || "").trim();
  for (const p of ["data:image/png;base64,", "data:image/jpeg;base64,", "data:image/jpg;base64,", "data:image/gif;base64,", "data:application/octet-stream;base64,"]) {
    if (s.toLowerCase().startsWith(p)) { s = s.slice(p.length); break; }
  }
  s = s.replace(/\s+/g, "");
  if (!s) throw new Error("Base64 输入为空");
  if (/[^A-Za-z0-9+/=]/.test(s)) throw new Error("Base64 含非法字符（只接受标准字母表与 = 填充）");
  s = s.replace(/=+$/, "");
  const out = [];
  let acc = 0, bits = 0;
  for (const ch of s) {
    const v = B64.indexOf(ch);
    if (v < 0) throw new Error("Base64 解码失败：非法字符 " + ch);
    acc = (acc << 6) | v; bits += 6;
    if (bits >= 8) { bits -= 8; out.push((acc >> bits) & 0xff); }
  }
  return Uint8Array.from(out);
}

function cleanHex(text) {
  return String(text || "").replace(/0x/gi, "").replace(/[\s,;:'"\[\]()]/g, "").toLowerCase();
}

function hexToBytes(text) {
  const h = cleanHex(text);
  if (!h) throw new Error("未找到有效的十六进制数据");
  if (h.length % 2) throw new Error("十六进制长度为奇数，无法逐字节解析");
  if (!/^[0-9a-f]+$/.test(h)) throw new Error("十六进制含非法字符");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
  return out;
}

function guessExt(bytes) {
  const h = hexOf(bytes);
  for (const [magic, ext] of MAGIC_EXT) if (h.startsWith(magic)) return ext;
  return "";
}

function baseName(name) {
  const s = String(name || "").replace(/^.*[\\/]/, "");
  return s || "input.bin";
}

function stemOf(name) {
  const s = baseName(name);
  const d = s.lastIndexOf(".");
  return d > 0 ? s.slice(0, d) : s;
}

/** 每字节定宽输出：2 进制 8 位 / 16 进制 2 位 / 8 进制不补零（对齐 V8） */
function radixReport(bytes) {
  const bin = Array.from(bytes).map((b) => b.toString(2).padStart(8, "0")).join(" ");
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join(" ");
  const oct = Array.from(bytes).map((b) => b.toString(8)).join(" ");
  return `--------2 进制流:\n${bin}\n\n--------16进制流:\n${hex}\n\n--------8 进制流:\n${oct}`;
}

const MODES = [
  ["bytesToText", "Bytes 字面量 → 文本"],
  ["textToBytes", "文本 → Bytes 字面量"],
  ["fileToBytes", "文件 → Bytes 字面量"],
  ["fileToText", "文件 → 文本（不硬切行）"],
  ["fileToRadix", "文件 → 2/8/16 进制流"],
  ["fileToBase64", "文件 → Base64"],
  ["base64ToFile", "Base64 → 文件"],
  ["hexToFile", "16 进制 → 文件"],
  ["hexFileSave", "16 进制 → .hex 文件"],
];

function run(input, p = {}) {
  const mode = MODES.some(([k]) => k === p.mode) ? p.mode : "fileToBytes";
  const text = inputText(input, p);
  const fileName = baseName(p.rawFileName || p.fileName || "");
  const stem = stemOf(fileName);
  const outLines = [`文件↔字节桥接 · ${MODES.find(([k]) => k === mode)[1]}`];
  let files = [];

  if (mode === "bytesToText") {
    const bytes = parseBytesLiteral(text);
    const r = decodeText(bytes, p.encoding || "utf-8");
    outLines.push(`转义解析 ${bytes.length} 字节；解码 ${r.used}（尝试 ${r.tried.join(" / ")}）`);
    outLines.push("", r.text);
  } else if (mode === "textToBytes" || mode === "fileToBytes") {
    const bytes = mode === "fileToBytes" ? inputBytes(input, p) : ENCODER.encode(text);
    outLines.push(`输入 ${bytes.length} 字节（${mode === "fileToBytes" ? fileName || "拖入的文件" : "文本 UTF-8"}）`);
    outLines.push("", pythonBytesRepr(bytes));
  } else if (mode === "fileToText") {
    const bytes = inputBytes(input, p);
    const r = decodeText(bytes, p.encoding || "utf-8");
    outLines.push(`输入 ${bytes.length} 字节；解码 ${r.used}（尝试 ${r.tried.join(" / ")}）`);
    outLines.push("（按原文换行输出，不额外硬切行）", "", r.text);
  } else if (mode === "fileToRadix") {
    const bytes = inputBytes(input, p);
    outLines.push(`输入 ${bytes.length} 字节`);
    outLines.push("", radixReport(bytes));
  } else if (mode === "fileToBase64") {
    const bytes = inputBytes(input, p);
    const b64 = encodeBase64(bytes);
    outLines.push(`输入 ${bytes.length} 字节 → Base64 ${b64.length} 字符`);
    outLines.push("", b64);
    files.push({ name: `${stem || "file"}.b64.txt`, mime: "text/plain", bytes: ENCODER.encode(b64) });
  } else if (mode === "base64ToFile") {
    const bytes = decodeBase64(text);
    const ext = String(p.ext || "").replace(/^\./, "").toLowerCase() || guessExt(bytes) || "bin";
    outLines.push(`Base64 → ${bytes.length} 字节，扩展名 ${ext}${!p.ext && guessExt(bytes) ? "（按魔数识别）" : ""}`);
    files.push({ name: `${stem || "decoded"}.${ext}`, mime: "application/octet-stream", bytes });
  } else if (mode === "hexToFile") {
    const bytes = hexToBytes(text);
    const ext = String(p.ext || "").replace(/^\./, "").toLowerCase() || guessExt(bytes) || "bin";
    outLines.push(`Hex → ${bytes.length} 字节，扩展名 ${ext}${!p.ext && guessExt(bytes) ? "（按魔数识别）" : ""}`);
    outLines.push(`前 16 字节：${hexOf(bytes.subarray(0, 16))}`);
    files.push({ name: `${stem || "decoded"}.${ext}`, mime: "application/octet-stream", bytes });
  } else if (mode === "hexFileSave") {
    const bytes = hexToBytes(text);
    outLines.push(`Hex → ${bytes.length} 字节，另存为 .hex 文件`);
    files.push({ name: `${stem || "data"}.hex`, mime: "application/octet-stream", bytes });
  }

  if (files.length) outLines.push("", `产物：${files.map((f) => f.name).join("、")}（浏览器下载，未写用户磁盘）`);
  return { text: outLines.join("\n"), files };
}

register({
  id: "fileByteBridge", cat: "filefmt", name: "文件↔字节桥接",
  desc: "把磁盘文件与字节/编码串互相转换的一站式入口，合并 9 个同类能力：Bytes 字面量(b'\\xNN')↔文本、文件→Bytes 字面量、文件→文本（UTF-8/GBK/latin-1 依次试，不硬切行）、文件→2/8/16 进制流（每字节定宽）、文件→Base64、Base64→文件、Hex→文件、Hex→.hex 文件。Base64/Hex 产物按魔数自动识别扩展名，也可手动指定；输入支持拖文件（rawBytes）或文本/hex；产物走下载通道，不直接写磁盘",
  params: [
    { key: "mode", label: "模式", type: "select", default: "fileToBytes", options: MODES.map(([value, label]) => ({ value, label })) },
    { key: "encoding", label: "文本编码（文件→文本）", type: "select", default: "utf-8", options: [
      { value: "utf-8", label: "UTF-8 → GBK 回退" },
      { value: "gbk", label: "GBK → UTF-8 回退" },
      { value: "latin1", label: "Latin-1（逐字节）" },
    ] },
    { key: "ext", label: "产物扩展名（留空则按魔数猜）", type: "text", default: "", placeholder: "png / zip / jpg …" },
  ],
  run,
  acceptsBytes: true,
  autoRun: false,
});

export { run as fileByteBridgeRun, pythonBytesRepr, parseBytesLiteral, encodeBase64, decodeBase64, hexToBytes, guessExt, MODES };
