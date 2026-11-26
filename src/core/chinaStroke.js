/*
 * chinaStroke.js — 汉字笔画码（双向）。
 *
 * 算法来源：V8.0.1 反编源码 ctf_tools/codecs/char_cipher_3/china_stroke.py
 *   chinafont_decode() / chinafont_encode()，码表逐字导出见 lib/chinaStrokeTables.js。
 *
 * 口径（不是普通「汉字→数字」替换表，务必按源码）：
 *   decode: 每字查笔画数 b → 数字 b-1；表外字符原样；按空格切分数字串，每段 chr(段) 还原
 *   encode: 明文先转 ord 十进制串（每段 ord 之间留空格），每位数字 d 从
 *           chinanumber[String(d+1)] 随机选一笔画数=d+1 的汉字；空格原样保留
 * encode 的随机性来自源码的 random.choice —— 同笔画汉字可互换，解码结果不变。
 */
import { register } from "./registry.js";
import { CHINAFONT_DICT, CHINANUMBER } from "./lib/chinaStrokeTables.js";

function decode(text) {
  let numstr = "";
  for (const ch of String(text ?? "")) {
    numstr += ch in CHINAFONT_DICT ? String(Number(CHINAFONT_DICT[ch]) - 1) : ch;
  }
  return numstr.split(" ").map((seg) => {
    if (seg === "") return "";
    const n = Number(seg);
    if (!Number.isFinite(n) || n < 0 || n > 0x10ffff) return seg;
    try { return String.fromCodePoint(n); } catch { return seg; }
  }).join("");
}

function encode(text) {
  const ords = Array.from(String(text ?? ""), (ch) => String(ch.codePointAt(0)));
  let out = "";
  const digits = ords.join(" ");
  for (const ch of digits) {
    if (ch >= "0" && ch <= "9") {
      const pool = CHINANUMBER[String(Number(ch) + 1)];
      out += pool ? pool[Math.floor(Math.random() * pool.length)] : ch;
    } else {
      out += ch;
    }
  }
  return out;
}

register({
  id: "chinaStroke",
  cat: "cn",
  name: "汉字笔画码",
  desc: "汉字↔笔画数数字流：按 V8 china_stroke.py 的 3471 字笔画表，每位数字随机取同笔画汉字（编码）/ 笔画数-1 还原（解码），双向。",
  params: [],
  encode,
  decode,
});

export { encode as chinaStrokeEncode, decode as chinaStrokeDecode };
