/*
 * edu-t1547.js — T1547 图像/文件工具纯 JS 项科普卡（2 项新增 op）。
 * 出处：V8.0.1 反编 image_tools/image_basic.py（merge_x/y/xy/decompose）、
 * image_tools/image_data.py（image_to_novel/novel_to_image）。纯数据无副作用。
 */
export default {
  nearestExtract: {
    what: "近邻法图片隐写提取：把大图按最近邻降采样到 10%~50%，让藏在「每隔 N 个像素」里的小图显现出来。",
    principle: "最近邻采样索引为 floor(i*step + step/2)，其中 step = 大图尺寸/小图尺寸，与 PIL 的 resize(NEAREST) 等价（V8 image_data.py 明确这么改的）。key 填 10 或 0.1 都表示 10%，留空一次给 10%~50% 五张；逐档输出降采样后的 PNG 产物。",
    usage: "粘贴 PNG（data URL 或 base64），可选填比例；下载的缩略图就是提取结果。",
    examples: [{ in: "64x64 的隔 8 像素条纹图", param: "scale=10", out: "6x6 PNG，隐藏条纹显现", desc: "V8 nearest_extract 口径" }],
    tips: ["这是「缩小才看得见」的经典 CTF 题型，放大原图反而看不出。", "最近邻不是双线性——它会保留硬边，正好适合还原隐藏的像素图。", "留空一次出五张（10/20/30/40/50%），方便逐档找最清楚的那张。", "必须PNG：有损压缩会破坏隐藏像素，JPEG 不适用。"],
    aka: ["近邻法", "nearestExtract", "近邻法图片隐写", "最近邻降采样", "nearest neighbor stego", "缩小显图", "隔像素隐藏", "近邻提取", "nearest 隐写", "图片缩小隐写", "最近邻采样", "NEAREST 缩放"],
  },
  imageMerge: {
    what: "把多张图片横向接成一条、纵向接成一列，或按因数排成方形网格，一次输出 PNG 下载产物。",
    principle: "横向：画布宽=各图宽之和、高=最大高，逐张按累加偏移贴入。纵向：画布宽=最大宽、高=各图高之和。方形：把图片数 n 分解成 (列,行)（列≥行，质数时退化为 n×1），按「最大宽×最大高」步进排布，并额外给出转置的另一种排布。V8 image_basic.py 的 decompose/merge_x/y/xy 口径。",
    usage: "逐行粘贴多张 PNG（data URL 或 base64），选横向/纵向/方形。方形档给两张产物（cols×rows 与 rows×cols）。",
    examples: [{ in: "3 张 PNG（3x2 / 2x4 / 2x2）", param: "横向", out: "7x4 的合并 PNG，逐字节可下载", desc: "V8 按各图尺寸累加，不是等分网格" }],
    tips: ["它和「精灵图互转」不同：精灵图是等分网格拆帧/合成，这里各图可宽高不等、按 max 宽高步进。", "质数量的图片排成一行——V8 原版会崩，本实现照其修复版退化为 n×1。", "画布用白色/透明底，RGBA 逐像素拷贝，不重采样。", "只收 PNG：其他格式的无损像素编解码需外部库，本工具不引入不可控依赖。"],
    aka: ["图片合并", "imageMerge", "横向合并图片", "纵向合并图片", "方形合并", "拼图", "图片拼接", "merge images", "多图合并", "横向拼接", "纵向拼接", "图像合并"],
  },
  novelInImage: {
    what: "Novel_In_Image：把文字逐字符藏进 PNG 像素（一个像素一个字符），也能把这种图片还原成文字。",
    principle: "编码规则来自 V8 image_data.py：每个字符取码点 cp，像素写 (R=0, G=cp>>8, B=cp&255)，全黑像素 (0,0,0) 作终止符；网格宽度可指定，留空按字数开方。解码逐像素读 (G<<8)+B 转字符，遇全黑即停。每像素只存 2 字节，增补平面字符（如 emoji）会被替换成 U+FFFD。",
    usage: "文字→图片：粘贴文本，可选填宽度，得到 PNG 产物。图片→文字：粘贴该 PNG（data URL 或 base64），方向选解码。",
    examples: [{ in: "flag{novel_in_image}", param: "width=5", out: "PNG（每像素一字符，末尾黑像素终止）", desc: "解码回去与原文逐字一致" }],
    tips: ["它不是「字符画」（imageToText 是亮度→ASCII），这里是把字符码点真存进颜色通道。", "全黑像素是终止符——所以原文里的 NUL 字符无法表示。", "emoji 等 U+10000 以上字符会丢高位，V8 源码也如此，不算 bug。", "图片经过有损压缩（JPEG）会破坏像素值，必须用 PNG 无损保存。"],
    aka: ["Novel_In_Image", "novelInImage", "文字藏图片", "图片藏文字", "小说藏图", "像素存字符", "文字转图片", "图片转文字", "novel in image", "字符像素", "UTF-16 像素", "藏字图片"],
  },
};
