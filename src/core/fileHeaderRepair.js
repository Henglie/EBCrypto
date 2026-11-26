/**
 * 文件头检测与修复（filefmt / run 单向）
 *
 * 设计要点（与「只按扩展名补一段固定 hex」的做法区分）：
 *  1) 双源判定：扩展名 + 内容嗅探；两者冲突时以内容为准并显式报警，绝不按扩展名硬改。
 *  2) 修复分级：完整签名补全（含前缀缺失 k 字节）→ 仅覆写确实损坏的字节（最小改动）→ 结构校验。
 *  3) 安全：原件不动，产物另存 `<原名>.repaired<扩展名>`；小于 16 字节只报不修；
 *     超过 maxMB 只做检测；所有判定与改动逐字节写进报告。
 *
 * 签名依据：PNG(ISO/IEC 15948 §5.2)、JPEG(ITU T.81 §B.2.1)、GIF87a/89a 规范、
 * APPNOTE 6.3.x（ZIP/RAR 各自私有）、RIFF(WAVE/AVI/WEBP)、ISO/IEC 14496-12(ftyp)、
 * ELF gABI、PE/COFF、pcap/pcapng 规范、SQLite 文件格式、WASM 核心规范、tar(POSIX ustar)。
 */
import { register } from "./registry.js";

const MAX_GAP = 16;          // 允许缺失的前缀上限（超过即判定为「不是简单缺头」）
const MAX_FIX_BYTES = 8;     // 头部区允许「坏字节」上限
const MIN_REPAIR_LEN = 16;   // 小于此长度只报不修，避免把小文件截成一段签名

/** @type {{id:string,label:string,exts:string[],fixed:{off:number,hex:string}[],tail?:string,minLen?:number,verify?:Function,note?:string}[]} */
const FORMATS = [
  { id: "png", label: "PNG 图像", exts: ["png"], fixed: [{ off: 0, hex: "89504e470d0a1a0a" }], tail: "49454e44ae426082", minLen: 33, verify: verifyPng },
  { id: "jpg", label: "JPEG 图像", exts: ["jpg", "jpeg", "jpe", "jfif"], fixed: [{ off: 0, hex: "ffd8ff" }], tail: "ffd9", minLen: 4 },
  { id: "gif", label: "GIF 图像", exts: ["gif"], fixed: [{ off: 0, hex: "474946383961" }], altFixed: [[{ off: 0, hex: "474946383761" }]], tail: "3b", minLen: 10 },
  { id: "bmp", label: "BMP 图像", exts: ["bmp", "dib"], fixed: [{ off: 0, hex: "424d" }], minLen: 14, verify: verifyBmp },
  { id: "zip", label: "ZIP 归档", exts: ["zip", "docx", "xlsx", "pptx", "apk", "jar", "epub", "odt", "ods", "odp"], fixed: [{ off: 0, hex: "504b0304" }], altFixed: [[{ off: 0, hex: "504b0506" }], [{ off: 0, hex: "504b0708" }]], minLen: 22, verify: verifyZip },
  { id: "rar", label: "RAR 归档", exts: ["rar"], fixed: [{ off: 0, hex: "526172211a0700" }], altFixed: [[{ off: 0, hex: "526172211a070100" }]], minLen: 20 },
  { id: "7z", label: "7-Zip 归档", exts: ["7z"], fixed: [{ off: 0, hex: "377abcaf271c" }], minLen: 32 },
  { id: "gz", label: "GZIP 压缩", exts: ["gz", "tgz"], fixed: [{ off: 0, hex: "1f8b08" }], minLen: 18 },
  { id: "pdf", label: "PDF 文档", exts: ["pdf"], fixed: [{ off: 0, hex: "255044462d" }], tail: "2525454f46", minLen: 16 },
  { id: "tif", label: "TIFF 图像", exts: ["tif", "tiff"], fixed: [{ off: 0, hex: "49492a00" }], altFixed: [[{ off: 0, hex: "4d4d002a" }]], minLen: 8 },
  { id: "ico", label: "ICO/CUR 图标", exts: ["ico", "cur"], fixed: [{ off: 0, hex: "00000100" }], altFixed: [[{ off: 0, hex: "00000200" }]], minLen: 22 },
  { id: "wav", label: "WAVE 音频", exts: ["wav"], fixed: [{ off: 0, hex: "52494646" }, { off: 8, hex: "57415645" }], minLen: 44, verify: verifyRiff },
  { id: "avi", label: "AVI 视频", exts: ["avi"], fixed: [{ off: 0, hex: "52494646" }, { off: 8, hex: "41564920" }], minLen: 56, verify: verifyRiff },
  { id: "webp", label: "WebP 图像", exts: ["webp"], fixed: [{ off: 0, hex: "52494646" }, { off: 8, hex: "57454250" }], minLen: 30, verify: verifyRiff },
  { id: "mp4", label: "MP4/MOV（ISO BMFF）", exts: ["mp4", "m4v", "mov", "3gp", "heic", "heif"], fixed: [{ off: 4, hex: "66747970" }], minLen: 16 },
  { id: "flac", label: "FLAC 音频", exts: ["flac"], fixed: [{ off: 0, hex: "664c6143" }], minLen: 42 },
  { id: "mkv", label: "Matroska/WebM", exts: ["mkv", "webm"], fixed: [{ off: 0, hex: "1a45dfa3" }], minLen: 32 },
  { id: "ogg", label: "Ogg 容器", exts: ["ogg", "opus", "oga"], fixed: [{ off: 0, hex: "4f676753" }], minLen: 27 },
  { id: "cfb", label: "OLE/CFB 复合文档", exts: ["doc", "xls", "ppt", "msi", "vsd"], fixed: [{ off: 0, hex: "d0cf11e0a1b11ae1" }], minLen: 512 },
  { id: "elf", label: "ELF 可执行", exts: ["elf", "so", "o", "ko"], fixed: [{ off: 0, hex: "7f454c46" }], minLen: 52 },
  { id: "pe", label: "PE/DOS 可执行", exts: ["exe", "dll", "sys", "ocx", "cpl"], fixed: [{ off: 0, hex: "4d5a" }], minLen: 64 },
  { id: "pcap", label: "pcap 抓包", exts: ["pcap", "cap"], fixed: [{ off: 0, hex: "d4c3b2a1" }], altFixed: [[{ off: 0, hex: "a1b2c3d4" }], [{ off: 0, hex: "4d3cb2a1" }], [{ off: 0, hex: "a1b23c4d" }]], minLen: 24 },
  { id: "pcapng", label: "pcapng 抓包", exts: ["pcapng", "ntar"], fixed: [{ off: 0, hex: "0a0d0d0a" }], minLen: 28 },
  { id: "sqlite", label: "SQLite 数据库", exts: ["sqlite", "sqlite3", "db"], fixed: [{ off: 0, hex: "53514c69746520666f726d6174203300" }], minLen: 100 },
  { id: "wasm", label: "WebAssembly 模块", exts: ["wasm"], fixed: [{ off: 0, hex: "0061736d" }], minLen: 8 },
  { id: "tar", label: "tar 归档", exts: ["tar"], fixed: [{ off: 257, hex: "7573746172" }], minLen: 512 },
  { id: "rtf", label: "RTF 富文本", exts: ["rtf"], fixed: [{ off: 0, hex: "7b5c727466" }], minLen: 8 },
  { id: "psd", label: "Photoshop PSD", exts: ["psd"], fixed: [{ off: 0, hex: "38425053" }], minLen: 26 },
  { id: "mp3", label: "MP3 音频", exts: ["mp3"], fixed: [{ off: 0, hex: "494433" }], altFixed: [[{ off: 0, hex: "fffb" }], [{ off: 0, hex: "fff3" }], [{ off: 0, hex: "fff2" }]], minLen: 4 },
  { id: "java", label: "Java class", exts: ["class"], fixed: [{ off: 0, hex: "cafebabe" }], minLen: 24 },
];

// 扩展名 → 格式（同扩展名多个时取第一个）
const EXT_MAP = (() => {
  const m = new Map();
  for (const f of FORMATS) for (const e of f.exts) if (!m.has(e)) m.set(e, f.id);
  return m;
})();

const FORMAT_BY_ID = new Map(FORMATS.map((f) => [f.id, f]));

// ---------- 基础工具 ----------
function u8(x) {
  if (x instanceof Uint8Array) return x;
  if (x instanceof ArrayBuffer) return new Uint8Array(x);
  if (ArrayBuffer.isView(x)) return new Uint8Array(x.buffer, x.byteOffset, x.byteLength);
  return null;
}

function toBytes(input, p) {
  const raw = p && u8(p.rawBytes);
  if (raw && raw.length) return raw;
  const s = typeof input === "string" ? input : "";
  const compact = s.replace(/\s+/g, "");
  if (compact.length >= 2 && compact.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(compact)) {
    const out = new Uint8Array(compact.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(compact.substr(i * 2, 2), 16);
    return out;
  }
  return new TextEncoder().encode(s);
}

function hexOf(bytes, from = 0, len = 16) {
  return Array.from(bytes.subarray(from, Math.min(bytes.length, from + len)))
    .map((b) => b.toString(16).padStart(2, "0")).join(" ");
}

function asciiOf(bytes, from = 0, len = 16) {
  return Array.from(bytes.subarray(from, Math.min(bytes.length, from + len)))
    .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : ".")).join("");
}

function bytesOfHex(h) {
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
  return out;
}

function formatOfExt(name) {
  const m = /\.([A-Za-z0-9]{1,8})$/.exec(String(name || ""));
  if (!m) return { ext: "", id: "" };
  const ext = m[1].toLowerCase();
  return { ext, id: EXT_MAP.get(ext) || "" };
}

function baseName(name) {
  const s = String(name || "").replace(/^.*[\\/]/, "");
  return s || "input.bin";
}

// ---------- 签名匹配 ----------
function segmentsOf(fmt) {
  return [fmt.fixed, ...(fmt.altFixed || [])];
}

/** 逐段比对；返回 {diffs:[{off,got,want}], total} */
function diffSegments(data, segs) {
  const diffs = [];
  for (const s of segs) {
    const want = bytesOfHex(s.hex);
    if (data.length < s.off + want.length) {
      return { diffs: null, short: true };
    }
    for (let i = 0; i < want.length; i++) {
      const got = data[s.off + i];
      if (got !== want[i]) diffs.push({ off: s.off + i, got, want: want[i] });
    }
  }
  return { diffs, short: false };
}

/** 前缀缺失 k 字节：data 开头正好等于所有固定段「左移 k」后的内容 */
function findPrefixGap(data, segs) {
  const sorted = segs.slice().sort((a, b) => a.off - b.off);
  const first = sorted[0];
  const firstBytes = bytesOfHex(first.hex);
  // 证据下限：至少要能对上 2~4 个字节，否则「只剩 1 字节相同」会把随机数据认成缺头
  const need = Math.min(4, Math.max(2, Math.floor(firstBytes.length / 2)));
  const limit = Math.min(firstBytes.length - need, MAX_GAP);
  for (let k = 1; k <= limit; k++) {
    if (first.off !== 0) break; // 只支持「从头缺」的判定
    if (data.length < firstBytes.length - k) continue;
    let ok = true;
    // 第一段：data[0 .. len-k] 应等于 firstBytes[k:]
    for (let i = 0; i < firstBytes.length - k; i++) {
      if (data[i] !== firstBytes[k + i]) { ok = false; break; }
    }
    if (!ok) continue;
    // 其余段：整体左移 k
    for (const s of sorted.slice(1)) {
      const want = bytesOfHex(s.hex);
      const at = s.off - k;
      if (at < 0 || data.length < at + want.length) { ok = false; break; }
      for (let i = 0; i < want.length; i++) {
        if (data[at + i] !== want[i]) { ok = false; break; }
      }
      if (!ok) break;
    }
    if (ok) return k;
  }
  return 0;
}

function sigLen(segs) {
  return segs.reduce((s, x) => s + x.hex.length / 2, 0);
}

/**
 * 内容嗅探：返回按置信度排序的候选
 * 评分要点：签名越长越可信；「坏字节」必须同时满足绝对上限与比例上限，
 * 否则 2 字节签名（BMP）会在随机数据上比 8 字节签名（PNG）更容易低差异胜出。
 */
function sniff(data) {
  const out = [];
  for (const fmt of FORMATS) {
    let best = null;
    // 「签名完全匹配」不看最小长度（被截断的归档仍应被认出）；
    // 但「坏字节 / 缺头」这类弱证据要求文件本身达到该格式最小结构长度。
    const longEnough = !fmt.minLen || data.length >= fmt.minLen;
    for (const segs of segmentsOf(fmt)) {
      const len = sigLen(segs);
      const r = diffSegments(data, segs);
      if (r.short) continue;
      const diffs = r.diffs.length;
      if (diffs === 0) {
        const score = 1000 + len;
        if (!best || score > best.score) best = { status: "exact", diffs: 0, segs, score };
        continue;
      }
      if (!longEnough) continue;
      const fixLimit = Math.min(MAX_FIX_BYTES, Math.max(1, Math.floor(len / 2)));
      const ratioOk = diffs / len <= 0.5;
      if (diffs <= fixLimit && ratioOk) {
        const score = 600 - diffs * 10 + len;
        if (!best || score > best.score) best = { status: "corrupt", diffs, segs, score };
      }
    }
    for (const segs of segmentsOf(fmt)) {
      if (!longEnough) break;
      const k = findPrefixGap(data, segs);
      if (!k) continue;
      const score = 900 - k * 5 + sigLen(segs);
      if (!best || (best.status !== "exact" && score > best.score)) {
        best = { status: "gap", gap: k, diffs: 0, segs, score };
      }
      break;
    }
    if (best) out.push({ fmt, ...best });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

// ---------- 结构校验 ----------
function crc32(bytes) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < bytes.length; n++) {
    c = (crc ^ bytes[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function verifyPng(b) {
  const notes = [];
  let ok = true;
  if (b.length < 33) return { ok: false, notes: ["长度不足 33 字节，无法构成 PNG"] };
  const isIHDR = String.fromCharCode(b[12], b[13], b[14], b[15]) === "IHDR";
  notes.push(isIHDR ? "IHDR 块存在" : "偏移 12 处不是 IHDR 块");
  ok = ok && isIHDR;
  if (isIHDR) {
    const len = (b[8] << 24 | b[9] << 16 | b[10] << 8 | b[11]) >>> 0;
    const crcAt = 16 + len;
    if (crcAt + 4 <= b.length) {
      const want = ((b[crcAt] << 24 | b[crcAt + 1] << 16 | b[crcAt + 2] << 8 | b[crcAt + 3]) >>> 0);
      const got = crc32(b.subarray(12, crcAt));
      notes.push(want === got ? "IHDR CRC 通过" : `IHDR CRC 不符（文件 ${want.toString(16)} / 计算 ${got.toString(16)}）`);
      ok = ok && want === got;
    } else {
      notes.push("IHDR 数据被截断");
      ok = false;
    }
  }
  const iend = b.length >= 8 && b[b.length - 8] === 0x49 && b[b.length - 7] === 0x45 && b[b.length - 6] === 0x4e && b[b.length - 5] === 0x44;
  notes.push(iend ? "IEND 结束块存在" : "末尾未见 IEND（可能被截断）");
  ok = ok && iend;
  return { ok, notes };
}

function verifyZip(b) {
  const notes = [];
  const start = Math.max(0, b.length - 65557);
  let eocd = -1;
  for (let i = b.length - 22; i >= start; i--) {
    if (b[i] === 0x50 && b[i + 1] === 0x4b && b[i + 2] === 0x05 && b[i + 3] === 0x06) { eocd = i; break; }
  }
  if (eocd < 0) return { ok: false, notes: ["未找到 EOCD（PK\\x05\\x06），归档不完整"] };
  const commentLen = b[eocd + 20] | (b[eocd + 21] << 8);
  notes.push(`EOCD 位于偏移 ${eocd}，注释 ${commentLen} 字节`);
  const ok = eocd + 22 + commentLen === b.length;
  notes.push(ok ? "EOCD 位置与文件长度自洽" : "EOCD 之后仍有数据（尾部被追加或长度字段异常）");
  return { ok, notes };
}

function verifyBmp(b) {
  if (b.length < 6) return { ok: false, notes: ["长度不足"] };
  const size = (b[2] | (b[3] << 8) | (b[4] << 16) | (b[5] << 24)) >>> 0;
  const ok = size === b.length;
  return { ok, notes: [ok ? `BMP 头部声明长度与文件一致（${size}）` : `BMP 声明长度 ${size} ≠ 实际 ${b.length}`] };
}

function verifyRiff(b) {
  if (b.length < 12) return { ok: false, notes: ["长度不足 12 字节"] };
  const size = (b[4] | (b[5] << 8) | (b[6] << 16) | (b[7] << 24)) >>> 0;
  const expect = b.length - 8;
  const tag = String.fromCharCode(b[8], b[9], b[10], b[11]);
  const ok = size === expect;
  return {
    ok,
    notes: [
      `RIFF 声明长度 ${size}，实际 ${expect}${ok ? "（一致）" : "（不一致：被截断或长度字段损坏）"}`,
      `格式标识 ${JSON.stringify(tag)}`,
    ],
  };
}

function verifyTail(b, hex) {
  const want = bytesOfHex(hex);
  if (b.length < want.length) return { ok: false, notes: [`长度不足 ${want.length} 字节`] };
  const got = b.subarray(b.length - want.length);
  let ok = true;
  for (let i = 0; i < want.length; i++) if (got[i] !== want[i]) ok = false;
  return { ok, notes: [ok ? `尾部结束标记存在（${hex}）` : `尾部未见结束标记 ${hex}（可能被截断）`] };
}

function structureCheck(fmt, b) {
  if (fmt.verify) return fmt.verify(b);
  const notes = [];
  if (b.length < (fmt.minLen || 0)) notes.push(`长度 ${b.length} 小于该格式最小长度 ${fmt.minLen}`);
  if (fmt.tail) {
    const t = verifyTail(b, fmt.tail);
    notes.push(...t.notes);
    return { ok: t.ok, notes };
  }
  return { ok: notes.length === 0, notes: notes.length ? notes : ["仅校验签名（该格式无轻量结束标记）"] };
}

// ---------- 主流程 ----------
function describeCandidate(c) {
  const label = `${c.fmt.label}（${c.fmt.id}）`;
  if (c.status === "exact") return `${label}：签名完全匹配`;
  if (c.status === "gap") return `${label}：缺前 ${c.gap} 字节签名`;
  return `${label}：头部有 ${c.diffs} 个字节不符`;
}

/**
 * @param {string} input 文本输入（无文件时为 hex 或 UTF-8）
 * @param {object} p 参数：mode(detect|repair)、format(auto|<id>)、maxMB、rawBytes/rawFileName
 * @returns {{text:string, files?:{name:string,mime:string,bytes:Uint8Array}[]}}
 */
function fileHeaderRepairRun(input, p = {}) {
  const data = toBytes(input, p);
  const fileName = baseName(p.rawFileName || p.fileName || "");
  const { ext, id: extFormatId } = formatOfExt(fileName);
  const mode = p.mode === "detect" ? "detect" : "repair";
  const maxMB = Math.max(1, Number(p.maxMB) || 64);
  const forced = p.format && p.format !== "auto" ? FORMAT_BY_ID.get(String(p.format)) : null;

  const lines = [];
  lines.push(`文件头检测与修复 · ${fileName}`);
  lines.push(`大小 ${data.length} 字节；前 16 字节：${hexOf(data, 0, 16)}  |${asciiOf(data, 0, 16)}|`);

  if (!data.length) {
    return { text: "输入为空：请拖入文件，或在输入区填十六进制字节。" };
  }

  // 扩展名 → 期望格式
  const extFmt = extFormatId ? FORMAT_BY_ID.get(extFormatId) : null;
  lines.push(`扩展名 .${ext || "(无)"} → ${extFmt ? extFmt.label : "不在已知表内"}`);

  // 内容嗅探
  const cands = sniff(data);
  lines.push(`内容嗅探：${cands.length ? cands.slice(0, 3).map(describeCandidate).join("；") : "未识别出已知格式"}`);
  const primary = forced ? { fmt: forced, ...(cands.find((c) => c.fmt.id === forced.id) || { status: "unknown", diffs: 0 }) } : cands[0];
  if (forced) lines.push(`已按参数强制指定格式：${forced.label}`);

  if (!primary || primary.status === "unknown") {
    lines.push("");
    lines.push("结论：无法判定格式，未做任何修改。");
    lines.push("建议：确认扩展名是否正确，或先用十六进制视图核对开头 16 字节。");
    return { text: lines.join("\n") };
  }

  const fmt = primary.fmt;
  const conflict = extFmt && extFmt.id !== fmt.id;
  if (conflict) {
    lines.push(`⚠ 扩展名与内容不一致：扩展名指向 ${extFmt.label}，内容更像 ${fmt.label}。以内容为准，不按扩展名改写。`);
  }
  // 弱证据门槛：短签名「只差 1~2 字节」或用尾部几个字节对齐，都极易撞上别的格式。
  //   实测反例：TTF(00 01 00 00) 被认成 ICO 缺 1 字节；pyc(cb0d0d0a) 被认成 pcapng 差 1 字节；
  //   纯文本被认成 PE 差 1 字节。故：坏字节必须先由扩展名/显式参数背书；缺头要有 ≥6 字节证据。
  const firstSeg = primary.segs ? primary.segs.slice().sort((a, b) => a.off - b.off)[0] : null;
  const gapEvidence = primary.status === "gap" && firstSeg ? firstSeg.hex.length / 2 - primary.gap : 0;
  const trusted = !!forced || !!(extFmt && extFmt.id === fmt.id);
  const weak = !trusted && (primary.status === "corrupt" || (primary.status === "gap" && gapEvidence < 6));

  const before = structureCheck(fmt, data);
  lines.push("");
  lines.push(`结构校验（修复前）：${before.ok ? "通过" : "未通过"}`);
  for (const n of before.notes) lines.push(`  · ${n}`);

  // 决定性判定
  let action = "none";
  let repaired = null;
  let detail = "";

  if (primary.status === "exact") {
    detail = "签名完整，无需修复";
  } else if (data.length < MIN_REPAIR_LEN) {
    detail = `文件仅 ${data.length} 字节（< ${MIN_REPAIR_LEN}），只检测不修复，避免把内容截成一段签名`;
  } else if (data.length > maxMB * 1024 * 1024) {
    detail = `文件 ${(data.length / 1048576).toFixed(1)}MB 超过处理上限 ${maxMB}MB：只检测不修复（避免整份复制占内存）`;
  } else if (mode === "detect") {
    detail = "仅检测模式：已给出判定，未生成产物";
  } else if (primary.status === "gap" && primary.gap > 0) {
    const lead = bytesOfHex(primary.segs.slice().sort((a, b) => a.off - b.off)[0].hex).subarray(0, primary.gap);
    repaired = new Uint8Array(lead.length + data.length);
    repaired.set(lead, 0);
    repaired.set(data, lead.length);
    action = "prepend";
    detail = `补齐缺失的 ${primary.gap} 字节签名（${Array.from(lead).map((b) => b.toString(16).padStart(2, "0")).join(" ")}）`;
  } else if (weak) {
    detail = primary.status === "gap"
      ? `只对上 ${gapEvidence} 字节签名（证据不足 6 字节），扩展名也不支持 ${fmt.label}：按低置信处理，不做猜测式补头。可把「格式」参数显式指定后再试`
      : `内容只是「近似」${fmt.label}（差 ${primary.diffs} 字节），扩展名也不支持该格式：按低置信处理，不做猜测式改写。可把「格式」参数显式指定为该类型后再试`;
  } else if (primary.status === "corrupt" && primary.diffs > 0 && primary.diffs <= MAX_FIX_BYTES) {
    const out = new Uint8Array(data);
    const changed = [];
    for (const seg of primary.segs) {
      const want = bytesOfHex(seg.hex);
      for (let i = 0; i < want.length; i++) {
        if (out[seg.off + i] !== want[i]) {
          changed.push(`${seg.off + i}: ${out[seg.off + i].toString(16).padStart(2, "0")} → ${want[i].toString(16).padStart(2, "0")}`);
          out[seg.off + i] = want[i];
        }
      }
    }
    repaired = out;
    action = "overwrite";
    detail = `覆写 ${changed.length} 个损坏字节（${changed.join("，")}）——只动坏字节，不整段重写`;
  } else {
    detail = `头部损坏 ${primary.diffs} 字节，超过自动修复上限 ${MAX_FIX_BYTES}；不做猜测式改写`;
  }

  lines.push("");
  lines.push(`判定：${detail}`);
  if (repaired) lines.push(`修复后前 16 字节：${hexOf(repaired, 0, 16)}  |${asciiOf(repaired, 0, 16)}|`);

  if (!repaired) {
    if (action === "none" && primary.status !== "exact") {
      lines.push("");
      lines.push("未生成产物：原文件保持不变。");
    }
    return { text: lines.join("\n") };
  }

  const after = structureCheck(fmt, repaired);
  lines.push("");
  lines.push(`结构校验（修复后）：${after.ok ? "通过" : "仍未通过"}`);
  for (const n of after.notes) lines.push(`  · ${n}`);

  const suffix = String(p.suffix || ".repaired").replace(/[\\/:*?"<>|]/g, "");
  const dot = fileName.lastIndexOf(".");
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName;
  const tail = dot > 0 ? fileName.slice(dot) : `.${fmt.exts[0]}`;
  const outName = `${stem}${suffix || ".repaired"}${tail}`;

  lines.push("");
  lines.push(`产物：${outName}（${repaired.length} 字节，${repaired.length - data.length >= 0 ? "+" : ""}${repaired.length - data.length}；原文件未修改）`);
  if (!after.ok) lines.push("提示：结构校验未通过说明损坏不止文件头，本工具只修头部，不重建数据。");

  return { text: lines.join("\n"), files: [{ name: outName, mime: "application/octet-stream", bytes: repaired }] };
}

register({
  id: "fileHeaderRepair",
  cat: "filefmt",
  name: "文件头检测与修复",
  desc: "双源判定（扩展名 + 内容嗅探）修复文件头：支持 PNG/JPEG/GIF/BMP/ZIP/RAR/7z/GZIP/PDF/TIFF/ICO/WAV/AVI/WebP/MP4/FLAC/MKV/Ogg/CFB/ELF/PE/pcap/pcapng/SQLite/WASM/tar/RTF/PSD/MP3/class 共 30 类；能识别「缺前 k 字节」与「头部坏字节」两种损伤，只覆写真正坏掉的字节，修完再做结构校验（PNG IHDR+CRC+IEND、ZIP EOCD、RIFF 长度、JPEG/GIF/PDF 结束标记、BMP 长度）；原件不动，产物另存 .repaired；小于 16 字节或损坏超限只报不修",
  params: [
    { key: "mode", label: "模式", type: "select", default: "repair", options: [
      { value: "repair", label: "检测并修复（生成新文件）" },
      { value: "detect", label: "仅检测（不改动）" },
    ] },
    { key: "format", label: "格式（默认自动嗅探）", type: "select", default: "auto", options: [
      { value: "auto", label: "自动" },
      ...FORMATS.map((f) => ({ value: f.id, label: f.label })),
    ] },
    { key: "suffix", label: "产物后缀", type: "text", default: ".repaired" },
    { key: "maxMB", label: "处理上限（MB）", type: "number", default: 64 },
  ],
  run: fileHeaderRepairRun,
  acceptsBytes: true,
});

export { fileHeaderRepairRun, FORMATS, sniff, structureCheck, findPrefixGap, crc32 };
