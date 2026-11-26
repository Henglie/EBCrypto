/*
 * radixStringOps.js — 进制数值串异或族（双向 / 穷举）。
 *
 * 算法来源：V8.0.1 反编源码 codecs/base_convert/xor_ops.py
 *   xor_binary_strings / xor_octal_strings / xor_decimal_strings /
 *   xor_number_add（逐函数从源码抽取实跑对拍，非按菜单名猜）。
 * 口径要点：这里的「异或」是**按数值**异或（2/8/10 进制 token 各自 int 后 XOR），
 * 不是现有 xor/xorStrings 的「按字节」异或——后者无法靠参数档覆盖本族。
 */
import { register } from "./registry.js";

function cleanTokens(text, base) {
  const raw = String(text ?? "").trim().split(/\s+/).filter(Boolean);
  const out = [];
  for (let p of raw) {
    const prefix = { 2: /^0[bB]/, 8: /^0[oO]/, 10: /^0[dD]?/, 16: /^0[xX]/ }[base];
    if (prefix) p = p.replace(prefix, "");
    if (!p) continue;
    const re = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^\d+$/, 16: /^[0-9a-fA-F]+$/ }[base];
    if (!re.test(p)) throw new Error(`无效的 ${base} 进制数值：${p}`);
    out.push(p);
  }
  return out;
}

function xorNumeric(aTokens, bTokens, base) {
  const ml = Math.max(aTokens.length, bTokens.length);
  const pad = (arr) => {
    const out = arr.slice();
    while (out.length < ml) out.unshift("0"); // zfill 语义：左侧补零
    return out;
  };
  const A = pad(aTokens), B = pad(bTokens);
  return A.map((x, i) => parseInt(x, base) ^ parseInt(B[i], base));
}

function radixStringXorRun(text, p) {
  const base = Number(p.base || 2);
  const key = String(p.key ?? "");
  const limit = Math.max(0, Math.min(65535, Number(p.limit ?? 256)));
  const a = cleanTokens(text, base);
  if (!a.length) return "（空输入）";

  if (!key.trim()) {
    // V8：2 进制 key 空时取全 1 串；8/10/16 进制 key 空时穷举 0..limit
    if (base === 2) {
      const b = a.map(() => "1".repeat(Math.max(...a.map((x) => x.length))));
      const nums = xorNumeric(a.map((x) => parseInt(x, 2).toString()), b.map((x) => parseInt(x, 2).toString()), 10);
      const width = Math.max(...a.map((x) => x.length));
      const bitstr = nums.map((n) => n.toString(2).padStart(width, "0")).join("");
      const spaced = bitstr.match(/.{1,8}/g)?.join(" ") ?? "";
      let s8 = "", s16 = "";
      for (let i = 0; i < bitstr.length; i += 8) s8 += String.fromCharCode(parseInt(bitstr.slice(i, i + 8), 2));
      for (let i = 0; i < bitstr.length; i += 16) s16 += String.fromCharCode(parseInt(bitstr.slice(i, i + 16), 2));
      return `【bin】:${spaced}\n\n【en】:${s8}\n\n【cn】:${s16}`;
    }
    const lines = [];
    for (let i = 0; i <= limit; i++) {
      const vals = a.map((t) => parseInt(t, base) ^ i);
      lines.push(`【XOR-${i}】:\t${vals.map((v) => String.fromCharCode(v & 0xffff)).join("")}`);
    }
    return lines.join("\n");
  }

  const b = cleanTokens(key, base);
  const nums = xorNumeric(a, b, base);
  if (base === 2) {
    // V8：按位异或后再按 8 位/16 位分组还原字符
    const bitstr = nums.map((n) => n.toString(2).padStart(Math.max(...a.map((x) => x.length)), "0")).join("");
    const spaced = bitstr.match(/.{1,8}/g)?.join(" ") ?? "";
    let s8 = "", s16 = "";
    for (let i = 0; i < bitstr.length; i += 8) s8 += String.fromCharCode(parseInt(bitstr.slice(i, i + 8), 2) || 0);
    for (let i = 0; i < bitstr.length; i += 16) s16 += String.fromCharCode(parseInt(bitstr.slice(i, i + 16), 2) || 0);
    return `【bin】:${spaced}\n\n【en】:${s8}\n\n【cn】:${s16}`;
  }
  const fmt = (n) => (base === 8 ? n.toString(8).padStart(2, "0") : base === 16 ? n.toString(16).padStart(2, "0") : String(n));
  const out = nums.map(fmt).join(" ");
  const tag = { 8: "oct", 10: "dec", 16: "hex" }[base] || "num";
  // V8 xor_octal_strings_decode 只回一行【oct】，不带【str】（逐函数实跑确认）
  if (base === 8) return `【oct】:${out}`;
  const str = nums.map((n) => (n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "")).join("");
  return `【${tag}】:${out}\n\n【str】:${str}`;
}

function xorNumberAddRun(text, p) {
  const limit = Number(p.number ?? 256);
  const n = Number.isFinite(limit) && limit >= 0 ? Math.min(limit, 65535) : 256;
  const chars = Array.from(String(text ?? ""));
  const lines = [`【${String(text ?? "")}】 xor 穷举0-${n}的所有结果如下：`];
  for (let i = 0; i <= n; i++) {
    let res = "";
    for (let k = 0; k < chars.length; k++) res += String.fromCharCode(chars[k].codePointAt(0) ^ (k + i));
    lines.push(`${i}:\t${res}`);
  }
  return lines.join("\n");
}

register({
  id: "radixStringXor", cat: "radix", name: "进制数值串异或",
  desc: "按数值异或 2/8/10 进制数值串（V8 base_convert/xor_ops.py：key 空时 2 进制取全 1、其余穷举 0-256）；与按字节的 XOR 不同，双向自反。",
  params: [
    { key: "base", label: "数值进制", type: "select", default: "2", options: [
      { value: "2", label: "2 进制" }, { value: "8", label: "8 进制" }, { value: "10", label: "10 进制" },
    ] },
    { key: "key", label: "异或 key（同进制数值串，留空穷举）", type: "text", default: "" },
    { key: "limit", label: "穷举上限", type: "number", default: 256 },
  ],
  run: radixStringXorRun,
});

register({
  id: "xorNumberAdd", cat: "analysis", name: "字符串异或数字+1 穷举",
  desc: "第 k 字符 XOR (k+i)，i 从 0 穷举到指定上限（默认 256）；V8 base_convert/xor_ops.py::xor_number_add，与统一单字节 XOR 爆破不同。",
  params: [
    { key: "number", label: "穷举上限", type: "number", default: 256 },
  ],
  run: xorNumberAddRun,
});

export { radixStringXorRun, xorNumberAddRun };
