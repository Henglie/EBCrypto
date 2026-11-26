/*
 * edu-t1544.js — T1544 中文/花式密码族科普卡（9 族双向 + Quadoo）。
 *
 * 算法出处：V8.0.1 反编 ctf_tools/vendor/pic/pic_sbcipher.py（固定码表单表替换族）、
 * ctf_tools/codecs/char_cipher_3/china_stroke.py（笔画码）、
 * ctf_tools/vendor/zbSuiyue/SuiYue.py（随曰 AEAD）。均为纯数据，无副作用。
 * M 在 eduContent.js 归并。
 */
export default {
  backslashCipher: {
    what: "反斜杠 Backslash 码——用 `|`、`/`、`\\` 三种符号拼出 26 个字母的代号。",
    principle: "固定码表单表替换：每个字母映射到一个由竖线和斜杠组成的三字符 token（如 a→`|||`、b→`||/`），token 间以空格分隔。解码查反表还原。源码见 V8 反编 pic_sbcipher.py 的 backslash_codes。",
    usage: "输入英文（自动小写）编码得到斜杠串；解码把斜杠串贴回，token 按空格切开逐组还原。",
    examples: [{ in: "flag", out: "|/\\ /|\\ ||| |\\|", desc: "V8 源码自测向量，注意反斜杠需转义" }],
    tips: ["和 Tom-Tom 斜杠码像但不同：这里混用了 `|`，Tom-Tom 只有 `/` 和 `\\`。", "反斜杠在文本里常被转义，复制时留意是不是多了一层。", "token 固定 3 个字符，看到一坨三三分组的斜杠就想到它。", "表外字符原样保留，方便混合文本对照。"],
    aka: ["反斜杠", "backslash", "反斜杠码", "backslash解密", "backslash加密", "Backslash code", "斜杠竖线码", "三斜杠码", "反斜杠密码", "backslash cipher", "反斜杠编码", "竖杠斜杠码"],
  },
  slashPipe: {
    what: "斜杠和管道码 Slash and Pipe——用斜杠与竖线混合的 token 给 26 个字母编号。",
    principle: "固定码表替换：字母映射到长短不一的 `/`、`\\`、`|` 组合（如 a→`|`、b→`|\\`），密文 token 间以空格分开。解码时对每组查 codes 表反推字母。算法出自 V8 反编 pic_sbcipher.py 的 slashPipe_codes。",
    usage: "编码输入英文（自动小写）；解码贴回空格分隔的符号串。表外字符原样保留。",
    examples: [{ in: "flag", out: "||\\ |\\/ | |||", desc: "V8 源码自测向量" }],
    tips: ["token 长度不固定（1~4 个字符），所以必须靠空格切分，不能按定长切。", "和反斜杠码、Tom-Tom 码同属「线符号」家族，码表各不相同。", "看到 `|`、`/`、`\\` 混排且分组长短不一，优先试它。", "只处理英文字母，数字标点会原样穿过。"],
    aka: ["斜杠和管道", "slashPipe", "斜杠管道码", "Slash and Pipe", "斜杠管道", "slashPipe解密", "slashPipe加密", "管道斜杠码", "线符号密码", "slash pipe cipher", "斜竖码", "斜杠竖线混合码"],
  },
  abaddonCipher: {
    what: "深渊天使 Abaddon——用 `¥`、`µ`、`þ` 三个奇怪符号的三元组代表字母。",
    principle: "固定码表替换：27 个符号（26 字母 + 空格）各对应一个由 `¥µþ` 组成的三字符 token。解码按 token 查反表。源码见 V8 反编 pic_sbcipher.py 的 abaddon_codes，字母表含真实空格位。",
    usage: "编码输入文本（自动小写），得到空格分隔的三符号组；解码贴回即可还原。",
    examples: [{ in: "flag", out: "µµ¥ µ¥¥ ¥¥µ µþþ", desc: "V8 源码自测向量" }],
    tips: ["这三个符号在部分字体/编码下容易乱码，复制时确认是 `¥ µ þ` 没被替换。", "每个 token 恰好 3 个符号，认准这个定长特征。", "字母表里包含空格，所以原文空格也会被编码成一个 token。", "它是「多字符 token」替换，不是单字符替换，别拿单表代换工具硬解。"],
    aka: ["深渊天使", "abaddon", "Abaddon cipher", "深渊天使解密", "深渊天使加密", "¥µþ码", "三元符号码", "abaddon解密", "abaddon加密", "恶魔码", "Abaddon 密码", "深渊密码"],
  },
  fiveNeedle: {
    what: "五针电报码 Five-Needle——用五根针的位置组合表示字母，密文是一串五个斜杠/竖线符号。",
    principle: "固定码表替换：20 个常用字母（abcde… 去掉罕见字母）各对应一个由 5 个 `|` 与 `/\\` 组成的 token。解码按 token 查反表。算法出自 V8 反编 pic_sbcipher.py 的 fiveneedle_codes。",
    usage: "输入文本（自动小写，只有 20 字母表内的字符会被替换）编码；解码贴回空格分隔的五针 token。",
    examples: [{ in: "flag", out: "|/|\\| |||/\\ /|||\\ ||/|\\", desc: "V8 源码自测向量" }],
    tips: ["字母表只有 20 个字母，缺 j/q/v/x/z 等；表外字符原样保留。", "每个 token 恰好 5 个符号，这是最快的识别特征。", "和培根密码的 5 位 0/1 思路像，但符号和码表都不同。", "token 间空格是分隔符，解码靠它切开。"],
    aka: ["五针电报码", "fiveneedle", "Five Needle Telegraph", "五针码", "五针电报", "fiveneedle解密", "fiveneedle加密", "五针密码", "电报五针", "five needle", "五针编码", "五线电报码"],
  },
  hodorCipher: {
    what: "阿多语 Hodor——把字符换成各种大小写和标点的「HODOR!?」变体，像《权力的游戏》里只会说 Hodor 的角色。",
    principle: "固定码表替换：44 个字符（含大小写字母变体）各对应一个 Hodor 变体 token（如 `HODOR`、`Hodor.`、`hodor!?`）。解码按精确 token 查反表，大小写敏感。源码见 V8 反编 pic_sbcipher.py 的 hodor_codes。",
    usage: "编码输入文本得到空格分隔的 Hodor 变体串；解码必须原样保留大小写与标点，否则查不到对应字母。",
    examples: [{ in: "flag", out: "HODOR! Hodor!? HODOR hodor!", desc: "V8 源码自测向量" }],
    tips: ["大小写敏感！`HODOR` 和 `hodor` 是两个不同字母的码。", "token 长短差别很大（从 `HODOR` 到长串 `HoOodoOorHooodorrHODOR`），必须靠空格切。", "只按空格切分，别把 `Hodor!?` 里的 `!?` 当标点丢掉。", "这是梗编码，CTF 里偶尔作为趣味题出现。"],
    aka: ["阿多语", "hodor", "Hodor Language", "hodor解密", "hodor加密", "阿多密码", "HODOR码", "权力的游戏密码", "hodor cipher", "阿多语编码", "Hodor 变体码", "临冬城密码"],
  },
  numberPadLines: {
    what: "数字键盘线 NumberPadLines——把字母变成在手机数字键盘上划出的数字路径。",
    principle: "固定码表替换：36 个字符（26 字母 + 10 数字）各对应一串数字键盘路径码（如 a→`7295`、l→`179`）。解码按 token 查反表。源码见 V8 反编 pic_sbcipher.py 的 numberPadLines_codes。注意它和「数字键盘绘图」不是一回事。",
    usage: "编码输入字母数字得到空格分隔的数字串；解码贴回数字串。表外字符原样保留。",
    examples: [{ in: "flag", out: "314547 179 7295 317965", desc: "V8 源码自测向量" }],
    tips: ["每个 token 是 3~8 位数字，靠空格切分，不能定长读。", "路径码对应九宫格键盘的连线顺序，所以看起来像随机数字。", "别和「数字键盘绘图」混淆：那个是图形路径展示，这个是替换码。", "数字本身也有对应 token，不是原样输出。"],
    aka: ["数字键盘线", "numberPadLines", "NumberPadLines", "数字键盘密码", "九宫格路径码", "numberPadLines解密", "numberPadLines加密", "键盘路径码", "数字键盘线码", "numpad lines", "手机键盘密码", "划数字密码"],
  },
  chinaStroke: {
    what: "汉字笔画码——把文本按字符的 Unicode 码点拆成十进制数字，每位数字再用「笔画数 = 数字+1」的汉字表示。",
    principle: "编码：明文每个字符取 ord 转十进制（字符间留空格），每位数字 d 从笔画数为 d+1 的汉字池里随机挑一个字（源码用 random.choice），所以同一明文每次编码的汉字不同。解码：每字查 3471 字笔画表得到笔画数 b，转成数字 b-1，拼成十进制串后按空格切分，每段用 chr() 还原字符。源码见 V8 反编 china_stroke.py。",
    usage: "编码输入任意文本得到一串汉字（数字位之间用空格分隔 ord）；解码把汉字串贴回，按笔画数还原。注意编码带随机性，解码结果是确定的。",
    examples: [{ in: "二乙已 十乙独 爿乡 俳苦 又乙仅 几也幻 丌乙一勹币", out: "fl ag{中", desc: "V8 源码 __main__ 给的解码向量" }],
    tips: ["编码是随机的：同笔画汉字可互换，所以别指望编码结果逐字固定，能正确解码就行。", "这不是 wubi/五笔、郑码、四角码——那些是按字形编码，这个只数笔画。", "解码必须保留中间的空格，那是 ord 之间的分隔；丢空格会把多位数字粘成一个超大数。", "3471 字的笔画表来自 V8 源码，超纲汉字会原样保留。"],
    aka: ["汉字笔画码", "chinaStroke", "笔画码", "汉字笔画数", "chinafont", "笔画解密", "笔画加密", "汉字笔画", "stroke code", "中文笔画码", "笔画数密码", "china stroke"],
  },
  suiyue: {
    what: "随曰（随波逐流）——一套把明文压成「水」字旁汉字密文的现代 AEAD 加密，带口令和认证。",
    principle: "流程：salt(16B) → PBKDF2-HMAC-SHA256(50万次) 派生 64B → HKDF 派生 AES-CTR 与 ChaCha20 两把密钥；明文 zlib 压缩 → AES-CTR → ChaCha20-Poly1305 认证加密 → 拼成 salt‖nonce‖密文‖tag → 标准 Base64 → 每个 Base64 字符查水字旁汉字表。解密先反查汉字到 Base64，再逆向三层。源码见 V8 反编 zbSuiyue/SuiYue.py。",
    usage: "口令留空则用源码内置默认密码，也可自填（加密解密须一致）。「输出标准 Base64」开关便于和其他实现互通。注意：和「随言随语」是完全不同的算法。",
    examples: [{ in: "心随性起、意随情生、时随运转、地随缘现、言随风散。", param: "口令=随曰", out: "一串水字旁汉字（如 濈澙涍湺…）", desc: "V8 源码 __main__ 示例文本" }],
    tips: ["认证加密：密码错或密文被改一个字节，解密会明确报「认证失败」，不会吐出乱码蒙混过关。", "密文里全是三点水（氵）旁汉字，这是最明显的识别特征。", "和「随言随语」只是名字像：后者是 ord 转 4 进制+字典映射，没有 AEAD。", "50 万次 PBKDF2 是故意的慢，首次加密解密会有一点延迟。", "随机 salt/nonce 意味着同一明文每次密文都不同，这是正常且安全的。"],
    aka: ["随曰", "suiyue", "随波逐流", "随曰加密", "随曰解密", "SuiYue cipher", "水字旁密码", "三点水密文", "随曰 cipher", "suiyue crypto", "随波逐流加密", "随曰 AEAD"],
  },
  quadoo: {
    what: "Quadoo——用盲文式的数字点位串代表字符，支持字母数字和一批标点。",
    principle: "固定码表替换：55 个字符（26 字母 + 数字 + 空格换行 + 一批符号）各对应一个由数字 1-6 组成的点位 token（如 a→`25`、b→`1235`）。解码按 token 查反表。源码见 V8 反编 pic_sbcipher.py 的 quadoo_codes。注意码表里有重复的 `0`（空格与换行共用），解码时按首次出现处理。",
    usage: "编码输入文本得到空格分隔的数字点位串；解码贴回数字串还原。表外字符原样保留。",
    examples: [{ in: "flag", out: "14 34 25 16", desc: "V8 源码自测向量" }],
    tips: ["token 是 1~6 位数字，靠空格切分。", "空格和换行在码表里共用 `0`，解码会还原成空格——这是源码口径，不是 bug。", "支持 `€ & ( ) < > [ ] @` 等符号，覆盖比普通字母码广。", "属于网络小众编码，遇到一坨 1-6 数字组可以试它。"],
    aka: ["Quadoo", "quadoo", "Quadoo解密", "Quadoo加密", "盲文数字码", "点位密码", "quadoo cipher", "数字点位码", "夸度密码", "quadoo编码", "六点数字码", "小众盲文码"],
  },
};
