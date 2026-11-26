/*
 * fixedCodeCipher.js — 固定码表单表替换族（双向）。
 *
 * 算法与码表来源：V8.0.1 反编源码
 *   ctf_tools/vendor/pic/pic_sbcipher.py::Substitution_Cipher
 *   （encrypt / decrypto 两个方法 + 各 *_codes / *_alpherbet 类属性），
 *   经 资料/工程留存/T1544/_tmp/ 直接导出为 lib/fixedCodeTables.js，逐字不改。
 *
 * 与已有 simplesub 的区别：simplesub 是「单字符→单字符」字母置换；
 * 本族是「单字符→多字符 token」定长表替换，密文 token 间以空格分隔，
 * 属于不同算法，无法用 simplesub 的参数档覆盖。
 *
 * 每个 op 的 encode/decode 都按 pic_sbcipher 的 encrypt/decrypto 语义实现：
 *   enc: 全串小写；表内字符 → codes[i]（前置空格分隔）；表外字符原样保留；首尾 trim
 *   dec: 含空格则 split(' ')，否则逐字符；token 命中 codes 取 alphabet[i]，否则原样保留
 */
import { register, registerAlias, getOp } from "./registry.js";
import { FIXED_CODE_TABLES } from "./lib/fixedCodeTables.js";

function encode(text, table) {
  const t = table || FIXED_CODE_TABLES.backslash;
  const out = [];
  for (const ch of String(text ?? "").toLowerCase()) {
    const i = t.alphabet.indexOf(ch);
    out.push(i >= 0 ? t.codes[i] : ch);
  }
  return out.join(" ").trim();
}

function decode(text, table) {
  const t = table || FIXED_CODE_TABLES.backslash;
  const s = String(text ?? "");
  const tokens = s.includes(" ") ? s.split(" ") : Array.from(s);
  return tokens.map((tok) => {
    const i = t.codes.indexOf(tok);
    return i >= 0 ? t.alphabet[i] : tok;
  }).join("");
}

// 每个 op 固定一张表（码表即算法，不开放自定义以免破坏权威口径）。
const FAMILIES = [
  { id: "backslashCipher", name: "反斜杠 Backslash 码", desc: "26 字母 → | 与 / \\ 组合 token 定长表替换（V8 backslash_codes），空格分隔，双向。", table: "backslash", cat: "fancy" },
  { id: "slashPipe", name: "斜杠和管道码 Slash and Pipe", desc: "26 字母 → 斜杠/管道混合 token 定长表替换（V8 slashPipe_codes），空格分隔，双向。", table: "slashPipe", cat: "fancy" },
  { id: "abaddonCipher", name: "深渊天使 Abaddon", desc: "27 符号（26 字母+空格）→ ¥ µ þ 三元 token 表替换（V8 abaddon_codes），空格分隔，双向。", table: "abaddon", cat: "fancy" },
  { id: "fiveNeedle", name: "五针电报码 Five-Needle Telegraph", desc: "20 字母子集 → 五针电报点位 token 表替换（V8 fiveneedle_codes），空格分隔，双向。", table: "fiveneedle", cat: "fancy" },
  { id: "hodorCipher", name: "阿多语 Hodor Language", desc: "44 字符 → HODOR/Hodor/hodor 变体 token 表替换（V8 hodor_codes），空格分隔，双向。", table: "hodor", cat: "fancy" },
  { id: "numberPadLines", name: "数字键盘线 NumberPadLines", desc: "36 字符（字母+数字）→ 数字键盘路径串表替换（V8 numberPadLines_codes），空格分隔，双向。", table: "numberPadLines", cat: "fancy" },
  { id: "quadoo", name: "Quadoo 密码", desc: "55 字符 → 盲文数字点位串表替换（V8 quadoo_codes），空格分隔，双向。", table: "quadoo", cat: "fancy" },
];

for (const f of FAMILIES) {
  const table = FIXED_CODE_TABLES[f.table];
  register({
    id: f.id,
    cat: f.cat,
    name: f.name,
    desc: f.desc,
    params: [],
    encode: (text) => encode(text, table),
    decode: (text) => decode(text, table),
  });
}

// 供测试/调用方直接使用的纯函数（不经过注册）。
export { encode as fixedCodeEncode, decode as fixedCodeDecode, FIXED_CODE_TABLES };

// 旧 id 兼容：V8 把「童子军木棍密码」错标为「汉码」，本工具以正确名称为准。
registerAlias({
  id: "chinesecode", aliasOf: "scoutStick",
  name: "汉码（别名，实为童子军木棍密码）",
  desc: "此 id 仅为旧链接兼容；算法就是「童子军木棍密码」的 classic 档（横=元音序号、竖=其后辅音序号），并非汉字编码。",
  encode: (text, p) => getOp("scoutStick").encode(text, { ...(p || {}), variant: "classic", order: "vh" }),
  decode: (text, p) => getOp("scoutStick").decode(text, { ...(p || {}), variant: "classic", order: "vh" }),
});
