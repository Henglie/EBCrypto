<p align="center">
  <a href="./README.md">简体中文</a> · <b>English</b>
</p>

<p align="center">
  <img src="./public/icons/logo.png" width="120" height="120" alt="EBCrypto" />
</p>
<h1 align="center">
  <span>EBCrypto</span>
</h1>
<p align="center">
  <span align="center">A local-first, zero-upload codec / cryptography / steganalysis toolbox: 1000+ registered operations across 23 categories, most running entirely in your browser; Windows can additionally enable local-bridge capabilities, while macOS / Linux ship with double-click launchers.</span>
</p>

<p align="center">
  <a href="https://github.com/Henglie/EBCrypto/stargazers"><img src="https://img.shields.io/github/stars/Henglie/EBCrypto?style=flat-square" alt="GitHub Repo stars" /></a>
  <a href="https://github.com/Henglie/EBCrypto/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Henglie/EBCrypto?style=flat-square" alt="GitHub License" /></a>
  <a href="https://github.com/Henglie/EBCrypto/releases"><img src="https://img.shields.io/github/v/release/Henglie/EBCrypto?style=flat-square" alt="GitHub Release" /></a>
</p>
<p align="center">
  <a href="https://github.com/Henglie/EBCrypto/issues"><img src="https://img.shields.io/github/issues/Henglie/EBCrypto?style=flat-square" alt="GitHub Issues" /></a>
  <a href="https://github.com/Henglie/EBCrypto/pulls"><img src="https://img.shields.io/github/issues-pr/Henglie/EBCrypto?style=flat-square" alt="GitHub Pull Requests" /></a>
  <a href="https://github.com/Henglie/EBCrypto/network/members"><img src="https://img.shields.io/github/forks/Henglie/EBCrypto?style=flat-square" alt="GitHub forks" /></a>
</p>

> [!WARNING]
> This tool is intended solely for CTF learning, competitions, and security research. Do not use it for anything illegal, for infringing on the rights of others, or for any purpose that could get you into trouble. You are responsible for all consequences of improper use.
> If you find a bug, an incorrect algorithm result, or missing documentation, feel free to open an Issue, ideally with a sample input, the expected output, and reproduction steps.

## Table of Contents

- [Quick Download](#quick-download)　　　　[Changelog](#changelog)
- [Introduction](#introduction)　　　　[Features](#features)
- [Screenshots](#screenshots)　　　　[Running](#running)
- [Platform Compatibility](#platform-compatibility)　　[Performance Requirements](#performance-requirements)
- [Directory Structure](#directory-structure)　　　　[Capabilities](#capabilities)
- [Plugins & AI Access](#plugins--ai-access)　　[License](#license)
- [Third-party Resources & Licenses](#third-party-resources--licenses)　　[Privacy](#privacy)
- [Keywords](#keywords)

## Quick Download

> Core processing runs locally with zero upload. Unzip and double-click `Start-Windows.exe`, `Start-macOS.command`, or `Start-Linux.sh` for your platform. The native static server needs no Python; CLI / MCP still require Node.js, and Python-based tools require a local Python installation. The alternative `GenericStart.py` launcher requires Python 3.

| Cloud drive | Link | Passcode |
|---|---|---|
| Baidu Netdisk | https://pan.baidu.com/s/1Uqq_ONMBG9qA0dJvUG53Og?pwd=0000 | 0000 |
| Quark | https://pan.quark.cn/s/3b7e573b19c0 | none |

Current version **v0.2.0-beta**. The source of truth is always the GitHub repository: [github.com/Henglie/EBCrypto](https://github.com/Henglie/EBCrypto).

## Changelog

**v0.2.0-beta (2026-11-11):** unified resource limits (soft confirm / hard cap / cancel / retry), structured MCP errors with a 128KB inline threshold, a local environment/tool manager page, HTTP MCP built into the launcher, unified ZIP / 7z / TAR limits, and single-executable windowed distribution in progress.

**v0.1.15 (2026-11-08):** UI release towards 0.2.0 (three-pane workbench, draggable splitters, adjustable I/O, M3 motion).

Full history: [CHANGELOG.md](./CHANGELOG.md).

## Introduction

**EBCrypto's north star:** move from a CTF codec collection to a general cryptography toolbox — readable enough for beginners to learn each algorithm, solid enough for professionals to use in daily encryption, encoding and standards-compliance work. Stay truly cross-platform (Windows / macOS / mainstream Linux / Chinese domestic Linux / HarmonyOS and OpenHarmony) with a pure front-end, zero-egress architecture and no platform-bound dependencies. Every algorithm must be extractable as an authoritative source: no UI dependency, pure functions, comments citing the standard number, edition and reference implementation, official test vectors, and the full feature set the standard requires.

Version 0.2.0 remains in development. The new single-executable windowed distribution, native HarmonyOS edition and further algorithm/documentation work follow their own milestones; the bilingual offline manual is being written and is not yet available as a complete book. Repository URL migration is separate, so current links still point to the existing repository.

`EBCrypto` (Chinese brand: 码小妹; formerly "Henglie CTF Codebox" / EBCTFCodeBox) is a local-first toolbox built around CTF scenarios but aimed at general-purpose encoding/decoding and cryptography needs.

It gathers encoding, classical ciphers, modern cryptography, hash verification, radix conversion, cryptanalysis / brute force, steganography, and image tooling into a single page. Core computation happens locally in the browser — your input is never uploaded; Windows can optionally enable a local bridge. The goal is to serve competition solving, cryptography learning, and everyday toolbox needs alike.

Core design:

- Native ES modules, no framework, no build step
- High-performance algorithms compiled to WASM from C / emscripten
- Material 3 warm-red theme, light / dark modes
- Bundled Cheonhyeong full-font library — rare glyphs render everywhere
- 20 languages

---

## Features

- **Local-first · zero upload**: Native ES modules, no framework, no build step. Core codecs run in-browser and never upload your input; "external link" ops only generate URLs. PWA updates fetch site assets only, the local bridge only talks to `127.0.0.1`, and external AI is only used after you configure an endpoint yourself.
- **One-shot smart decoding**: Paste or drop content; it detects possible encoding chains and returns ranked decode candidates, with crib-based filtering and deep brute force.
- **1000+ registered operations · 23 categories**: covering Base, text / transfer encodings, fancy CTF encodings, esoteric programming languages, Chinese / domestic encodings, classical ciphers, modern crypto (block / stream / asymmetric / other), hashes & checksums, radix & charsets (incl. primality testing and sieving), analysis / brute force, password attacks, compression & archives, password / archive cracking, forensics & traffic, file-format structures, data structures, images & QR codes, audio & video, steganography, plus 3 optional Windows GUI bridge entries. The complete list is generated automatically from the registry; another hundreds of operations are available through the optional official add-on.
- **Decoding-strength quartet** (v0.1.2): strength levels + custom algorithm pool + a **separate brute-force channel** (XOR / Caesar / dictionary / rainbow-table / HMAC / PBE / Playfair / ZIP / CRC32 / bkcrack — results are grouped separately so they don't pollute the main ranking) + **decode depth 1–3**.
- **Lenient matching mode** (v0.1.2): at the Enhanced / Very Strong / Maximum / Custom levels, algorithms are admitted by character-class count alone, so variant-encoding challenges (a "meow" table for 0/1, emoji-as-binary) also participate; Default / Fast keep strict domain detection.
- **Key + ciphertext one-shot attack**: given ciphertext and a key, automatically enumerates AES / DES / 3DES / RC4 / XOR / Fernet × cipher modes × encoding combinations.
- **Drag-in file analysis**: dropping a file auto-detects its type, appended data, anomalous image dimensions, and more.
- **Full Unicode display**: bundled Cheonhyeong full-font library, loaded per Unicode plane on demand — rare characters, ancient scripts, and emoji all render correctly.
- **Cross-linked explainer cards**: when an explainer mentions an algorithm this toolbox implements, the name links to that op page in a new tab; only high-confidence names/aliases qualify, and book titles, code, formulas, and generic words are skipped.
- **Material 3 warm-red theme**, light / dark toggle, 20 languages.

> For the full feature walkthrough and scenario demos, see [`docs/introduction.md`](./docs/introduction.md) (Chinese).

## Screenshots

<p align="center">
  <img src="docs/images/one-click-decode.png" alt="One-shot smart decoding" width="80%" />
</p>

<p align="center"><i>One-shot smart decoding: paste text and get ranked decode chains automatically</i></p>

<p align="center">
  <img src="docs/images/file-parse-demo.gif" alt="File analysis demo" width="80%" />
</p>

<p align="center"><i>Drop a file to auto-detect its type and strip appended data</i></p>

<p align="center">
  <img src="docs/images/recipe-chain-demo.gif" alt="Recipe chain demo" width="80%" />
</p>

<p align="center"><i>Recipe chains: wire multiple algorithms into a visual pipeline</i></p>

<table>
  <tr>
    <td><img src="docs/images/code-image-gallery.png" alt="Encoding chart gallery" /></td>
    <td><img src="docs/images/edu-card-demo.png" alt="Crypto explainer card" /></td>
  </tr>
  <tr>
    <td align="center"><i>Encoding chart gallery · 253 reference tables</i></td>
    <td align="center"><i>Every algorithm ships with an edu explainer card</i></td>
  </tr>
  <tr>
    <td><img src="docs/images/about-light.png" alt="Light theme" /></td>
    <td><img src="docs/images/about-dark.png" alt="Dark theme" /></td>
  </tr>
  <tr>
    <td align="center"><i>Light theme</i></td>
    <td align="center"><i>Dark theme (Material 3 day/night)</i></td>
  </tr>
</table>

## Running

Pure static — any static server works. The bundled script is recommended (double-click or command line):

```bash
py GenericStart.py     # Windows (use py, not python3)
python3 GenericStart.py # macOS / Linux
```

The script starts the static server and the local bridge (bridge.py, fixed port 8181, real capabilities on Windows only) together, then opens your default browser. The bridge runs in a background thread of the same process — no second window.

### Double-click launch on Linux / macOS

Equivalent to the "double-click the exe" flow on Windows. Only the **double-click entry points** live in the root; the binary cores are tucked into `bin/` (so they don't get clicked by mistake):

| File | Platform | How to use |
|---|---|---|
| `Start-Windows.exe` | Windows | **Double-click** (32-bit single file, works on 64-bit and ARM64 Windows) |
| `Start-macOS.command` | macOS | **Double-click** in Finder → Terminal opens and the control panel runs |
| `Start-Linux.sh` | Linux | KDE (Dolphin): **double-click**; GNOME (Nautilus): right-click → Run (or tick "Allow executing as program" in Properties, then double-click) |
| `bin/launcher-macos` | macOS | universal2 single file (Apple Silicon + Intel), invoked by the .command above — no need to click directly |
| `bin/launcher-linux` | Linux | x86_64 ELF, invoked by the .sh above — no need to click directly |

- macOS uses `.command` because Finder won't open a terminal for a bare binary; Linux desktop environments disagree on double-click behaviour for raw binaries, so `.sh` + the executable bit is the portable choice.
- **First use**: if double-clicking does nothing after unzipping, grant the executable bit once (`chmod +x Start-macOS.command bin/launcher-macos Start-Linux.sh bin/launcher-linux`). The launchers are unsigned — if Gatekeeper blocks the first open on macOS, click "Open Anyway" in System Settings → Privacy & Security, or right-click → Open.
- **Feature parity with Windows**: same C source; the control panel is 1 restart service / 2 free the occupied port / 3 local-bridge settings / 4 open browser / 5 refresh status / 0 exit (keyboard-driven line menu on Linux/macOS — no mouse hover highlighting, a terminal capability difference); local bridge, MCP, pyc decompile, and environment probing all work. Windows-only GUI tool launching and system accent colour degrade gracefully with a notice on these platforms. Both artifacts have passed static acceptance (architecture / linked dependencies / branch fingerprints / endpoint strings); real-machine acceptance is ongoing.

Or point any static server at the project root. There is no build step: edit and refresh.

### Deploying without Python

The project is pure static assets and can be hosted by any HTTP server (ES modules require an http(s) context — you cannot just double-click `index.html` over file://). Without Python, or if you would rather not use the launcher, pick one:

```bash
npx serve .                    # Node.js (pick any port)
python3 -m http.server 8180    # Python 3 installed, but not using the launcher
php -S localhost:8180          # PHP built-in server
```

Full web servers (nginx / Apache / Caddy, …) work too; two caveats:

1. `.wasm` must be served as `application/wasm`, otherwise the browser refuses streaming compilation.
2. Multithreaded WASM (e.g. bkcrack's pthread build) relies on `SharedArrayBuffer` and requires cross-origin isolation headers:

   ```
   Cross-Origin-Opener-Policy: same-origin
   Cross-Origin-Embedder-Policy: require-corp
   ```

   The bundled `GenericStart.py` sends both headers by default; self-hosted servers need their own configuration. When the headers are missing, multithreaded WASM ops degrade gracefully or report unavailable — pure frontend features are unaffected.

The PWA is wired through `manifest.json` and `sw.js`. The current precache list contains 990 core runtime assets (the count changes with each version; updates download changed content by checksum). Core features work offline after cache installation completes; large on-demand assets (the four Cheonhyeong font planes, WASM, IDS data, encoding charts and KaTeX) must first be loaded online or installed through an offline pack. The top-bar "Check for updates" button currently opens the version page; Service Worker activation and cross-browser offline upgrades remain under verification.

## Platform Compatibility

| Platform | Frontend features | Local bridge (exe tools) | Launch |
|---|---|---|---|
| Windows | Full (primary platform) | JPHS / OpenPuff / OurSecret (GUI launch) + pyc/exe local decompile + system accent colour sync | `py GenericStart.py` |
| macOS | Full | Unavailable (no .exe); the bridge is auto-skipped and related ops grey out with a notice | Double-click `Start-macOS.command`, or `python3 GenericStart.py` |
| Linux | Full | Same as macOS, bridge auto-skipped | Double-click `Start-Linux.sh`, or `python3 GenericStart.py` |
| ChromeOS | Full (via the Crostini Linux container) | Same as Linux | `python3 GenericStart.py` (inside Crostini) |
| HarmonyOS / Android / iOS | Full (PWA, touch-responsive) | Unavailable (no exe on mobile) | Open the deployed URL in a browser; optionally "Add to Home Screen" |

Notes:

- "Local bridge" refers to `bridge.py` (port 8181, Windows only), providing GUI launching, pyc/exe decompile, system accent colour, and other on-device capabilities. When the bridge is unavailable, in-browser features still work; bridge-dependent entries degrade with a notice.
- Mobile / HarmonyOS works offline after installing as a PWA; large assets (fonts / WASM / charts) are cached on demand and fetched once online at first use.
- The bridge only listens on `127.0.0.1` and never sends anything out — the zero-upload rule holds.

### Browser Requirements

Requires a modern browser with ES modules, WebAssembly, Web Workers, Service Worker, Web Crypto API, and DecompressionStream:

- Chrome / Edge 90+
- Firefox 113+
- Safari 16.4+

## Performance Requirements

The project is a pure frontend application — regular computation happens in the browser, with no server-side compute dependency; the few Windows local-bridge capabilities are noted separately. Requirements and suggestions per dimension:

| Dimension | Minimum | Recommended | Notes |
|---|---|---|---|
| CPU | single core | 4 cores+ | Web Worker pool size = `min(8, navigator.hardwareConcurrency)`; more cores speed up brute force / chunked large-file work |
| Memory | 512 MB | 1 GB+ | Cheonhyeong fonts and WASM load on demand; large-file analysis grows linearly with file size |
| GPU | not needed | hardware acceleration on | No GPU compute; GPU-accelerated compositing improves scroll / animation smoothness |
| Disk | keep 100 MB+ free | same | Code, fonts, WASM, and charts grow with versions — refer to the actual release package |
| Network | connection needed for first load | stable connection | Input is never uploaded; core features work offline after PWA install |
| Architecture | x86 / x64 / ARM all fine | same | The browser abstracts the architecture; WASM runs across them |

Multithreaded WASM (`SharedArrayBuffer`) needs the cross-origin isolation headers (COOP/COEP); `GenericStart.py` sends them by default, and without them multithreaded ops fall back to single-thread or report unavailable, without affecting anything else. First paint uses HTTP/1.1 keep-alive, an early ES module entry, and lazy font loading; the complete offline assets are installed by the Service Worker in the background after the page loads.

## Directory Structure

```
index.html          entry
src/
  main.js           UI driver (declarative rendering from the registry)
  core/             algorithm layer (pure functions; each module self-registers into the registry)
  ui/               styles + icons + font loading
  i18n/             20 language packs (static zh/en master + 18 dynamic shards, incl. RTL and four ethnic-language packs)
public/
  icons/            Material Symbols Rounded icons (SVG)
  fonts/th/         Cheonhyeong first-paint subset + 4 plane WOFF2 files
资料/               algorithm cross-check tables + research artifacts (dev-only; not shipped in release packages)
```

## Capabilities

> The per-algorithm list lives in the in-app "All algorithms" page and the offline manual; the README no longer duplicates it.

| Capability group | Ops | Examples |
|---|---:|---|
| Base / text / radix / charsets | 192 | Base family, URL/HTML encoding, arbitrary radix, charset conversion |
| Novelty / CTF / esolangs / Chinese local | 120 | Buddha says, bear says, socialist core values, Brainfuck, Chinese telegraph code |
| Classical ciphers | 76 | Vigenère, Rail Fence, Playfair, Enigma |
| Modern crypto (block / stream / asymmetric / other) | 214 | AES, SM4, ChaCha20, RSA, SM2, SM9, NTRU |
| Hash / checksum | 82 | MD5 / SHA family, SM3, CRC, HMAC |
| Analysis / brute force / attacks | 83 | Frequency analysis, RSA attacks, SM2 / SM9 attacks, dictionary cracking |
| Compression / archives / password cracking | 34 | ZIP / 7z, office2john, hashcat integration |
| Forensics / file formats / data structures | 78 | pcap, PE / ELF, Protobuf, NBT |
| Image / QR / audio | 46 | QR codes, blind watermark, GIF timing, spectrogram |
| Steganography (text / file) | 45 | Zero-width, LSB, JSteg, F5, steghide |

The `dcode-extras` official extension adds 409 dCode-style algorithms (math / numerals / text / puzzles / symbols / classical), loaded on demand and not counted in the core total.

## Plugins & AI Access

> The product UI calls this feature "extensions"; this section keeps "plugins" to match the code directory and SDK docs.

The toolbox is driven by a declarative registry: every algorithm is a single `{id, cat, name, params, encode/decode/run, detect}` record, and the UI renders itself. The same contract is open to third parties.

### Plugin SDK

Third parties can write plugins with zero main-project changes: a plugin is a standard ESM module that only sees the host-injected, controlled `ctx` and never imports internal modules. Plugins can register algorithm ops (auto-appearing in the menu, search, and one-shot decoding), add categories, inject localised strings, and use namespace-isolated local storage. Every registration is precisely reclaimed on unload.

- Developer guide: [`src/plugin/README.md`](./src/plugin/README.md)
- Reference plugin (a live template — copy, rename, start): [`src/plugin/examples/hello-cipher/index.js`](./src/plugin/examples/hello-cipher/index.js)
- Official extension package (shipped in releases, **disabled by default**): [`addons/dcode-extras-2026-10/`](./addons/dcode-extras-2026-10/). Enable it from the **Official extensions** section (official.json plus same-origin addons/ directory discovery); it adds no main op count, stays out of the precache, and becomes offline-available after the first online load. Current: Beta hundreds of ops (2026-11 batch); all 988 dCode tools are accounted for.

### For External AI (MCP / Skills)

The toolbox's capability surface can be exposed to MCP-capable AI clients or agents — local processes throughout, zero upload. The single source of truth lives in `src/plugin/mcpBridge.js`, exposing 6 MCP tools (list categories, list ops, op param schema, detect encodings, run an op, one-shot smart decode) and 3 MCP resources (`ebctf://ops` full op list, `ebctf://categories` category overview, `ebctf://guide` solving guide). The in-browser AI panel, the Node stdio server, and the CLI Skill all reuse the same definition.

- MCP server (Claude Desktop et al.): [`mcp/README.md`](./mcp/README.md)
- Skill (Claude Code / CLI agents): [`skills/ebctf-decode/`](./skills/ebctf-decode/)

The AI's only network egress is the optional `aiClient`, which requires your own endpoint + key, connects directly to your site, and is never relayed or logged by the main project. Off by default.

## Contributors

The list below follows the order of the "Authors & Contributors" section of the in-app About page.

**Founder · Author**

- 恒烈 · EternalBlaze — founder · author.

**Authors**

- 小布丁 — author.

**Contributors**

- Enze: proposed the recipe-chain interaction improvement.
- yy2m1a0 — beta tester · one-shot multi-decode scoring optimisation.
- 霍雅 — beta tester · day/night toggle optimisation.
- 0x0off — beta tester · real-challenge algorithm additions.
- 懒羊羊大王 — beta tester · found the fancy-series detection too strict, leading to the lenient matching mode.
- 风之暇想 — beta tester · proposed several modern-cipher additions.
- jluvb — V0.1.2 partial encoding escape fixes.
- smile1110 — proposed ECC and other modern-crypto expansions (the v0.1.6 key-lifecycle and signature expansion direction came from this).
- 拉面: feedback on original-version compatibility for Qianqian Xiuzi, Foyu, and SNOW; Unicode and Twin-Hex whitespace boundaries; Whitespace execution and Malbolge identification issues; proposed the Scytale dual-key form, zero-width stego charset & format expansion, edu and tool-category corrections, and trade-off suggestions for non-standard Brainfuck variants.
- qinling072: proposed adding OutGuess and other image-steganography algorithms.
- cnui6: proposed the Rabbit compatibility fix, enabling CryptoJS interop and passphrase support.
- 二月犬 (Eryuequan): suggested the Ohou (Xianzi) codec, Hakimi ternary cipher and the Zako Whisper (official + Base8 variant).
- 橙子 (Chengzi): proposed multiple Misc logic fixes.
- Tokeii: contributed the redesigned icon and downstream optimizations.
- Jason: proposed adding cryptanalysis tools for Chinese cryptographic standards.
- [星记 (starnotes-xj)](https://github.com/starnotes-xj): reported the hash length-extension parameter issue and proposed a fix ([#9](https://github.com/Henglie/EBCrypto/pull/9)).

## Community

- [Linux.Do](https://linux.do) — this project thinks highly of the LinuxDo community!

## License

The project's own code is licensed under the **Apache License 2.0** — free to use, modify, and redistribute; see the full [`LICENSE`](./LICENSE) in the repository root. Third-party resources remain under their respective licences.

Third-party components (e.g. the vendored abracadabra-cn, the various WASM libraries) each follow their original licences.

## Third-party Resources & Licenses

The project's own code is licensed under Apache License 2.0. Third-party resources used:

### Permissively licensed components

- [noble curves / noble hashes](https://github.com/paulmillr/noble-curves) (MIT © Paul Miller) — elliptic curves and hashes; vendored at `src/core/lib/noble/` (with LICENSE.txt).
- [bwip-js](https://github.com/metafilter/bwip-js) 4.11.4 + [BWIPP](https://github.com/bwipp/postscriptbarcode) 2026-05-28 (dual MIT) — barcode generation.
- [material-color-utilities](https://github.com/material-foundation/material-color-utilities) 0.4.0 (Apache-2.0) — dynamic colour extraction.
- [zxing-wasm](https://github.com/Sec-ant/zxing-wasm) (MIT © 2023 Ze-Zheng Wu; upstream ZXing-C++ is Apache-2.0) — QR / barcode decoding.
- [CodeMirror 6](https://github.com/codemirror/dev) (MIT) — custom-algorithm editor core.
- [KaTeX](https://github.com/KaTeX/KaTeX) 0.16.11 (MIT, fonts OFL) — math formula rendering.
- [wubi-code-data](https://github.com/program-in-chinese/npm-wubi-code-data) 1.0.2 (ISC; the 98 table comes from wubi-lex, MIT) — Wubi 86/98 single-character full codes.
- [Chinese-characters-code-table](https://github.com/yefeijiang/Chinese-characters-code-table) (BSD-2-Clause) — 20,902-character Wubi/Zhengma table (only the Zhengma column is used).
- [zhengma_for_rime](https://github.com/chen32768/zhengma_for_rime) (Apache-2.0) — Zhengma Rime single-character table for extra codes and rare characters.
- [Unicode Unihan 18.0.0](https://www.unicode.org/Public/18.0.0/ucd/Unihan.zip) (Unicode License v3) — Chinese telegraph, four-corner and Cangjie fields.
- [node-ctc](https://github.com/lisposter/node-ctc) (MIT) — Chinese telegraph gap filling and cross-check.
- [hanziDB.csv](https://github.com/ruddfawcett/hanziDB.csv) (MIT; frequency data based on Jun Da's Modern Chinese Character Frequency List) — candidate ordering by frequency.

Full licence texts for the Chinese code tables are in [`src/core/data/README.md`](./src/core/data/README.md).

### Icons · Material Symbols Rounded

- Source: Google [Material Symbols](https://fonts.google.com/icons) (`@material-symbols/svg-400`)
- Licence: **Apache License 2.0** — free for commercial use / modification / redistribution.
- Usage: official SVG paths inlined into `src/ui/icons.js` — zero requests, zero CDN.

### Font · Cheonhyeong Full Font (Jeonjatang)

- Source: Shen Tianheng "Jeonjatang" <http://cheonhyeong.com/index.html>
- Version: Cheonhyeong Full Font V5.0.0 (compiled 2025-09-25)
- Coverage: full Unicode — 150 000+ Han characters plus the symbols and minor scripts defined up to Unicode 17.0.
- Files: `public/fonts/th/th-ctf-subset.woff2` (first-paint subset), `th-p0.woff2` (plane 0 BMP), `th-p1.woff2` (plane 1 SMP), `th-p2.woff2` (plane 2 SIP), `th-p16.woff2` (plane 3+).
- **Licence & usage statement**: clause 6 of the official Cheonhyeong notes states "to protect the copyright of the font (including glyph copyrights of various companies and the compiler's own arrangement) … **do not use commercially**". This project is an open-source, non-commercial CTF learning tool that references the font locally only to display rare characters and makes no commercial use of the font itself, staying within those bounds. The copyright of the font belongs to Shen Tianheng and the original glyph copyright holders; for commercial use, obtain authorisation from the author or substitute a commercially usable font (e.g. Source Han Sans / HanaMin, both SIL OFL).

## Privacy

Zero upload is this tool's signature — precisely: **the program itself never initiates outbound transfers**. Core algorithms never upload your input; the PWA and update checks download site assets only; the local bridge only talks to `127.0.0.1`; external AI connects directly to the endpoint and key you configure yourself, with no relay or logging by the main project.

User-enabled features are explicit exceptions: the opt-in randomness server, and `fetch` / `XMLHttpRequest` / `WebSocket` calls you write inside a custom implementation, are **user-authorised transfers**. You choose the data; they originate from your local browser, and the main project neither relays nor initiates them. Server-deployed backends (MCP / local bridge) must not transfer data on the user's behalf and must not be exposed as public multi-user services.

## Security Notes (2026-10)

- **Runtime surface**: the app itself is pure frontend and does not depend on PHP / Java / Go / Rust; only the MCP stdio server uses Node. Node 26.4.0 is affected by the July 2026 advisory (CVE-2026-58043 / 58044 / 56848: permission-model bypass, HTTP/2 UAF, etc.); the MCP server prints a stderr warning for vulnerable versions. Prefer Node ≥ 26.5.1 (or 24.18.1 / 22.23.2). MCP uses stdio only and does not expose HTTP/2.
- **OpenPGP.js**: upgraded from 5.11.2 to 5.11.3, fixing CVE-2025-47934 (forgery of inline signed/encrypted signed messages, High).
- **JSFuck / JJEncode**: decoding executes input JS via `new Function`. These ops are hidden from the MCP tool surface and excluded from the one-click auto-decode pool (`noAuto`); they remain manually available in the browser UI.
- **Weak RSA parameters**: verification/parameter ops reject e<3 or even e; certificate/CSR parsing warns about e=3 and short moduli. Certificate parsing is structural only — it does not verify signatures or trust chains.
- **7-Zip WASM**: the bundled 7zz 24.09 falls in the CVE-2025-11001 / 11002 range (directory-traversal RCE, fixed in 25.00). This tool only extracts user-selected CTF archives inside a local Emscripten MEMFS and exposes no network service, limiting exposure; upgrading to 7-Zip ≥25.00 is on the follow-up list.
- **eMudhra incident**: in October 2026 several eMudhra intermediate CAs were found to use extremely small ECDSA private scalars (reported as "the private key was 4"); Chrome / Firefox / Apple / Microsoft have blocked them. This project ships no CA trust store and does not reference eMudhra — certificate trust is delegated to the browser/system store, so it is not directly affected.
- **PWA cache**: the revision produced by `tools/gen_sw_assets.mjs` now covers on-demand assets (WASM / KaTeX / locales, etc.) as content hashes, so stale libraries cannot linger behind an unchanged cache name.

## Keywords

> Multilingual search keywords, so users searching in different languages can find this project. Keywords are for search only and are not a statement about the in-app interface language list (see the in-app "Language" page).

| Language | Keywords |
|---|---|
| 简体中文 | CTF 工具箱、CTF 编码工具箱、在线编解码、加解密工具、密码学工具、古典密码、现代密码、一键解码、隐写分析、二维码识别、哈希校验、进制转换、Base64 解码、离线工具、本地优先、零外发 |
| English | CTF toolbox, encoder decoder, cipher identifier, cryptography toolkit, classical ciphers, modern ciphers, one-click decode, steganography analysis, QR code reader, hash calculator, base64 decode, offline tool, local-first, no upload |
| 日本語 | CTF ツール、エンコード・デコード、暗号化・復号、古典暗号、現代暗号、暗号解析、ステガノグラフィ、QR コード読み取り、ハッシュ計算、基数変換、オフライン |
| 한국어 | CTF 도구, 인코딩 디코딩, 암호화 복호화, 고전 암호, 현대 암호, 암호 분석, 스테가노그래피, QR 코드 인식, 해시 계산, 진법 변환, 오프라인 |
| Русский | CTF инструменты, кодирование и декодирование, шифрование и дешифрование, классические шифры, современные шифры, криптоанализ, стеганография, распознавание QR-кодов, хеширование, системы счисления, офлайн |
| Français | boîte à outils CTF, encodage et décodage, chiffrement et déchiffrement, chiffres classiques, chiffres modernes, cryptanalyse, stéganographie, lecture de QR code, calcul de hachage, conversion de base, hors ligne |
| Deutsch | CTF-Werkzeug, Kodierung und Dekodierung, Ver- und Entschlüsselung, klassische Chiffren, moderne Chiffren, Kryptoanalyse, Steganographie, QR-Code lesen, Hash berechnen, Zahlensysteme, offline |
| Español | herramientas CTF, codificación y decodificación, cifrado y descifrado, cifrados clásicos, cifrados modernos, criptoanálisis, esteganografía, lector de códigos QR, cálculo de hash, conversión de base, sin conexión |
