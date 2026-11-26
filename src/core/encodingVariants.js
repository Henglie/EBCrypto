/*
 * encodingVariants.js — Base/编码变体口径补齐（八卦符 / 零宽 lib / Base85b）。
 *
 * 权威来源（V8.0.1 反编源码，逐字导出/逐函数实跑）：
 *   codecs/char_cipher_3/bagua.py::bagua_encrypto / bagua_decrypto
 *   vendor/zbCrypto/zb_zero_width_lib.py::t2z / z2t / encode / decode / extract
 *   codecs/baserot/base85b_decode.py::_STANDARD_B85（RFC 1924 字典）
 *   Python 标准库 base64.b85encode/b85decode 的分组与尾组截断语义
 * 注释只写算法出处，不出现任何竞品名称。
 */
import { register } from "./registry.js";

const te = (s) => new TextEncoder().encode(String(s ?? ""));
const td = (b) => new TextDecoder("utf-8", { fatal: false }).decode(b);

// ============ 八卦符（三套表，8 卦 × 3bit / 八进制三分组）============
const BAGUA1 = ["☰", "☱", "☲", "☳", "☴", "☵", "☶", "☷"];
const BAGUA2 = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"];
const BAGUA3 = { "震": "001", "离": "101", "兑": "011", "乾": "111", "坤": "000", "艮": "100", "坎": "010", "巽": "110" };
const BAGUA3_REV = Object.fromEntries(Object.entries(BAGUA3).map(([k, v]) => [v, k]));

function baguaEncode(text) {
  const oct = Array.from(te(text), (b) => b.toString(8).padStart(3, "0")).join("");
  const b1 = Array.from(oct, (d) => BAGUA1[Number(d)]).join("");
  const b2 = Array.from(oct, (d) => BAGUA2[Number(d)]).join("");
  let b3 = "";
  for (const ch of String(text ?? "")) {
    const bits = ch.codePointAt(0).toString(2).padStart(9, "0");
    for (let i = 0; i < bits.length; i += 3) b3 += BAGUA3_REV[bits.slice(i, i + 3)];
  }
  return `八卦1：${b1}\n八卦2：${b2}\n八卦3：${b3}`;
}
function baguaDecode(text, p) {
  const s = String(text ?? "").replace(/^八卦[123]：/, "").trim();
  const variant = (p && p.variant) || "auto";
  const chars = Array.from(s);
  if (variant === "3") {
    let bstr = "";
    chars.forEach((ch, i) => { bstr += (i % 3 === 0 ? " " : "") + (BAGUA3[ch] ?? ch); });
    return bstr.trim().split(/\s+/).map((b) => {
      const n = parseInt(b, 2);
      return Number.isFinite(n) ? String.fromCodePoint(n) : b;
    }).join("");
  }
  let idx = chars.map((ch) => BAGUA1.indexOf(ch));
  if (idx.some((i) => i < 0)) idx = chars.map((ch) => BAGUA2.indexOf(ch));
  if (idx.some((i) => i < 0)) return "未识别的八卦符（仅接受 ☰-☷ 符号或乾坤巽震兑离艮坎汉字）";
  const oct = idx.join("");
  const out = new Uint8Array(Math.floor(oct.length / 3));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(oct.slice(i * 3, i * 3 + 3), 8);
  return td(out);
}

// ============ zero-width-lib（6 字符五进制零宽）============
const ZW = ["\u200e", "\u200f", "\u200c", "\u200d", "\ufeff", "\u200b"]; // LRM/RLM/ZWNJ/ZWJ/ZWNBSP/ZWSP
const ZW_SET = new Set(ZW);
const ZW_REV = Object.fromEntries(ZW.map((ch, i) => [ch, i]));
function toBase5(n) {
  if (n <= 0) return "";
  let out = "";
  while (n > 0) { out = String(n % 5) + out; n = Math.floor(n / 5); }
  return out;
}
function textToZw(text) {
  return Array.from(String(text ?? ""), (ch) => Array.from(toBase5(ch.codePointAt(0)), (d) => ZW[Number(d)]).join("") + ZW[5]).join("").slice(0, -1);
}
function zwToText(z) {
  const s = String(z ?? "");
  if (!s) return "";
  return s.split(ZW[5]).map((seg) => {
    const digits = Array.from(seg, (ch) => (ch in ZW_REV ? String(ZW_REV[ch]) : "")).join("");
    const n = parseInt(digits, 5);
    return Number.isFinite(n) ? String.fromCodePoint(n) : "";
  }).join("");
}
function zwLibEncode(text, p) {
  const cover = String(text ?? "");
  const hidden = String((p && p.hidden) ?? "");
  const hid = textToZw(hidden);
  return cover ? cover.slice(0, 1) + hid + cover.slice(1) : hid;
}
function zwLibDecode(text) {
  const s = String(text ?? "");
  const vis = Array.from(s).filter((ch) => !ZW_SET.has(ch));
  const first = Array.from(s).findIndex((ch) => !ZW_SET.has(ch));
  const rest = first < 0 ? [] : Array.from(s).slice(first + 1);
  const second = rest.findIndex((ch) => !ZW_SET.has(ch));
  let hidden = "";
  if (second >= 0) hidden = Array.from(s).slice(first + 1, first + 1 + second).filter((ch) => ZW_SET.has(ch)).join("");
  else hidden = Array.from(s).filter((ch) => ZW_SET.has(ch)).join("");
  void vis;
  return zwToText(hidden);
}

// ============ Base85b（RFC 1924 / Python b85 口径，支持任意长度与自定义字典）============
const B85 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~";
function dictOf(p) {
  const k = String((p && p.dict) || "");
  return k.length >= 85 ? k.slice(0, 85) : B85;
}
function b85Encode(bytes, dict = B85) {
  const pad = (4 - (bytes.length % 4)) % 4;
  const b = Uint8Array.from([...bytes, ...new Array(pad).fill(0)]);
  const chunks = [];
  for (let i = 0; i < b.length; i += 4) {
    let w = ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
    const c2 = (i) => dict[Math.floor(i / 85)] + dict[i % 85];
    chunks.push(c2(Math.floor(w / 614125)) + c2(Math.floor(w / 85) % 7225) + dict[w % 85]);
  }
  let out = chunks.join("");
  if (pad) out = out.slice(0, -pad);
  return out;
}
function b85Decode(s0, dict = B85) {
  let s = String(s0 ?? "").replace(/\s+/g, "");
  const pad = (5 - (s.length % 5)) % 5;
  s += "~".repeat(pad);
  const rev = Object.fromEntries(Array.from(dict, (ch, i) => [ch, i]));
  const out = [];
  for (let i = 0; i < s.length; i += 5) {
    let acc = 0;
    for (const ch of s.slice(i, i + 5)) {
      if (!(ch in rev)) throw new Error(`非法 base85 字符：${ch}`);
      acc = acc * 85 + rev[ch];
    }
    out.push((acc >>> 24) & 255, (acc >>> 16) & 255, (acc >>> 8) & 255, acc & 255);
  }
  return Uint8Array.from(out.slice(0, out.length - pad));
}

register({
  id: "baguaCodec", cat: "fancy", name: "八卦符编码",
  desc: "8 卦 3-bit 口径三套表：☰-☷ 符号 / 乾坤汉字（按 UTF-8 字节每字节 3 位八进制）/ 震离兑乾…（按 Unicode 码点 9 位三组）。V8 char_cipher_3/bagua.py。",
  params: [
    { key: "variant", label: "解码变体", type: "select", default: "auto", options: [
      { value: "auto", label: "自动（符号/汉字→字节）" }, { value: "3", label: "八卦3（3-bit 汉字→Unicode）" },
    ] },
  ],
  encode: (text) => baguaEncode(text),
  decode: (text, p) => baguaDecode(text, p),
});

register({
  id: "zeroWidthLib", cat: "stegoText", name: "零宽字符 zero-width-lib",
  desc: "6 个零宽字符的五进制隐写（U+200E/200F/200C/200D/FEFF/200B）：隐藏文本逐字符 ord→5 进制→零宽串，插在载体首字符之后；解码抽取并还原。V8 vendor/zbCrypto/zb_zero_width_lib.py。",
  params: [
    { key: "hidden", label: "要隐藏的文本（编码时填）", type: "text", default: "" },
  ],
  encode: (text, p) => zwLibEncode(text, p),
  decode: (text) => zwLibDecode(text),
});

register({
  id: "base85b", cat: "base", name: "Base85(b) RFC 1924",
  desc: "RFC 1924 Base85（Python b85 口径，任意长度，尾组 2-4 字符）；key 可给 ≥85 字符自定义字典（取前 85 个映射到标准字典）。V8 baserot/base85b_decode.py。",
  params: [
    { key: "dict", label: "自定义字典（≥85 字符，留空用 RFC 1924 标准表）", type: "text", default: "" },
  ],
  encode: (text, p) => td(b85Encode(te(text), dictOf(p))),
  decode: (text, p) => td(b85Decode(text, dictOf(p))),
});

export { baguaEncode, baguaDecode, zwLibEncode, zwLibDecode, b85Encode, b85Decode };
