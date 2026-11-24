import { register } from "./registry.js";

/**
 * StegoX 兼容容器（与 https://eb.xbdqwq.com/apps/stegox/ 互通）
 *
 * 依据：该站公开实现的容器布局（MAGIC 0x59435A53 / TAIL 48B / FORMAT 1|2 /
 * PBKDF2-SHA512 250000 / AES-256-GCM / 1MiB 分块）。本文件为独立实现，不复制其代码。
 *
 * 容器布局（输出文件 = 载体字节 ‖ 载荷 ‖ 尾部 48B）：
 *  - FORMAT_MEMORY(1)：载荷 = AES-GCM( 1B 保留 ‖ u32 manifestLen ‖ manifestJSON ‖ 各文件字节 )
 *  - FORMAT_STREAM(2)：载荷 = 每块 [12B IV ‖ AES-GCM(≤1MiB 明文)] … ‖ [12B mIv ‖ AES-GCM(manifestJSON)]
 *  - 尾部：u32 MAGIC | u8 format | f64 totalLen | 12B iv(内存:数据IV / 流式:manifest IV)
 *          | u32 encLen | 16B salt | 3B 保留
 *  - 密钥：口令 → UTF-8 字节；密钥文件 → SHA-512(文件字节)；再 PBKDF2(250000, SHA-512) → AES-256-GCM
 */

export const STEGOX_MAGIC = 0x59435a53;
export const STEGOX_TAIL_LEN = 48;
export const STEGOX_FORMAT_MEMORY = 1;
export const STEGOX_FORMAT_STREAM = 2;
export const STEGOX_CHUNK_SIZE = 1024 * 1024;
export const STEGOX_PBKDF2_ITERATIONS = 250000;
export const STEGOX_HASH = "SHA-512";
export const STEGOX_GCM_TAG_LEN = 16;

function toU8(x) {
  if (x instanceof Uint8Array) return x;
  if (x instanceof ArrayBuffer) return new Uint8Array(x);
  if (ArrayBuffer.isView(x)) return new Uint8Array(x.buffer, x.byteOffset, x.byteLength);
  throw new Error("StegoX：需要 Uint8Array / ArrayBuffer");
}

async function deriveKey(keySource, salt) {
  let raw;
  if (typeof keySource === "string") {
    raw = new TextEncoder().encode(keySource);
  } else {
    const digest = await crypto.subtle.digest(STEGOX_HASH, toU8(keySource));
    raw = new Uint8Array(digest);
  }
  const material = await crypto.subtle.importKey("raw", raw, { name: "PBKDF2" }, false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: STEGOX_PBKDF2_ITERATIONS, hash: STEGOX_HASH },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** 组装 manifest 明文（内存模式）：1B 保留 + u32 manifestLen + JSON + 文件字节 */
function buildPacked(text, files) {
  const manifest = { text: text || "", files: [] };
  const parts = [];
  let offset = 0;
  for (const f of files || []) {
    const bytes = toU8(f.bytes);
    manifest.files.push({ name: f.name, size: bytes.length, offset });
    parts.push(bytes);
    offset += bytes.length;
  }
  const mBytes = new TextEncoder().encode(JSON.stringify(manifest));
  const head = new Uint8Array(5);
  new DataView(head.buffer).setUint32(1, mBytes.length, true);
  let total = 5 + mBytes.length + offset;
  const out = new Uint8Array(total);
  out.set(head, 0);
  out.set(mBytes, 5);
  let p = 5 + mBytes.length;
  for (const b of parts) { out.set(b, p); p += b.length; }
  return { packed: out, totalLen: total, manifest };
}

/**
 * 生成 StegoX 容器（内存模式 FORMAT_MEMORY）
 * @param {object} o
 * @param {Uint8Array|ArrayBuffer} o.carrier 载体文件字节
 * @param {string|Uint8Array} o.keySource 口令字符串或密钥文件字节
 * @param {string} [o.text] 隐藏文本
 * @param {{name:string,bytes:Uint8Array|ArrayBuffer}[]} [o.files] 隐藏文件
 * @returns {Promise<Uint8Array>} 容器文件字节
 */
export async function stegoxEmbed({ carrier, keySource, text = "", files = [] }) {
  if (keySource == null || (typeof keySource === "string" && keySource.length === 0)) {
    throw new Error("StegoX：请提供口令或密钥文件");
  }
  if (!text && (!files || files.length === 0)) throw new Error("StegoX：没有要隐藏的内容");
  const carrierBytes = toU8(carrier);
  const { packed, totalLen } = buildPacked(text, files);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(keySource, salt);
  const enc = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, packed));

  const tail = new ArrayBuffer(STEGOX_TAIL_LEN);
  const v = new DataView(tail);
  v.setUint32(0, STEGOX_MAGIC, true);
  v.setUint8(4, STEGOX_FORMAT_MEMORY);
  v.setFloat64(5, totalLen, true);
  new Uint8Array(tail, 13, 12).set(iv);
  v.setUint32(25, enc.length, true);
  new Uint8Array(tail, 29, 16).set(salt);

  const out = new Uint8Array(carrierBytes.length + enc.length + STEGOX_TAIL_LEN);
  out.set(carrierBytes, 0);
  out.set(enc, carrierBytes.length);
  out.set(new Uint8Array(tail), carrierBytes.length + enc.length);
  return out;
}

/** 从 manifest 取回复原内容 */
function unpackManifest(manifest, payloadBytes, payloadStart) {
  const files = [];
  for (const f of manifest.files || []) {
    const start = payloadStart + (f.offset | 0);
    const end = start + (f.size | 0);
    if (start < payloadStart || end > payloadBytes.length) throw new Error("StegoX：文件偏移越界");
    files.push({ name: String(f.name ?? "payload.bin"), bytes: payloadBytes.subarray(start, end) });
  }
  return { text: typeof manifest.text === "string" ? manifest.text : "", files };
}

async function unpackMemory(data, key) {
  const tail = data.subarray(data.length - STEGOX_TAIL_LEN);
  const v = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
  const totalLen = v.getFloat64(5, true);
  const iv = tail.slice(13, 25);
  const encLen = v.getUint32(25, true);
  const encStart = data.length - STEGOX_TAIL_LEN - encLen;
  if (encStart < 0) throw new Error("StegoX：容器长度不足");
  const encBuf = data.subarray(encStart, encStart + encLen);
  let plain;
  try {
    plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encBuf));
  } catch {
    throw new Error("StegoX：解密失败（口令/密钥文件不对，或容器被改动）");
  }
  if (plain.length < 5) throw new Error("StegoX：manifest 头不完整");
  const pv = new DataView(plain.buffer, plain.byteOffset, plain.byteLength);
  const jsonLen = pv.getUint32(1, true);
  if (5 + jsonLen > plain.length) throw new Error("StegoX：manifest 长度越界");
  let manifest;
  try {
    manifest = JSON.parse(new TextDecoder().decode(plain.subarray(5, 5 + jsonLen)));
  } catch {
    throw new Error("StegoX：manifest 不是合法 JSON");
  }
  const payloadStart = 5 + jsonLen;
  const payload = plain.subarray(payloadStart);
  if (Number.isFinite(totalLen) && plain.length !== totalLen) {
    throw new Error(`StegoX：明文长度不符（头部 ${totalLen}，实际 ${plain.length}）`);
  }
  return unpackManifest(manifest, payload, 0);
}

async function unpackStream(data, key) {
  const tail = data.subarray(data.length - STEGOX_TAIL_LEN);
  const v = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
  const totalLen = v.getFloat64(5, true);
  const mIv = tail.slice(13, 25);
  const mEncLen = v.getUint32(25, true);
  const mEncStart = data.length - STEGOX_TAIL_LEN - mEncLen;
  if (mEncStart < 0) throw new Error("StegoX：容器长度不足");
  let manifestBytes;
  try {
    manifestBytes = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: mIv }, key, data.subarray(mEncStart, mEncStart + mEncLen)));
  } catch {
    throw new Error("StegoX：解密失败（口令/密钥文件不对，或容器被改动）");
  }
  let manifest;
  try { manifest = JSON.parse(new TextDecoder().decode(manifestBytes)); }
  catch { throw new Error("StegoX：manifest 不是合法 JSON"); }

  const numBlocks = Math.ceil(totalLen / STEGOX_CHUNK_SIZE);
  const cipherLen = numBlocks * 12 + totalLen + numBlocks * STEGOX_GCM_TAG_LEN;
  const start = mEncStart - cipherLen;
  if (start < 0) throw new Error("StegoX：载荷区长度不足");
  const plain = new Uint8Array(totalLen);
  let off = start, p = 0;
  for (let i = 0; i < numBlocks; i++) {
    const plainLen = Math.min(STEGOX_CHUNK_SIZE, totalLen - p);
    const iv = data.slice(off, off + 12);
    const ct = data.subarray(off + 12, off + 12 + plainLen + STEGOX_GCM_TAG_LEN);
    let block;
    try { block = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct)); }
    catch { throw new Error(`StegoX：第 ${i + 1} 块解密失败（容器被改动或密钥不符）`); }
    plain.set(block, p);
    p += plainLen;
    off += 12 + plainLen + STEGOX_GCM_TAG_LEN;
  }
  return unpackManifest(manifest, plain, 0);
}

/**
 * 解析 StegoX 容器（自动识别内存/流式）
 * @param {object} o
 * @param {Uint8Array|ArrayBuffer} o.data 容器文件字节
 * @param {string|Uint8Array} o.keySource 口令或密钥文件字节
 * @returns {Promise<{format:number,text:string,files:{name:string,bytes:Uint8Array}[]}>}
 */
export async function stegoxExtract({ data, keySource }) {
  if (keySource == null || (typeof keySource === "string" && keySource.length === 0)) {
    throw new Error("StegoX：请提供口令或密钥文件");
  }
  const bytes = toU8(data);
  if (bytes.length < STEGOX_TAIL_LEN + 1) throw new Error("StegoX：文件太短，不是本格式容器");
  const tail = bytes.subarray(bytes.length - STEGOX_TAIL_LEN);
  const v = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
  if (v.getUint32(0, true) !== STEGOX_MAGIC) throw new Error("StegoX：未找到魔数，不是本格式容器");
  const format = v.getUint8(4);
  const salt = tail.subarray(29, 45);
  const key = await deriveKey(keySource, salt);
  if (format === STEGOX_FORMAT_MEMORY) return { format, ...(await unpackMemory(bytes, key)) };
  if (format === STEGOX_FORMAT_STREAM) return { format, ...(await unpackStream(bytes, key)) };
  throw new Error(`StegoX：未知格式编号 ${format}`);
}

/** 判断是否 StegoX 容器（只看尾部魔数，不做解密） */
export function stegoxDetect(data) {
  const bytes = toU8(data);
  if (bytes.length < STEGOX_TAIL_LEN) return false;
  const tail = bytes.subarray(bytes.length - STEGOX_TAIL_LEN);
  return new DataView(tail.buffer, tail.byteOffset, tail.byteLength).getUint32(0, true) === STEGOX_MAGIC;
}

// ============ op 注册（提取方向优先；编码方向只做文本载荷，文件载荷待多槽位接线） ============
function _inputBytes(x) {
  if (typeof x === "string") return new TextEncoder().encode(x);
  return toU8(x);
}

register({
  id: "stegox",
  cat: "stegoFile",
  name: "StegoX 深层隐写",
  desc: "StegoX 容器兼容：编码把文本藏进任意载体文件（AES-256-GCM + PBKDF2-SHA512 25 万次，尾部 48B 头）；解码自动识别内存/流式两种格式并取出隐藏文本与文件。口令模式；密钥文件模式待多槽位控件",
  acceptsBytes: true,
  params: [
    { sensitive: true, key: "pwd", label: "口令（编码/解码一致）", type: "text", default: "", placeholder: "与加密时完全一致" },
    { key: "text", dir: "encode", label: "要隐藏的文本（仅编码）", type: "textarea", default: "", placeholder: "留空则只能生成空载荷" },
  ],
  encode: async (input, p = {}) => {
    const pwd = String(p.pwd ?? "");
    if (!pwd) throw new Error("StegoX：请填写口令");
    const carrier = _inputBytes(input);
    if (!carrier.length) throw new Error("StegoX：请先载入载体文件（图片/文档/任意文件）");
    const text = String(p.text ?? "");
    const out = await stegoxEmbed({ carrier, keySource: pwd, text });
    return {
      bytes: out,
      text: [
        "=== StegoX 隐写（内存格式）===",
        `载体 ${carrier.length} B + 载荷 ${out.length - carrier.length} B（含 48 B 尾部头）`,
        `隐藏文本 ${text.length} 字`,
        "输出为新文件；原载体未被修改。",
      ].join("\n"),
    };
  },
  decode: async (input, p = {}) => {
    const pwd = String(p.pwd ?? "");
    if (!pwd) throw new Error("StegoX：请填写口令");
    const data = _inputBytes(input);
    const r = await stegoxExtract({ data, keySource: pwd });
    const lines = [
      "=== StegoX 提取 ===",
      `格式：${r.format === STEGOX_FORMAT_MEMORY ? "内存（1）" : "流式（2）"}`,
      `隐藏文本：${r.text || "（无）"}`,
      `隐藏文件：${r.files.length} 个`,
    ];
    for (const f of r.files) lines.push(`- ${f.name}（${f.bytes.length} B）`);
    return {
      text: lines.join("\n"),
      files: r.files.map((f) => ({ name: f.name, mime: "application/octet-stream", bytes: f.bytes })),
    };
  },
});

export { _inputBytes };
