/*
 * textStegoExtract.js — 文本载体隐写提取（Cloakify / TTI）。
 *
 * 算法来源：V8.0.1 反编源码 codecs/file_tools/text_stego.py
 *   cloakify_decode / tti_decode / _b64decode_loose / _dump_result / _adaptive_map。
 * 本实现把「两个文件输入」改成「主输入 + key 参数」，产物走 files 下载通道
 * （零外发、不写用户磁盘），其余口径（词表→Base64 字符、TTI 四值→2bit）逐字对齐源码。
 */
import { register } from "./registry.js";

const ARRAY64 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=";
const TTI_BITS = { "63": "00", "127": "01", "191": "10", "255": "11" };
const SIGNATURES = [
  ["/9j/", "jpg"], ["iVBORw0KGgo", "png"], ["R0lGOD", "gif"], ["Qk", "bmp"],
  ["JVBERi0", "pdf"], ["UEsDB", "zip"], ["UmFy", "rar"], ["N3q8", "7z"],
];
const te = (s) => new TextEncoder().encode(s);
const td = (b) => new TextDecoder("utf-8", { fatal: false }).decode(b);

function b64ToBytes(text) {
  const s = String(text ?? "").replace(/\s+/g, "").replace(/=+$/, "");
  const padded = s + "=".repeat((4 - (s.length % 4)) % 4);
  for (const v of [s, padded]) {
    try {
      const bin = atob(v);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    } catch { /* 试下一个 */ }
  }
  throw new Error("Base64 还原失败");
}
function looksText(bytes) {
  if (!bytes.length || bytes.includes(0)) return false;
  let good = 0;
  for (const b of bytes) if ((b >= 32 && b < 127) || b === 9 || b === 10 || b === 13) good++;
  return good / bytes.length >= 0.9;
}
function resultFor(bytes, suffix) {
  let textOut = "", ext = ".bin", files = [];
  if (!looksText(bytes)) {
    const head = b64FromBytes(bytes.slice(0, 16));
    ext = (SIGNATURES.find(([sig]) => head.startsWith(sig)) || [null, ".bin"])[1];
    files = [{ name: `decoded${suffix}${ext}`, bytes }];
    textOut = `解出 ${bytes.length} 字节数据，已按文件头（${ext}）生成下载产物。`;
  } else {
    textOut = td(bytes);
    if (textOut.length > 3000) {
      files = [{ name: `decoded${suffix}.txt`, bytes }];
      textOut = `解出 ${textOut.length} 字符，已生成下载产物。前 3000 字符预览：\n${textOut.slice(0, 3000)}`;
    }
  }
  return { textOut, files };
}
const b64FromBytes = (bytes) => {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};

function cloakifyRun(text, p) {
  const stego = String(text ?? "").trim();
  const table = String(p.wordlist ?? "").trim();
  if (!stego) return "请在输入区填入隐写词（每行一个）。";
  if (!table) return "请在「词表」参数填入密码表（每行一个词，对应 Base64 字母表顺序）。";
  const words = stego.split(/\r?\n/).map((w) => w.trim()).filter(Boolean);
  const cipher = table.split(/\r?\n/).map((w) => w.trim()).filter(Boolean);
  const indexOf = new Map();
  cipher.forEach((w, pos) => { if (w && !indexOf.has(w)) indexOf.set(w, pos); });
  const clear = [], missing = [];
  for (const w of words) {
    const pos = indexOf.get(w);
    if (pos == null || pos >= ARRAY64.length) missing.push(w);
    else clear.push(ARRAY64[pos]);
  }
  const lines = [
    `隐写词数：${words.length}    词表词数：${cipher.length}`,
    `还原 Base64 字符数：${clear.length}    未匹配词数：${missing.length}`,
  ];
  if (missing.length) {
    lines.push("", `[提示] 有 ${missing.length} 个词不在密码表中：${missing.slice(0, 10).join(" ")}${missing.length > 10 ? " ..." : ""}`, "密码表与隐写时使用的词表不匹配，请换一张密码表。");
  }
  if (!clear.length) return lines.join("\n");
  let bytes;
  try { bytes = b64ToBytes(clear.join("")); } catch (e) {
    lines.push("", `Base64 还原失败：${e.message}`, `Base64 串（前 200 字符）：${clear.join("").slice(0, 200)}`);
    return lines.join("\n");
  }
  if (!bytes.length) { lines.push("", "还原结果为空，请检查词表是否正确。"); return lines.join("\n"); }
  const r = resultFor(bytes, "_Cloakify_outfile");
  lines.push("", r.textOut);
  return { text: lines.join("\n"), files: r.files };
}

function ttiDecodeRun(text, p) {
  const tokens = String(text ?? "").replace(/\r?\n/g, " ").split(/\s+/).filter(Boolean);
  if (!tokens.length) return "（空输入）";
  let bits = [], unknown = 0, note = "标准映射（63/127/191/255）";
  for (const t of tokens) {
    const m = TTI_BITS[t.trim()];
    if (m == null) unknown++; else bits.push(m);
  }
  if (!bits.length) {
    const values = new Set(tokens.filter((t) => /^-?\d+$/.test(t)).map(Number));
    if (values.size === 4) {
      const ordered = [...values].sort((a, b) => a - b);
      const map = new Map(ordered.map((v, i) => [String(v), i.toString(2).padStart(2, "0")]));
      unknown = 0;
      for (const t of tokens) {
        const m = map.get(t.trim());
        if (m == null) unknown++; else bits.push(m);
      }
      note = `自适应映射（按数值大小排序：${ordered.join(" < ")}）`;
    }
    if (!bits.length) return `未识别到有效的 TTI 数值。\n期望 63/127/191/255 四种数值（空格或换行分隔）；若全是别的数值，需恰好 4 种且可排序。本文件共 ${tokens.length} 个记号都无法识别。`;
  }
  const bitString = bits.join("");
  const usable = Math.floor(bitString.length / 8) * 8;
  const bytes = new Uint8Array(usable / 8);
  for (let i = 0; i < usable; i += 8) bytes[i / 8] = parseInt(bitString.slice(i, i + 8), 2);
  if (!bytes.length) return `识别到 ${bitString.length} 比特，不足 1 字节，无法还原。`;
  const r = resultFor(bytes, "_decoded");
  const lines = [
    `映射方式：${note}`,
    `有效数值：${bits.length} 个    无法识别：${unknown} 个`,
    `比特数：${bitString.length}    还原字节：${bytes.length}    丢弃尾比特：${bitString.length - usable}`,
  ];
  if (unknown) lines.push(`[提示] 有 ${unknown} 个记号不在映射表中，已跳过。`);
  lines.push("", r.textOut);
  return { text: lines.join("\n"), files: r.files };
}

register({
  id: "cloakify", cat: "stegoText", name: "Cloakify 词表隐写提取",
  desc: "隐写词（每行一个）+ 词表（key 参数，每行一个，对应 Base64 字符表）→ 还原隐藏数据；文本内联、二进制按魔数出下载产物。V8 file_tools/text_stego.py::cloakify_decode 口径。",
  params: [
    { key: "wordlist", label: "密码表（每行一个词）", type: "text", default: "" },
  ],
  run: cloakifyRun,
});

register({
  id: "ttiDecode", cat: "stegoText", name: "TTI 隐写解码",
  desc: "TTI 数值文本 → 2bit/值（标准 63/127/191/255，或恰好 4 种数值自适应）→ 还原字节；文本内联、二进制按魔数出下载产物。V8 file_tools/text_stego.py::tti_decode 口径。",
  params: [],
  run: ttiDecodeRun,
});

export { cloakifyRun, ttiDecodeRun };
