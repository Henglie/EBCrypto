/*
 * edu-t1546.js — T1546 Base/编码变体口径对齐科普卡（3 项新增 op）。
 * 出处：V8.0.1 反编 char_cipher_3/bagua.py、vendor/zbCrypto/zb_zero_width_lib.py、
 * baserot/base85b_decode.py + Python 标准库 b85 语义。纯数据无副作用。
 */
export default {
  baguaCodec: {
    what: "八卦符编码：把字节或字符映射到八卦的三套符号表——卦符 ☰-☷、卦名乾坤震巽、3-bit 卦象名。",
    principle: "三套表：①把每个 UTF-8 字节写成 3 位八进制，0-7 对应 ☰☱☲☳☴☵☶☷；②同一八进制位对应乾坤震巽坎离艮兑汉字名；③把每个字符的 Unicode 码点补足 9 位二进制，每 3 位一组映射到震/离/兑/乾/坤/艮/坎/巽。解码按表反查：卦符或卦名还原为字节流，3-bit 卦象名按 9 位一组还原字符。源码见 V8 char_cipher_3/bagua.py。",
    usage: "编码一次给三行结果（八卦1/2/3），可分别拿去解码；解码默认自动识别卦符/卦名，若输入是第三套 3-bit 卦象汉字，把「解码变体」选 3。",
    examples: [
      { in: "Da01sall", out: "八卦1：☱☰☴☱☴☱☰☶… / 八卦2：兑乾巽兑… / 八卦3：震坤艮震…", desc: "V8 bagua.py __main__ 向量" },
      { in: "☱☰☴☱☴☱☰☶☰☰☶☱☱☶☳☱☴☱☱☵☴☱☵☴", out: "Da01sall", desc: "八卦1 解码往返" },
    ],
    tips: ["它和「六十四卦」不是一回事：那是 6bit→64 卦，这里是每字节 3bit→8 卦。", "八卦2/八卦3 都写成汉字，肉眼难分；V8 原解码优先按 八卦2（字节）处理，要解第三套请手动选变体 3。", "八卦3 是 Unicode 码点补 9 位，所以中文也能编码（每字三组卦象）。", "编码三行是同一内容的不同表示，不是三层加密。"],
    aka: ["八卦符", "bagua", "八卦编码", "八卦解码", "八卦符编码", "Bagua code", "卦象密码", "先天八卦", "后天八卦", "baguaCodec", "三爻卦", "八卦字符"],
  },
  zeroWidthLib: {
    what: "零宽字符 zero-width-lib：用 6 个不可见 Unicode 字符做五进制数字，把隐藏文本塞进一段正常文字里。",
    principle: "隐藏文本每个字符取 Unicode 码点，转 5 进制，每位数字 0-5 依次映射到 U+200E/U+200F/U+200C/U+200D/U+FEFF/U+200B，字符间用 U+200B 分隔。编码时把整串零宽序列插在载体首字符之后，肉眼只见载体。解码时抽出零宽串，按分隔符切开，每段 5 进制还原码点。源码见 V8 vendor/zbCrypto/zb_zero_width_lib.py。",
    usage: "编码：主输入填载体文本，「要隐藏的文本」参数填秘密内容。解码：把带零宽字符的载体贴进输入框直接解。",
    examples: [{ in: "hello world", param: "hidden=secret hidden", out: "h[零宽串]ello world", desc: "V8 __main__ 向量，解码得 secret hidden" }],
    tips: ["和「零宽字符隐写」不是一套：那个是 4 字符 radix-4（Misawa），这里是 6 字符五进制。", "6 个字符里混着从右到左标记（U+200F），复制时可能被编辑器重排，建议纯文本通道。", "U+FEFF 是 BOM 字符，放在中间不会被当 BOM 吃掉，但某些富文本编辑器会过滤。", "隐藏串插在首字符之后——这是源码的固定位置，不是随机插入。"],
    aka: ["zero-width-lib", "zeroWidthLib", "零宽字符库", "六字符零宽", "五进制零宽", "零宽隐写库", "zero width lib", "零宽字符加密", "不可见字符隐写", "零宽解码", "零宽编码", "隐形文字"],
  },
  base85b: {
    what: "Base85(b)：RFC 1924 字典的 Base85，Python b85 口径，任意长度都能编（不像 IPv6 档只收 4 字节倍数）。",
    principle: "每 4 字节当大端 32 位整数，拆成 5 个 85 进制位，按 85 字符字典取值；尾部不足 4 字节时补零编码后截掉多余字符（1 字节→2 字符、2→3、3→4）。解码反向：不足 5 字符的尾组补 '~' 凑 5，解出后按补齐量截字节。key 可给 ≥85 字符自定义字典。源码见 V8 baserot/base85b_decode.py 与 Python 标准库 base64.b85encode/b85decode。",
    usage: "编码输入任意文本/字节；解码贴回 Base85 串。自定义字典填在参数里（至少 85 字符，取前 85 个映射到标准字典）。",
    examples: [
      { in: "base85", out: "VqtS-I5h", desc: "Python base64.b85encode 权威向量" },
      { in: "flag{b85}", out: "W^7?+dtx{>eE", desc: "同上，含尾组" },
    ],
    tips: ["和 Ascii85（<~ ~> 包裹 + z 压缩零组）不同，b85 没有包裹符也不压零组。", "和现有「Base85」op 的 IPv6 档字典相同，但那个限制 4 字节倍数，本 op 支持任意长度。", "尾组只剩 2-4 个字符是正常的，不是被截断。", "字典含 `!#$%&()*+-;<=>?@^_`{|}~` 等符号，复制时注意别被 shell 转义。"],
    aka: ["base85b", "Base85(b)", "RFC 1924 Base85", "b85", "b85encode", "b85decode", "Python Base85", "Base85 b", "85进制", "base85变体", "IPv6 Base85 通用档", "RFC1924"],
  },
};
