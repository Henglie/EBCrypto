/*
 * 两 op 科普卡（中文）。
 * 示例 out 值全部来自本项目实跑（真实样例为 public/wasm/7zz.wasm 等 +
 * bin/launcher-macos universal2 fat），未编造。
 */
export default {
  wasmParse: {
    what: "WebAssembly（WASM）二进制结构解析——把 .wasm 文件的「骨架」读给你看：magic/版本、逐 section 的偏移与大小、函数类型签名、导入导出清单、内存/表/起始函数。只做结构展示，**不反编译、不执行**（执行是另一回事，本工具拒绝运行不可信代码）。CTF 里 wasm 题常见「给一个 .wasm + 让你逆逻辑」，第一步就是看结构：有哪些导出函数、导入哪些环境符号、多大体积。",
    principle:
      "**二进制格式（W3C 规范 §5 Binary Format）**：\n\n" +
      "① 头部 8 字节：magic `00 61 73 6D`（即 `\\0asm`）+ version `01 00 00 00`（u32 小端，当前恒为 1）。\n\n" +
      "② 之后是一串 section：每节 = id（1 字节）+ size（uleb128 变长）+ 内容。id 0-12：custom（0，可含 name 子节）、type（1）、import（2）、function（3）、table（4）、memory（5）、global（6）、export（7）、start（8）、element（9）、code（10）、data（11）、datacount（12）。\n\n" +
      "③ **顺序规则有个特例**：非 custom 段按 id 递增排，但 **datacount(12) 的合法位置在 code(10)/data(11) 之前**（spec module 语法 type→import→…→element→datacount→code→data）——工具按此逻辑序检查，乱序显式报错。\n\n" +
      "④ **LEB128**：变长整数，每字节 7 位有效 + 最高位续传标志。wasm 里几乎所有长度/索引/偏移都是它；本工具严格校验（截断/超 5 字节/越界显式报错）。\n\n" +
      "⑤ import 条目 = module 名 + 名字 + kind（func/table/mem/global）+ 类型；export = 名字 + kind + 索引。类型段每条 = 0x60 + 参数类型列表 + 返回类型列表（i32/i64/f32/f64/v128/funcref/externref；GC 扩展的 struct/array 等工具标注「不展开」）。\n\n" +
      "⑥ custom 段 id=0 里最常见的是 **name 子节**（调试信息）：函数名表（把索引映射回源码函数名），逆向时极有用——本工具解析并统计。",
    usage:
      "拖入 .wasm 文件（或粘 hex），直接出结构报告：每个 section 的 id/偏移/字节数 + 导入导出前几条。\n\n" +
      "典型工作流：① 看导出清单找入口函数（如 `_start`、`main`、题目自定义名）→ ② 看导入判断「环境依赖」（wasi_snapshot_preview1 说明是 WASI 程序，env.* 说明是 emscripten 产物）→ ③ 用 wasm2wat/wabt 或浏览器 DevTools 反汇编函数体（本工具不做这步）。\n\n" +
      "判别：文件头 `\\0asm` 就是 wasm（ASCII 00 61 73 6D）；CTF 题目把 flag 藏在 data 段时，本工具能告诉你 data 段多大、在哪，配合 hexDump/strings 提取。",
    examples: [
      { in: "7zz.wasm（项目自带，1.6MB）", out: "36 个导入，前 3：env.__cxa_throw (func)，env.exit (func)…；7 个导出，前 3：memory (mem #0)…", desc: "真实样例；导入清单与浏览器 WebAssembly.Module.imports() 对拍一致" },
      { in: "（手工构造的最小 wasm）", out: "6 个 section；导入 1 / 导出 1 / 类型 1 / 函数 1", desc: "逐字节 KAT：type/import/function/memory/export/code 六段全识别" },
      { in: "00 61 73 6d 02 00 00 00", out: "报错：版本 2 不支持", desc: "版本严格校验" },
    ],
    formulas: [
      { tex: "\\text{section} = id \\;(1\\text{B}) \\;\\|\\; \\mathrm{uleb128}(size) \\;\\|\\; content", caption: "每节三段式；custom 段 id=0 可出现在任意位置" },
      { tex: "\\mathrm{uleb128}:\\; b_6 b_5 \\cdots b_0 + 2^7(b_6' \\cdots) + \\cdots", caption: "每字节低 7 位小端拼接，最高位 1=续传" },
    ],
    tips: [
      "认题：题目给 .wasm/.wat 文件或「WebAssembly」「emscripten」「WASI」字样；浏览器里 F12 看 Sources 有 .wasm 也是它。",
      "导入的 module 名直接暴露来源：`wasi_*` = WASI 命令行程序（能直接跑）、`env` = emscripten、`__cxa_throw` = C++ 异常。",
      "name 子节是逆向金矿：保留了原始函数名（-g 编译才有）；剥离过的 wasm 函数名只有 $func$N。",
      "flag 常藏在 data 段：结构解析告诉你 data 段偏移与大小，再用「文件提取/strings」类 op 抠内容。",
      "本工具不做反编译是刻意的：不可信 wasm 代码绝不执行；反汇编请用 wabt（wasm2wat）或浏览器 DevTools。",
      "标准来源：W3C WebAssembly Core Specification 2.0 §5（Binary Format）/ §5.2.2（LEB128）/ WebAssembly Binary Format 附加规范（name 子节）；导入导出与浏览器 WebAssembly.Module.imports/exports 逐条对拍。",
    ],
    aka: ["WASM 解析", "wasm 结构", "WebAssembly 解析", "wasm sections", "wasm 导入导出",
      "wasmParse", "wasm 文件分析", "WASM 骨架", "wasm binary format", "wasm magic",
      "wasm LEB128", "wasm name section", "wasm 函数签名", "wasm 段表", "webassembly 结构"],
  },

  machoParse: {
    what: "Mach-O 结构解析——Mach-O 是 macOS/iOS 的可执行文件格式（对应 Windows 的 PE、Linux 的 ELF）。本工具读出：fat（universal）头的架构表、每个架构 slice 的 CPU 类型/文件类型/标志、逐条 load command（代码段布局、入口点、UUID、依赖的动态库、最低系统版本等）。只做结构展示，**不反编译**。CTF 里 macOS/iOS 逆向题、APK/IPA 里的原生库分析第一步都是它。",
    principle:
      "**两种形态**：\n\n" +
      "① **单架构 Mach-O**：magic `feedfacf`（64 位，小端存储）或 `feedface`（32 位）开头，header = magic + cputype + cpusubtype + filetype + ncmds + sizeofcmds + flags（+64 位 reserved）。\n\n" +
      "② **universal（fat）**：magic `cafebabe`（大端）+ nfat_arch + 架构表（每条 20 字节：cputype/cpusubtype/offset/size/align）——一个文件里装多个架构的 slice（Apple Silicon 时代的 universal2 = arm64 + x86_64 两条）。fat 里的 slice 偏移按 2^align 对齐。\n\n" +
      "**cputype**：7=i386、0x01000007=x86_64、12=arm、0x0100000C=arm64（0x01000000 位 = 64 位标志）。\n\n" +
      "**load command**（header 后 ncmds 条，每条 cmd + cmdsize 开头）：LC_SEGMENT_64（0x19）是重头——段名（__TEXT 代码/__DATA 数据/__LINKEDIT 链接信息）+ 虚拟地址/大小 + 内嵌 section 表（__text 代码/__cstring 字符串/__objc_* 等）；LC_MAIN（0x80000028）给入口偏移；LC_UUID 给唯一标识；LC_LOAD_DYLIB 族列依赖库。本工具按 cmdsize 遍历，未知 cmd 只标注不报错（Apple 会加新命令，向后兼容）。\n\n" +
      "**端序陷阱**：fat 头是大端、slice 内部是小端；单架构文件的 magic 按小端读——两种文件混在一个格式里，解析器必须分清。",
    usage:
      "拖入 Mach-O 文件（无扩展名也行，靠 magic 识别），出结构报告：fat 架构表 + 每个 slice 的 load command 清单与 segment/section 布局。\n\n" +
      "典型工作流：① fat 文件先看有哪些架构 → ② 看 LC_BUILD_VERSION 的 platform/minos 判目标系统版本 → ③ 看 LC_LOAD_DYLIB 判断链接了什么框架（逆向_hint）→ ④ __cstring/__objc_methname section 里常有明文字符串，配合 hexDump/strings 提取。\n\n" +
      "判别：`cafebabe` 开头 = universal fat（注意 Java class 文件也是 cafebabe 开头——靠后续字段区分）；`feedfacf`/`cffaedfe`（反序）= 64 位 Mach-O。",
    examples: [
      { in: "macOS启动器（项目自带 universal2，334KB）", out: "magic=0xcafebabe ✓，nfat_arch=2；arch #0：cputype=16777228（arm64）offset=16384 size=175080；arch #1：cputype=16777223（x86_64）…", desc: "真实样例；fat 表字段与手工探测逐字节一致" },
      { in: "（手工构造的最小 Mach-O：LC_SEGMENT_64 + LC_UUID + LC_MAIN）", out: "ncmds=3；segname=\"__TEXT\" vmsize=0x1000 nsects=1；section \"__text\"…；uuid=0011…；entryoff=0x90", desc: "逐字节 KAT：三类 load command 全识别" },
      { in: "cafebabe 00000063（fat 头声称 99 架构）", out: "报错：fat 头声称 99 个架构，超出文件大小", desc: "架构表越界严格校验" },
    ],
    formulas: [
      { tex: "\\text{fat} = \\underbrace{\\text{cafebabe}\\|n}_{8\\text{B}} \\;\\|\\; (\\text{cputype}\\|\\text{subtype}\\|\\text{offset}\\|\\text{size}\\|\\text{align})^{n}_{20\\text{B/条}}", caption: "fat 头全大端；offset 指向各架构 slice" },
      { tex: "\\text{lc} = cmd \\;(4\\text{B}) \\;\\|\\; cmdsize \\;(4\\text{B}) \\;\\|\\; \\text{payload}", caption: "load command 通用结构；未知 cmd 按 cmdsize 跳过" },
    ],
    tips: [
      "认题：macOS/iOS 逆向、IPA 拆包（Payload/*.app 里二进制）、CTF 的 macho 题；`file` 命令输出「Mach-O 64-bit executable」也是它。",
      "cafebabe 两义性：Java class 与 Mach-O fat 共用 magic——class 文件第 5-8 字节是 00 34（版本号），fat 是架构数；本工具按 fat 字段校验，Java class 会报「架构数越界」。",
      "__cstring/__objc_methname section 是字符串金矿，逆向第一步 strings 一遍；本工具给出每个 section 的 offset/size 便于精确提取。",
      "arm64e（0x0100000C+指针认证）与 arm64 的 cputype 相同位段不同 subtype——工具按 cputype 显示 arm64e。",
      "本工具不做反编译：函数体逆向用 Hopper/Ghidra/IDA；签名校验（LC_CODE_SIGNATURE）只展示位置不验证。",
      "标准来源：Apple 开源 mach-o/loader.h 与 fat.h（Darwin XNU/ctools）；结构与本项目自带的 universal2 真实启动器逐字节对拍。",
    ],
    aka: ["Mach-O 解析", "MachO", "mach-o 结构", "Mach-O 文件分析", "fat binary",
      "universal binary 解析", "machoParse", "Mach-O header", "mach-o load commands",
      "Mach-O segment", "macho 文件", "macOS 可执行文件", "iOS 二进制分析", "mach-o 格式", "MachO 结构"],
  },
  fileHeaderRepair: {
    what: "文件头检测与修复：按「扩展名 + 内容嗅探」双源判定文件真实格式，识别「缺了前 k 字节签名」与「头部若干字节被改坏」两种损伤，只覆写确实坏掉的字节，修完再做结构校验并另存产物。",
    principle:
      "**判定**：每种格式登记「固定签名段」（偏移 + 期望字节，如 PNG 的 8 字节签名、RIFF 容器偏移 0 的 `RIFF` 与偏移 8 的 `WAVE/AVI /WEBP`）。逐段比对得到差异字节数；另用前缀对齐判断「只是从头缺了 k 字节」——即 `data[0..len-k] == sig[k:]`（k 至少保留 2~4 字节证据，避免随机数据被误认）。\n\n" +
      "**评分**：完全匹配 > 缺头（k 越小越可信）> 坏字节（差异数绝对 ≤8 且不超过签名长度一半）。短签名必须靠「最小结构长度」兜底，否则 2 字节的 BMP 签名会在随机数据上压过 8 字节的 PNG。\n\n" +
      "**修复**：缺头 → 前置补 `sig[:k]`；坏字节 → 只改那几处偏移，其余字节原样保留（不做整段重写）。\n\n" +
      "**结构校验**：PNG 查 IHDR 位置 + 块 CRC + IEND；ZIP 在末尾 64KB 找 EOCD 并核对注释长度；RIFF 核对长度字段与实际差值；BMP 核对声明长度；JPEG/GIF/PDF 查结束标记（FFD9 / 0x3B / %%EOF）。校验不通过会明说「损坏不止文件头」。",
    usage: "拖入文件即可（也可在输入区粘十六进制）。模式选「仅检测」只看判定不产物；选「检测并修复」会在原目录生成 `<原名>.repaired<扩展名>`，原件不动。格式默认自动嗅探，扩展名与内容冲突时以内容为准并报警；小于 16 字节、超过处理上限或坏字节超限都只报不修。",
    examples: [
      { in: "PNG 被删掉前 2 字节", param: "检测并修复", out: "补齐 2 字节签名 → 产物 +2 字节，IHDR CRC / IEND 校验通过", desc: "缺头补齐" },
      { in: "PNG 签名里 3 个字节被改坏", param: "检测并修复", out: "只覆写那 3 个字节，长度不变，签名恢复", desc: "最小改动" },
      { in: "正常 WAV（RIFF…WAVE）", param: "仅检测", out: "签名完全匹配 + RIFF 长度自洽，不生成产物", desc: "不误改好文件" },
      { in: "ZIP 尾部被截掉 5 字节", param: "检测并修复", out: "头部完好但「未找到 EOCD」，只报告不产物", desc: "能区分「头坏」与「身断」" },
    ],
    tips: [
      "它只修文件头，不重建数据：结构校验不过说明文件被截断或中间缺块，补头也救不回来。",
      "扩展名是线索不是结论——`fake.png` 里装着 GIF，会按 GIF 判定并提示冲突，绝不按扩展名硬改。",
      "「缺头」和「坏头」处理方式不同：缺头是插入，坏头是覆写；报告里会写清补了几字节 / 改了哪几个偏移。",
      "ZIP 家族（docx/xlsx/pptx/apk/jar）共用 `PK\x03\x04`；空归档是 `PK\x05\x06`，也认。",
      "RIFF 容器（wav/avi/webp）的偏移 8 才是格式标识，只认偏移 0 的 `RIFF` 会把正常文件判错。",
      "小于 16 字节不修，是为了避免把残余数据截成「一段标准头」——这类文件更适合直接看十六进制。",
    ],
    aka: ["文件头修复", "文件头检测", "修复文件头", "file header repair", "magic 修复", "魔数修复",
      "文件类型识别", "文件头校验", "PNG 头修复", "JPEG 头修复", "ZIP 头修复", "损坏文件修复", "fileHeaderRepair"],
  },
  fileByteBridge: {
    what: "把磁盘文件与字节/编码串互相转换的一站式入口：Python bytes 字面量（b'\\xNN'）↔文本、文件→Bytes 字面量、文件→文本、文件→2/8/16 进制流、文件→Base64、Base64→文件、Hex→文件、Hex→.hex 文件，共 9 种模式合并为一个入口。",
    principle:
      "**Bytes 字面量**：文本按 UTF-8 编码成字节，再按 Python `repr(bytes)` 口径输出——可打印 ASCII 原样保留，`\\n`/`\\r`/`\\t` 用转义，其余写 `\\xNN`；反向解析支持 `\\xNN`、八进制、`\\uNNNN` 与引号外壳。中文会变成连续的 `\\xe4\\xbd\\xa0…`，这是 UTF-8 字节，不是乱码。\n\n" +
      "**文件→文本**：UTF-8 → GBK → Latin-1 依次尝试，全部显式报出尝试过程；**不按固定宽度硬切行**，保留原换行（这是「读取为文本」，不是十六进制查看器）。\n\n" +
      "**进制流**：每字节固定 8 位二进制 / 2 位十六进制 / 八进制不补零——定宽是可逆的关键。\n\n" +
      "**Base64 / Hex → 文件**：Base64 会先剥 data URI 前缀、去空白；Hex 会清洗 `0x`、逗号、引号等分隔符；两者都可手动指定扩展名，留空时按前几个字节的魔数猜（PNG/ZIP/JPEG/GIF/BMP/PDF/ELF/PE…）。前导零字节用逐字节解析保留，不做 `long_to_bytes(int(hex))` 那种吞零转换。",
    usage: "拖入文件后选模式即可；文本类模式也可直接粘贴。`文件→文本` 用编码下拉切换 UTF-8/GBK/Latin-1 优先级；产物类模式（文件→Base64、Base64→文件、Hex→文件、Hex→.hex）会给出下载按钮，产物不写用户磁盘，原名保留、扩展名可改。",
    examples: [
      { in: "你好", param: "文本 → Bytes 字面量", out: "b'\\xe4\\xbd\\xa0\\xe5\\xa5\\xbd'", desc: "中文 UTF-8 字节" },
      { in: "b'\\xe4\\xbd\\xa0\\xe5\\xa5\\xbd'", param: "Bytes 字面量 → 文本", out: "你好", desc: "往返还原" },
      { in: "拖入任意文件", param: "文件 → 2/8/16 进制流", out: "三节定宽流，每字节 8bit / 2hex / 八进制", desc: "定宽可逆" },
      { in: "data:image/png;base64,iVBORw0KGgo…", param: "Base64 → 文件", out: "decoded.png（按魔数识别）", desc: "data URI 也可" },
    ],
    tips: [
      "Python 的 `str(bytes)` 会把可打印 ASCII 留成字符、其余转义成 `\\xNN`；`\\x00` 这种前导零必须保留，否则字节序列就变了。",
      "「读取为文本」与「Hex Viewer」是两件事：前者不硬切行、可直接复制长行；后者才按 16 字节一行排版。",
      "Latin-1 兜底保证任何字节都能解出字符（不会丢字节），但它不是正确的中文编码——中文优先 UTF-8/GBK。",
      "Base64/Hex 转文件时若魔数识别失败，会退到 .bin；手动填扩展名最稳妥。",
      "产物走浏览器下载通道，不会悄悄写到你的硬盘目录——和直接写磁盘的工具行为不同。",
      "这一族合并了 9 个同类入口：bytes_to_str / str_to_bytes / file_to_bytes / file_to_txt / file_to_bin / file_to_base64 / base64_to_file / hex_to_file / txt_save_hex_file。",
    ],
    aka: ["文件转字节", "字节转文本", "Bytes 字面量", "bytes 转 str", "str 转 bytes", "文件读取为 Bytes",
      "文件读取为文本", "进制流", "文件转Base64", "Base64转文件", "Hex转文件", "hex 文件", "fileByteBridge"],
  },
};
