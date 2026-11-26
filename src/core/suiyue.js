/*
 * suiyue.js — 随波逐流「随曰」加解密（双向，异步）。
 *
 * 算法来源：V8.0.1 反编源码
 *   ctf_tools/codecs/char_cipher_4/sbzl_suiyue.py
 *   ctf_tools/vendor/zbSuiyue/SuiYue.py::encrypt / decrypt / derive_encryption_keys /
 *   base64_to_chinese / chinese_to_base64 / CHARACTER_SETS
 * 复用的现成原语：poly1305.js 的 ChaCha20-Poly1305、modern.js 的 AES-CTR、
 *   compress.js 的安全 zlib 流、randSource.js 的随机源。
 *
 * 密文结构（对齐源码）：
 *   salt(16) ‖ chachaNonce(12) ‖ ChaCha20-Poly1305(AES-CTR(zlib(明文))) ‖ tag(16)
 *   → 标准 Base64 → 每个 Base64 字符随机取同键水字旁汉字（解码侧查反表唯一）
 * 密钥派生：PBKDF2-HMAC-SHA256(pwd, salt, 500000, 64)
 *   → HKDF-Extract(HMAC-SHA256, key=b'') → Expand(info="AES-CTR"/"ChaCha20", 32B)
 * 默认密码：源码 DEFAULT_PASSWORD 常量（与 V8 一致，空口令即用它）。
 */
import { register } from "./registry.js";
import { chacha20Poly1305Encrypt, chacha20Poly1305Decrypt } from "./poly1305.js";
import { aesEncrypt, aesDecrypt } from "./modern.js";
import { streamCompress, streamDecompress } from "./compress.js";
import { randomBytes } from "./randSource.js";
import { SUIYUE_CHARACTER_SETS as SETS } from "./lib/suiyueTables.js";

const DEFAULT_PASSWORD = "39d68eef8be0f55de9916b927ed50b9c64994f4ab595aef03c5feaaed84d27b5";
const te = (s) => new TextEncoder().encode(String(s ?? ""));
const td = (b) => new TextDecoder("utf-8", { ignoreBOM: true }).decode(b);
const concat = (...xs) => {
  const out = new Uint8Array(xs.reduce((n, x) => n + x.length, 0));
  let p = 0;
  for (const x of xs) { out.set(x, p); p += x.length; }
  return out;
};
const REV = {};
for (const [b64, chars] of Object.entries(SETS)) for (const ch of chars) REV[ch] = b64;
const b64Encode = (bytes) => {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};
const b64Decode = (s) => {
  const bin = atob(String(s).replace(/\s+/g, ""));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
const chineseToB64 = (text) => Array.from(String(text ?? ""), (ch) => REV[ch] ?? ch).join("");
const b64ToChinese = (b64) => Array.from(b64, (ch) => (SETS[ch] ? SETS[ch][0] : ch)).join("");

async function hmacSha256(key, data) {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, data));
}
async function deriveKeys(password, salt) {
  const pbkdfKey = await crypto.subtle.importKey("raw", te(password), "PBKDF2", false, ["deriveBits"]);
  const master = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 500000, hash: "SHA-256" }, pbkdfKey, 64 * 8));
  // HKDF-Extract（源码 hkdf_extract(salt=b'', ikm=master)）
  // HMAC 空 key 会被零填充到块长（SHA-256=64B），等价于 64 个 0 字节的 key；
  // WebCrypto 拒绝 0 长 key，故显式填 64 个 0，语义与 Python hmac.new(b'', ...) 一致。
  const prk = await hmacSha256(new Uint8Array(64), master);
  // HKDF-Expand（源码 hkdf_expand(prk, info, 32)：HMAC(prk, b'' ‖ info ‖ 0x01)[:32]）
  const expand = async (info) => (await hmacSha256(prk, concat(new Uint8Array(0), te(info), Uint8Array.from([1])))).slice(0, 32);
  return { aesKey: await expand("AES-CTR"), chachaKey: await expand("ChaCha20") };
}
const aesCtr = (data, key, nonce8) => aesEncrypt(data, key, {
  mode: "CTR", iv: concat(nonce8, new Uint8Array(8)), pad: false,
});
const aesCtrDec = (data, key, nonce8) => aesDecrypt(data, key, {
  mode: "CTR", iv: concat(nonce8, new Uint8Array(8)), pad: false,
});

async function encode(text, params = {}) {
  const pwd = (params && params.password) || DEFAULT_PASSWORD;
  const salt = randomBytes(16);
  const { aesKey, chachaKey } = await deriveKeys(pwd, salt);
  const compressed = await streamCompress("deflate", te(text));
  const aesNonce = randomBytes(8);
  const aesCt = aesCtr(compressed, aesKey, aesNonce);
  const inner = concat(aesNonce, aesCt);
  const chachaNonce = randomBytes(12);
  const { ciphertext, tag } = chacha20Poly1305Encrypt(chachaKey, chachaNonce, inner, undefined);
  const b64 = b64Encode(concat(salt, chachaNonce, ciphertext, tag));
  return params && params.rawBase64 ? b64 : b64ToChinese(b64);
}

async function decode(text, params = {}) {
  const pwd = (params && params.password) || DEFAULT_PASSWORD;
  let b64 = String(text ?? "").replace(/\s+/g, "");
  let raw;
  try { raw = b64Decode(b64); } catch { raw = b64Decode(chineseToB64(b64)); }
  if (raw.length < 16 + 12 + 1 + 16) throw new Error("随曰密文过短");
  const salt = raw.slice(0, 16);
  const nonce = raw.slice(16, 28);
  const body = raw.slice(28);
  const ct = body.slice(0, -16), tag = body.slice(-16);
  const { aesKey, chachaKey } = await deriveKeys(pwd, salt);
  const res = chacha20Poly1305Decrypt(chachaKey, nonce, ct, tag, undefined);
  if (!res.ok) throw new Error("随曰认证失败（密码错误或密文损坏）");
  const aesNonce = res.plaintext.slice(0, 8);
  const compressed = aesCtrDec(res.plaintext.slice(8), aesKey, aesNonce);
  for (const fmt of ["deflate", "deflate-raw"]) {
    try { return td(await streamDecompress(fmt, compressed)); } catch { /* 下一个 */ }
  }
  return td(compressed);
}

register({
  id: "suiyue",
  cat: "cn",
  name: "随曰 cipher",
  desc: "随波逐流随曰：PBKDF2-SHA256(50万次)+HKDF→AES-CTR→ChaCha20-Poly1305→水字旁汉字密文，空口令用源码默认密码；双向（异步）。与「随言随语」不是同一算法。",
  params: [
    { key: "password", label: "口令（留空用源码默认）", type: "text", default: "" },
    { key: "rawBase64", label: "输出标准 Base64（不转汉字）", type: "bool", default: false },
  ],
  encode,
  decode,
});

export { encode as suiyueEncode, decode as suiyueDecode };
