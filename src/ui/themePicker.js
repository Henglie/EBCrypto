export const THEME_VARIANTS = [
  { id: "google-blue", zh: "谷歌蓝", en: "Google Blue", dark: true, series: "m3", swatch: ["#a8c7fa", "#10141b"] },
  { id: "evergreen", zh: "常青", en: "Evergreen", dark: true, series: "m3", swatch: ["#9cd9a3", "#0d130e"] },
  { id: "lavender", zh: "薰衣草", en: "Lavender", dark: false, series: "m3", swatch: ["#6750a4", "#fef7ff"] },
  { id: "sunny", zh: "暖阳", en: "Sunny", dark: false, series: "m3", swatch: ["#745b00", "#fff8f1"] },
  { id: "graphite", zh: "石墨", en: "Graphite", dark: true, series: "m3", swatch: ["#c3c7cf", "#101214"] },
  { id: "obsidian-gold", zh: "曜金 VIP", en: "Obsidian Gold", dark: true, series: "cn", swatch: ["#e6cb8f", "#121009"] },
  { id: "celadon-night", zh: "夜青瓷", en: "Celadon Night", dark: true, series: "cn", swatch: ["#b3e4d9", "#0d1515"] },
  { id: "imperial-violet", zh: "紫檀", en: "Imperial Violet", dark: true, series: "cn", swatch: ["#dccbf7", "#14101a"] },
  { id: "pine-ink", zh: "松烟", en: "Pine Ink", dark: true, series: "cn", swatch: ["#badbb4", "#0f140f"] },
  { id: "rice-paper", zh: "宣纸", en: "Rice Paper", dark: false, series: "cn", swatch: ["#f7f1e5", "#7c4a21"] },
];

// Imported palettes retain their paper, panels, accent and names. Text roles are
// adapted for contrast across the actual M3 surfaces, without changing layout.
const IMPORTED_PALETTES = [
  ["palette-light", "清昼浅蓝", "Light", false, "#f8fafc", "#ffffff", "#f1f5f9", "#f1f5f9", "#0f172a", "#64748b", "#3b82f6", "#e2e8f0"],
  ["palette-dark", "深夜湛蓝", "Dark", true, "#0c1222", "#1a2332", "#141c2b", "#0f1729", "#f8fafc", "#94a3b8", "#6db3ff", "#283548"],
  ["pink", "柔樱浅粉", "Pink", false, "#fef7fb", "#ffffff", "#fdf0f5", "#fdf0f5", "#4a2039", "#9d7088", "#e8849f", "#f3dce6"],
  ["tingwu", "庭芜绿 · 姜红", "Tingwu Green · Ginger Red", false, "#f5f6ec", "#ffffff", "#eaeed8", "#eaeed8", "#2f4526", "#6f8560", "#6fa054", "#d8e0c2"],
  ["dongfang", "东方既白 · 鸢色", "Dawn White · Iris Blue", false, "#eef4fa", "#ffffff", "#e2ebf5", "#e2ebf5", "#22405f", "#6b7d99", "#3a679e", "#cdd9e8"],
  ["chunchen", "春辰 · 桃夭粉", "Chunchen · Peach Pink", false, "#f0f1ed", "#ffffff", "#e5e7e0", "#e5e7e0", "#35452a", "#78856a", "#7b9651", "#d7dccd"],
  ["ruolan", "挼蓝 · 绛纱色", "Ruolan Blue · Rose Gauze", false, "#faf4e9", "#ffffff", "#f3e9d8", "#f3e9d8", "#1f4b68", "#7b8a94", "#4b90bf", "#e6dac6"],
  ["linye", "林野脉冲", "Forest Pulse", false, "#f2f7e4", "#ffffff", "#e6eec9", "#e6eec9", "#1e4a50", "#6b8378", "#35858e", "#d3e0b6"],
  ["shanhu", "珊瑚警报", "Coral Alert", false, "#fdfaf0", "#ffffff", "#faf5e4", "#faf5e4", "#0f4a41", "#6f7d71", "#125b50", "#ecdfc2"],
  ["nihong", "霓虹频谱", "Neon Spectrum", false, "#f8f5ff", "#ffffff", "#efe8ff", "#e9eeff", "#40217a", "#7b7391", "#a561ff", "#e2d7fb"],
  ["spark", "小小火花", "Little Spark", false, "#f5f8ff", "#ffffff", "#eaf1ff", "#eaf1ff", "#29436d", "#526789", "#3567b7", "#c2d5f5"],
  ["shenhai", "深海薄荷绿", "Deep Sea Mint", true, "#0a1e21", "#122b2e", "#0e2427", "#0c2225", "#e9f4ef", "#8caea4", "#7fc3a6", "#22413f"],
  ["wuye", "午夜蓝紫", "Midnight Blue Violet", true, "#14152e", "#1f2145", "#1a1c38", "#17182f", "#eeecfb", "#9d97c4", "#a79edc", "#332f5c"],
  ["jiaotang", "咖棕焦糖", "Coffee Caramel", true, "#191007", "#271a0e", "#1f150b", "#1d1309", "#f7ede1", "#b39a80", "#d2954f", "#3d2c1a"],
  ["molv", "墨绿玫瑰", "Ink Green Rose", true, "#0d1f19", "#162d24", "#11261e", "#10241d", "#ecf2ec", "#93a89a", "#cf838a", "#26433a"],
];
for (const [id, zh, en, dark, bg, panel, tertiary, sidebar, text, muted, accent, border] of IMPORTED_PALETTES) {
  THEME_VARIANTS.push({ id, zh, en, dark, series: "imported", swatch: [accent, bg],
    colors: { bg, panel, tertiary, sidebar, text, muted, accent, border } });
}

function rgb(hex) { return hex.slice(1).match(/../g).map(c => parseInt(c, 16)); }
function mix(a, b, weight) {
  const other = rgb(b);
  return "#" + rgb(a).map((v, i) => Math.round(v * (1 - weight) + other[i] * weight).toString(16).padStart(2, "0")).join("");
}
function luminance(hex) {
  return rgb(hex).map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}
export function colorContrast(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function readable(color, surfaces, toward, minimum = 4.5) {
  for (let i = 0; i <= 100; i++) {
    const candidate = mix(color, toward, i / 100);
    if (surfaces.every(bg => colorContrast(candidate, bg) >= minimum)) return candidate;
  }
  return toward;
}

export function importedThemeTokens(variant) {
  if (!variant?.colors) return {};
  const c = variant.colors, dark = variant.dark;
  const surfaces = [c.bg, c.panel, c.tertiary, c.sidebar];
  const pole = dark ? "#ffffff" : "#000000";
  const primary = readable(c.accent, surfaces, pole);
  const onPrimary = colorContrast(primary, "#ffffff") >= colorContrast(primary, "#000000") ? "#ffffff" : "#000000";
  const container = mix(c.panel, c.accent, dark ? 0.22 : 0.12);
  const warning = dark ? "#fcd34d" : "#92400e";
  return {
    bg: c.bg, surface: c.bg, "surface-1": c.panel, "surface-2": c.tertiary,
    "surface-3": mix(c.panel, c.accent, 0.06), "surface-4": mix(c.panel, c.accent, 0.10), "surface-hi": container,
    primary, "on-primary": onPrimary, "primary-container": container,
    "on-primary-container": readable(c.text, [container], pole),
    "on-surface": c.text, "on-surface-var": readable(c.muted, surfaces, pole),
    outline: readable(c.muted, surfaces, pole, 3), "outline-var": c.border,
    error: dark ? "#fca5a5" : "#b91c1c", "on-error": dark ? "#450a0a" : "#ffffff",
    success: readable(dark ? "#86efac" : "#15803d", surfaces, pole),
    warning, "on-warning": dark ? "#422006" : "#ffffff", "warning-text": warning,
    "field-bg": c.panel, "flag-hit": dark ? "#ffe082" : "#92400e", "flag-format": dark ? "#ffca28" : "#92400e",
    "grad-primary": `linear-gradient(135deg, ${primary}, ${primary})`,
    "imported-accent": c.accent, "imported-sidebar": c.sidebar,
  };
}

export function applyThemeVariant(root, variant) {
  const tokens = importedThemeTokens(variant);
  // Prefix keeps named palettes independent of dynamic accent overrides.
  for (const key of Object.keys(importedThemeTokens(THEME_VARIANTS.find(v => v.colors)))) {
    root.style.removeProperty("--palette-" + key);
  }
  root.toggleAttribute("data-imported-palette", !!variant?.colors);
  for (const [key, value] of Object.entries(tokens)) root.style.setProperty("--palette-" + key, value);
}
export function themeVariant(id) { return THEME_VARIANTS.find(theme => theme.id === id); }
