/*
 * imageMergeTool.js — 纯 JS 图像合并 / Novel_In_Image。
 *
 * 算法来源：V8.0.1 反编源码 codecs/image_tools/image_basic.py
 *   images_merge_x / images_merge_y / images_merge_xy / decompose；
 *   codecs/image_tools/image_data.py::image_to_novel / novel_to_image。
 * 复用 stegoPixels.js 的 decodePNG / encodePNG（纯 JS PNG 全环境）。
 * 只处理 PNG 输入输出（V8 支持 jpg/bmp/gif，但我方无对应无损像素编解码器，
 * 如实限定边界，不引入不可控依赖）。
 */
import { register } from "./registry.js";
import { decodePNG, encodePNG } from "./stegoPixels.js";

const MAX_PX = 4_000_000;

function toBytes(src) {
  if (src instanceof Uint8Array) return src;
  if (src instanceof ArrayBuffer) return new Uint8Array(src);
  const s = String(src || "").trim();
  if (!s) return null;
  if (s.startsWith("data:")) return Uint8Array.from(atob(s.slice(s.indexOf(",") + 1)), (c) => c.charCodeAt(0));
  if (/^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0) {
    const out = new Uint8Array(s.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
    return out;
  }
  try { return Uint8Array.from(atob(s.replace(/\s+/g, "")), (c) => c.charCodeAt(0)); } catch { return null; }
}
const dataUrl = (bytes) => "data:image/png;base64," + btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));

function decompose(n) {
  if (n <= 0) return [0, 0];
  for (let rows = Math.floor(Math.sqrt(n)); rows > 0; rows--) if (n % rows === 0) return [n / rows, rows];
  return [n, 1];
}

function mergeRun(text, p) {
  const mode = (p && p.mode) || "x";
  const lines = String(text ?? "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (!lines.length) return "请逐行粘贴多张 PNG（data URL 或 base64）。";
  const imgs = [];
  for (const line of lines) {
    const bytes = toBytes(line);
    if (!bytes) return `第 ${imgs.length + 1} 张不是可识别的 PNG/base64。`;
    const im = decodePNG(bytes, { maxPixels: MAX_PX });
    imgs.push(im);
  }
  const maxW = Math.max(...imgs.map((i) => i.width));
  const maxH = Math.max(...imgs.map((i) => i.height));
  let W, H, placements = [];
  if (mode === "x") {
    W = imgs.reduce((s, i) => s + i.width, 0); H = maxH;
    let x = 0;
    for (const im of imgs) { placements.push([im, x, 0]); x += im.width; }
  } else if (mode === "y") {
    W = maxW; H = imgs.reduce((s, i) => s + i.height, 0);
    let y = 0;
    for (const im of imgs) { placements.push([im, 0, y]); y += im.height; }
  } else {
    const [cols, rows] = decompose(imgs.length);
    const layouts = [[cols, rows], [rows, cols]];
    const results = [];
    for (const [cx, cy] of layouts) {
      W = maxW * cx; H = maxH * cy;
      if (W * H > MAX_PX) return "合并后像素超出上限（400 万像素），请缩小原图。";
      const canvas = new Uint8ClampedArray(W * H * 4);
      imgs.forEach((im, idx) => {
        const ox = (idx % cx) * maxW, oy = Math.floor(idx / cx) * maxH;
        for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
          const si = (y * im.width + x) * 4, di = ((oy + y) * W + ox + x) * 4;
          canvas[di] = im.data[si]; canvas[di + 1] = im.data[si + 1];
          canvas[di + 2] = im.data[si + 2]; canvas[di + 3] = im.data[si + 3];
        }
      });
      results.push({ png: encodePNG(canvas, W, H), W, H });
    }
    const urls = results.map((r) => dataUrl(r.png));
    return { text: `方形合并两种排布：\n${urls[0]}\n${urls[1]}`, files: results.map((r, i) => ({ name: `merged_xy_${i + 1}.png`, bytes: r.png })) };
  }
  if (W * H > MAX_PX) return "合并后像素超出上限（400 万像素），请缩小原图。";
  const canvas = new Uint8ClampedArray(W * H * 4);
  for (const [im, ox, oy] of placements) {
    for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
      const si = (y * im.width + x) * 4, di = ((oy + y) * W + ox + x) * 4;
      canvas[di] = im.data[si]; canvas[di + 1] = im.data[si + 1];
      canvas[di + 2] = im.data[si + 2]; canvas[di + 3] = im.data[si + 3];
    }
  }
  const png = encodePNG(canvas, W, H);
  return { text: `合并成功：${imgs.length} 张 → ${W}x${H}\n${dataUrl(png)}`, files: [{ name: "merged.png", bytes: png }] };
}

function novelEncode(text, p) {
  const s = String(text ?? "");
  if (!s) return "（空输入）";
  const wArg = Number(p && p.width);
  const cols = Number.isInteger(wArg) && wArg > 0 ? wArg : Math.ceil(Math.sqrt(s.length));
  const rows = Math.ceil(s.length / cols);
  if (cols * rows > MAX_PX) return "图片过大，请缩短文本。";
  const data = new Uint8ClampedArray(cols * rows * 4);
  let astral = 0;
  Array.from(s).forEach((ch, i) => {
    let cp = ch.codePointAt(0);
    if (cp > 0xffff) { cp = 0xfffd; astral++; }
    data[i * 4] = 0; data[i * 4 + 1] = (cp >> 8) & 255; data[i * 4 + 2] = cp & 255; data[i * 4 + 3] = 255;
  });
  // 末尾全黑像素为终止符（V8 image_to_novel 遇全黑即停）
  const png = encodePNG(data, cols, rows);
  const tip = astral ? `（${astral} 个增补平面字符已替换为 U+FFFD）` : "";
  return { text: `文字转图片成功：${Array.from(s).length} 字 → ${cols}x${rows}${tip}\n${dataUrl(png)}`, files: [{ name: "novel_image.png", bytes: png }] };
}
function novelDecode(text) {
  const bytes = toBytes(text);
  if (!bytes) return "请粘贴 PNG 图片（data URL 或 base64）。";
  const im = decodePNG(bytes, { maxPixels: MAX_PX });
  let out = "";
  for (let i = 0; i < im.width * im.height; i++) {
    const r = im.data[i * 4], g = im.data[i * 4 + 1], b = im.data[i * 4 + 2];
    if ((r | g | b) === 0) break;
    out += String.fromCharCode(((g << 8) + b) & 0xffff);
  }
  return out || "（未解出字符）";
}

register({
  id: "imageMerge", cat: "image", name: "图片横/纵/方形合并",
  desc: "逐行粘贴多张 PNG，横向接成一条 / 纵向接成一列 / 方形两种排布各出一张（V8 image_basic.py images_merge_x/y/xy）；按 max 宽高步进，输出 PNG 下载产物。",
  params: [
    { key: "mode", label: "合并方式", type: "select", default: "x", options: [
      { value: "x", label: "横向" }, { value: "y", label: "纵向" }, { value: "xy", label: "方形两种排布" },
    ] },
  ],
  run: mergeRun,
});

register({
  id: "novelInImage", cat: "image", name: "Novel_In_Image 文字↔图片",
  desc: "每像素存 1 字符：R=0、G=ord>>8、B=ord&255，全黑像素为终止符（V8 image_data.py image_to_novel/novel_to_image）；PNG 双向。",
  params: [
    { key: "dir", label: "方向", type: "select", default: "enc", options: [
      { value: "enc", label: "文字→图片" }, { value: "dec", label: "图片→文字" },
    ] },
    { key: "width", label: "图片宽度（留空自动开方）", type: "number", default: 0 },
  ],
  run: (t, p) => (p && p.dir === "dec" ? novelDecode(t) : novelEncode(t, p)),
});

export { mergeRun, novelEncode, novelDecode };

// ============ 近邻法图片隐写提取（V8 image_data.py::nearest_extract）============
function parseScales(key) {
  const t = String(key ?? "").trim().replace(/%$/, "").trim();
  if (!t) return [0.1, 0.2, 0.3, 0.4, 0.5];
  const v = Number(t);
  if (!Number.isFinite(v) || v <= 0 || v > 100) return null;
  return [v > 1 ? v / 100 : v];
}
function nearestExtractRun(text, p) {
  const bytes = toBytes(text);
  if (!bytes) return "请粘贴 PNG 图片（data URL 或 base64）。";
  const scales = parseScales(p && p.scale);
  if (!scales) return "scale 需为比例数字：10 表示 10%，0.1 同样表示 10%；留空出 10%~50% 五张。";
  const im = decodePNG(bytes, { maxPixels: MAX_PX });
  const files = [], lines = [];
  for (const s of scales) {
    const sw = Math.max(1, Math.round(im.width * s)), sh = Math.max(1, Math.round(im.height * s));
    const out = new Uint8ClampedArray(sw * sh * 4);
    const stepX = im.width / sw, stepY = im.height / sh;
    for (let y = 0; y < sh; y++) {
      const sy = Math.min(im.height - 1, Math.floor(y * stepY + stepY * 0.5));
      for (let x = 0; x < sw; x++) {
        const sx = Math.min(im.width - 1, Math.floor(x * stepX + stepX * 0.5));
        const si = (sy * im.width + sx) * 4, di = (y * sw + x) * 4;
        out[di] = im.data[si]; out[di + 1] = im.data[si + 1];
        out[di + 2] = im.data[si + 2]; out[di + 3] = im.data[si + 3];
      }
    }
    const png = encodePNG(out, sw, sh);
    files.push({ name: `${Math.round(s * 100)}%.png`, bytes: png });
    lines.push(`${Math.round(s * 100)}% → ${sw}x${sh}`);
  }
  return { text: `近邻法提取完成（原图 ${im.width}x${im.height}）：\n${lines.join("\n")}`, files };
}

register({
  id: "nearestExtract", cat: "image", name: "近邻法图片隐写提取",
  desc: "最近邻降采样到 N%（key=10 或 0.1 表示 10%，留空出 10%~50% 五张），让「隔 N 像素藏的小图」显现；采样索引 floor(i*step+step/2) 等价 PIL resize(NEAREST)，纯 JS PNG。",
  params: [
    { key: "scale", label: "缩小比例（10=10%，留空出五张）", type: "text", default: "" },
  ],
  run: nearestExtractRun,
});

export { nearestExtractRun };
