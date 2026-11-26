/*
 * edu-t1545.js — T1545 进制流与文本隐写科普卡（4 项新增 op）。
 * 出处：V8.0.1 反编 base_convert/xor_ops.py、completion.py、file_tools/text_stego.py。
 * 纯数据无副作用。M 在 eduContent.js 归并。
 */
export default {
  radixStringXor: {
    what: "按数值异或 2/8/10 进制数值串：逐 token 转成整数再 XOR，结果仍是同进制数值，不是按字节异或。",
    principle: "源码把输入按空白切成 token（可选 0b/0o 前缀），两侧左侧补零到等长，逐个 int(token, base) 做按位 XOR。2 进制档额外把结果按 8 位/16 位分组还原成字符；8/10 进制档 key 留空时穷举 0-256 并给出每个候选。这和 XOR op 的「字节级重复密钥」是两套口径。",
    usage: "选数值进制（2/8/10），输入空格分隔的数值串，key 填同进制数值串。留空 key 时 2 进制取全 1 掩码，8/10 进制穷举 0-上限。",
    examples: [
      { in: "10101010 11001100", param: "base=2, key=11001100", out: "【bin】:10101010 00000000 / 【en】和【cn】两栏", desc: "V8 xor_binary_strings 实跑向量" },
      { in: "65 66 67", param: "base=10, key=1 2 3", out: "【dec】:64 64 64 / 【str】:@@@", desc: "十进制数值异或" },
    ],
    tips: ["token 之间必须有空格，不然会被当成一个大数值。", "2 进制的【cn】栏是每 16 bit 一组转字符，和【en】的每 8 bit 一组不同。", "8 进制带 key 时 V8 只输出一行【oct】，不带【str】——已照源码口径。", "16 进制逐字节异或请用现有 XOR / XOR 循环补齐，把明文与 key 编码都选 Hex。"],
    aka: ["进制异或", "radixStringXor", "二进制字符串异或", "八进制字符串异或", "十进制字符串异或", "数值串异或", "xor_binary", "xor_octal", "xor_decimal", "按数值异或", "进制串 XOR", "xor key"],
  },
  xorNumberAdd: {
    what: "字符串异或数字+1：第 k 个字符 XOR (k+i)，参数 i 从 0 穷举到上限（默认 256）。",
    principle: "和统一单字节 XOR 爆破不同，这里的密钥随字符位置递增：res[k] = chr(ord(txt[k]) ^ (k+i))。对每个 i 输出一行，方便人工扫出可读明文。源码见 V8 base_convert/xor_ops.py::xor_number_add。",
    usage: "输入待解文本，参数填穷举上限（默认 256）。输出是 0..上限 共 N+1 行，每行前缀是 i 值。",
    examples: [{ in: "ABC", param: "number=2", out: "0: ACA / 1: @@@ / 2: CAG", desc: "V8 源码实跑向量" }],
    tips: ["这是「位置相关 XOR」，xorBrute 的统一单字节爆破覆盖不了。", "输出行数 = 上限+1，上限填太大刷屏；先用 256。", "CTF 里遇到越往后越乱的异或串，想到密钥随位置递增。", "字符按 Unicode 码点取 ord，中文也能算但结果通常不可读。"],
    aka: ["xorNumberAdd", "异或数字加1", "位置异或穷举", "字符串异或数字", "xor number add", "递增异或", "按位递增异或", "xor+1", "异或穷举256", "位置相关异或", "递增密钥异或", "xor k+i"],
  },
  cloakify: {
    what: "Cloakify 词表隐写提取：把一段「看起来正常的词」按密码表反查成 Base64 字符，再解出隐藏的文件或文本。",
    principle: "Cloakify 把 Base64 每个字符映射到词表里对应序号的词，于是密文像一篇正常英文。提取时逐词查表得到字符序号，拼回 Base64，容错补 padding 后解码。源码见 V8 file_tools/text_stego.py::cloakify_decode。",
    usage: "输入区粘贴隐写词（每行一个），「词表」参数粘贴密码表（每行一个词，顺序对应 a-z A-Z 0-9 +/ =）。短文本直接显示，二进制生成下载产物。",
    examples: [{ in: "word25 word12 ...（每行一个）", param: "词表=word00…word64", out: "flag{cloakify_smoke_test_ok}", desc: "V8 __main__ 自测载荷" }],
    tips: ["词表必须和隐写时用的那张完全一致，错一张会明确列出未匹配的词。", "隐写词和词表都是「每行一个」，别用空格分隔。", "解出的若不是文本，会按文件头签名猜扩展名并给下载按钮。", "Base64 表含末尾的 '='，词表要有 65 个词才完整。"],
    aka: ["Cloakify", "cloakify隐写", "词表隐写", "cloakify 提取", "cloakify decode", "Cloakify stego", "词表替换隐写", "伪装文本隐写", "cloakify解密", "wordlist stego", "隐写词表", " cloakify"],
  },
  ttiDecode: {
    what: "TTI 隐写解码：把四个数值表示的像素流还原成隐藏数据，每个数值携带 2 比特，8 个像素拼 1 字节。",
    principle: "标准映射把 63/127/191/255 分别对应 00/01/10/11，拼成比特流后每 8 位转一个字节。若文本里恰好只有另外 4 种数值，则按数值大小排序自动映射 00/01/10/11（源码的 bug 修复+兜底）。源码见 V8 file_tools/text_stego.py::tti_decode。",
    usage: "输入空格或换行分隔的 TTI 数值。解出短文本直接显示，二进制按文件头生成下载产物。",
    examples: [{ in: "63 127 191 255 ...", out: "隐藏的 PNG/JPEG 等文件（下载产物）", desc: "V8 __main__ 用 PNG 字节构造的数值流" }],
    tips: ["标准四值是 63/127/191/255——它们其实是字节的高 2 位编码。", "若其中混入一个标准值（如 255），其余非标准值就不会触发自适应映射——这是源码口径。", "尾部不足 8 位的比特会被丢弃，报告里写明丢了几位。", "解出的二进制会按 magic 猜扩展名；看不出就给 .bin。"],
    aka: ["TTI", "ttiDecode", "TTI 隐写", "TTI 隐写解码", "tti stego", "四值隐写", "像素隐写解码", "tti 解码", "TTI decode", "TTI steganography", "二比特隐写", "四值文本隐写"],
  },
};
