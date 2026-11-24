<p align="center">
  <b>简体中文</b> · <a href="./README_EN.md">English</a>
</p>

<p align="center">
  <img src="./public/icons/logo.png" width="120" height="120" alt="码小妹 · EBCrypto" />
</p>
<h1 align="center">
  <span>码小妹 · EBCrypto</span>
</h1>
<p align="center">
  <span align="center">本地优先、零外发的编解码 / 加解密 / 隐写分析工具箱：一千多种注册操作覆盖 23 类能力，绝大多数在浏览器本地运行，Windows 另可启用本地桥能力，macOS / Linux 提供双击启动器。</span>
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
> 本工具仅供 CTF 学习、竞赛与安全研究使用。请勿将其用于任何违法违规、侵犯他人权益或可能给你自己带来麻烦的用途。使用者需自行承担因不当使用产生的一切后果。
> 如果你在使用中发现 Bug、算法结果异常或文档缺失，欢迎提交 Issue，最好附上输入样例、期望输出和复现步骤。

## 目录

- [快速下载](#快速下载)　　　　[更新日志](#更新日志)
- [项目简介](#项目简介)　　　　[特点](#特点)
- [界面预览](#界面预览)　　　　[运行](#运行)
- [平台兼容性](#平台兼容性)　　[性能要求](#性能要求)
- [目录结构](#目录结构)　　　　[能力总览](#能力总览)
- [插件与 AI 接入](#插件与-ai-接入)　[开源协议](#开源协议)
- [第三方资源与许可](#第三方资源与许可)　[隐私](#隐私)
- [关键词 / Keywords](#关键词--keywords)

## 快速下载

> 核心处理本地运行、零外发。下载解压后按平台双击 `Start-Windows.exe`、`Start-macOS.command` 或 `Start-Linux.sh`。原生静态服务无需 Python；CLI / MCP 仍需 Node.js，Python 工具功能另需本机 Python。也可使用 `GenericStart.py`（需 Python 3）。

| 网盘 | 链接 | 提取码 |
|---|---|---|
| 百度网盘 | https://pan.baidu.com/s/1Uqq_ONMBG9qA0dJvUG53Og?pwd=0000 | 0000 |
| 夸克网盘 | https://pan.quark.cn/s/3b7e573b19c0 | 无 |

当前版本 **v0.2.0-beta**。源码始终以 GitHub 仓库为准：[github.com/Henglie/EBCrypto](https://github.com/Henglie/EBCrypto)。

## 更新日志

**v0.2.0-beta（2026-11-11）**：统一资源阈值（软确认 / 硬上限 / 取消 / 重试），MCP 结构化错误与 128KB 内联阈值，本机环境工具管理页，启动器内置 HTTP MCP，ZIP / 7z / TAR 统一阈值，单文件窗口发行准备中。

完整历史见 [CHANGELOG.md](./CHANGELOG.md)。

## 项目简介

**码小妹（EBCrypto）的北极星**：从 CTF 编解码转向通用密码学工具箱——既让初学者看懂每个算法，也让专业工作者拿它做日常加解密、编解码与标准合规核对。坚持超级跨平台（Windows / macOS / 主流 Linux / 国产信创 Linux / 鸿蒙与开源鸿蒙），纯前端、零外发、不引入平台绑定依赖。每一份算法实现都要能被人直接摘出来当权威源：零 UI 依赖、纯函数、注释写清标准编号＋版本＋权威实现出处、过官方测试向量、按标准要求补齐功能。

0.2.0 仍在开发中。新独立窗口单文件发行、鸿蒙原生版及后续算法资料工作按各自进度推进；双语离线手册正在制作，尚未提供完整成书。仓库地址迁移另行进行，当前链接仍使用现有仓库。

`码小妹`（英文名与仓库名 `EBCrypto`，旧名「恒烈 CTF 编码工具箱」/ EBCTFCodeBox）是一个以 CTF 场景为入口、面向通用编解码与密码学需求的本地优先工具箱。

它把编码、古典密码、现代加密、哈希校验、进制转换、密码分析爆破、隐写图像等能力汇聚到一个页面里。核心计算在浏览器本地完成，不上传用户输入；Windows 可选启用本地桥。目标是兼顾赛场解题、密码学学习与日常工具需求。

核心设计：

- 原生 ES module，无框架、无构建步骤
- C / emscripten 编译的 WASM 承担高性能算法
- Material 3 温和红主题，暗 / 亮色切换
- 内置天珩全字库，冷僻字符照样显示
- 20 种语言

---

## 特点

- **本地优先 · 零外发**：原生 ES module，无框架、无构建步骤。核心编解码在浏览器本地执行，不上传用户输入；「外链」只生成 URL。PWA 更新仅下载本站资源，本地桥只访问 `127.0.0.1`，外部 AI 仅在用户主动配置 endpoint 后启用。
- **一把梭智能解码**：粘贴或拖入内容，自动识别可能的编码链并给出候选解码结果，支持 crib 目标特征过滤与深度爆破。
- **一千多种注册操作 · 23 分类**：覆盖 Base、文本传输、花式 CTF、深奥编程语言、中文本土、古典密码、现代加密（分组 / 流 / 非对称 / 其他）、哈希校验、进制字符集（含素数判定与筛选）、分析爆破、密码攻击、压缩归档、口令与归档破解、取证流量、文件格式结构、数据结构、图像与二维码、音频音视频、隐写及 3 个可选 Windows GUI 桥入口。完整清单由 registry 自动生成；另有 数百个操作通过官方扩展包按需加载。
- **解码强度四件套**（v0.1.2）：强度档位 + 自定义算法池 + **暴力爆破独立通道**（XOR/凯撒/字典/彩虹表/HMAC/PBE/Playfair/ZIP/CRC32/bkcrack，结果单独归组展示不污染主排序）+ **解析层数 1~3 选择**。
- **宽松判定模式**（v0.1.2）：增强/极强/最强/自定义档只按字符种类数放行算法，变体编码题（「喵呜」表 0/1、emoji 表二进制）也能参与解码；默认/快速档保持严格定义域识别。
- **密钥+密文一键尝试**：给定密文与密钥，自动枚举 AES/DES/3DES/RC4/XOR/Fernet × 多种模式 × 多种编码组合。
- **文件拖入分析**：拖入文件自动检测类型、附加数据、图像宽高异常等。
- **全 Unicode 显示**：内置天珩全字库，按 Unicode 平面按需加载，生僻字、古文字、Emoji 均可正常显示。
- **科普卡算法互链**：科普正文提到本工具已有的算法时，自动链到对应 op 页（新标签页打开）；只认高置信名称/别名，跳过书名、代码、公式与泛词。
- **Material 3 温和红主题**，暗/亮色切换，20 种语言。

> 想看完整的功能介绍与场景演示，见 [`docs/introduction.md`](./docs/introduction.md)。

## 界面预览

<p align="center">
  <img src="docs/images/one-click-decode.png" alt="一把梭 · 智能解码" width="80%" />
</p>

<p align="center"><i>一把梭 · 智能解码：粘进去自动识别编码链并给出候选结果</i></p>

<p align="center">
  <img src="docs/images/file-parse-demo.gif" alt="文件解析演示" width="80%" />
</p>

<p align="center"><i>拖入文件自动识别类型 + 剥离附加数据</i></p>

<p align="center">
  <img src="docs/images/recipe-chain-demo.gif" alt="配方链演示" width="80%" />
</p>

<p align="center"><i>配方链：把多个算法串成一条可视化流水线</i></p>

<table>
  <tr>
    <td><img src="docs/images/code-image-gallery.png" alt="图形编码图鉴" /></td>
    <td><img src="docs/images/edu-card-demo.png" alt="密码学教学科普卡" /></td>
  </tr>
  <tr>
    <td align="center"><i>图形编码图鉴 · 253 张对照表</i></td>
    <td align="center"><i>每个算法附带 edu 科普卡</i></td>
  </tr>
  <tr>
    <td><img src="docs/images/about-light.png" alt="亮色主题" /></td>
    <td><img src="docs/images/about-dark.png" alt="暗色主题" /></td>
  </tr>
  <tr>
    <td align="center"><i>亮色主题</i></td>
    <td align="center"><i>暗色主题（Material 3 昼夜切换）</i></td>
  </tr>
</table>

## 运行

纯静态，任意静态服务器即可。推荐用附带脚本（双击或命令行）：

```bash
py GenericStart.py     # Windows（用 py，不用 python3）
python3 GenericStart.py # macOS / Linux
```

脚本会同时起静态服务器 + 本地桥（bridge.py，固定 8181，仅 Windows 有实际能力），并用系统默认浏览器打开。桥在同进程后台线程内运行，不弹第二个窗口。

### Linux / macOS 双击启动

与 Windows 的「双击 exe 启动」对等。根目录只放**双击入口**，二进制内核收在 `bin/` 子目录（避免误点）：

| 文件 | 平台 | 用法 |
|---|---|---|
| `Start-Windows.exe` | Windows | **双击**即可（32 位单文件，兼容 64 位与 ARM64 Windows） |
| `Start-macOS.command` | macOS | Finder 里**双击**它 → 自动打开「终端」并进入控制面板 |
| `Start-Linux.sh` | Linux | KDE（Dolphin）直接**双击**；GNOME（Nautilus）右键 → 运行（或属性里勾选「允许作为程序执行」后双击） |
| `bin/launcher-macos` | macOS | universal2 单文件（Apple Silicon + Intel 双架构），由上面的 .command 调起，无需直接点击 |
| `bin/launcher-linux` | Linux | x86_64 ELF，由上面的 .sh 调起，无需直接点击 |

- macOS 用 `.command` 是因为 Finder 双击裸二进制不会打开终端；Linux 各桌面对裸二进制双击行为不一致，`.sh` + 可执行位是通用做法。
- **首次使用**：解压后双击无反应先赋一次执行权限（`chmod +x Start-macOS.command bin/launcher-macos Start-Linux.sh bin/launcher-linux`）；启动器未签名，macOS 首开被 Gatekeeper 拦时在「系统设置 → 隐私与安全性」点「仍要打开」或右键 → 打开。
- **功能与 Windows 一致**：同一套 C 源码，控制面板同为 1 重启服务 / 2 清除占用端口 / 3 本地桥设置 / 4 打开浏览器 / 5 刷新状态 / 0 退出（Linux/macOS 为键盘行式菜单，无鼠标点击与悬停高亮，属终端能力差异）；本地桥、MCP、pyc 反编、环境探测全可用。Windows 专属的 GUI 工具拉起与系统强调色在这两个平台自动降级提示。两份产物已过静态验收（架构/链接依赖/分支指纹/端点串），真机运行验收持续进行。

或直接用任意静态服务器指向项目根目录。首版无需 build，改完刷新即生效。

### 无 Python 部署

本项目是纯静态资源，任意 HTTP 服务器均可托管（ES module 要求 http(s) 环境，不能直接双击 `index.html` 用 file:// 打开）。无 Python 或不想用启动脚本时，任选其一：

```bash
npx serve .                    # Node.js（任选端口）
python3 -m http.server 8180    # 已装 Python 3 但不想用启动脚本
php -S localhost:8180          # PHP 内置服务器
```

nginx / Apache / Caddy 等正式 Web 服务器同样可用，需注意两点：

1. `.wasm` 必须以 `application/wasm` MIME 送出，否则浏览器拒收流式编译。
2. 多线程 WASM（如 bkcrack 的 pthread 产物）依赖 `SharedArrayBuffer`，要求下发跨源隔离头：

   ```
   Cross-Origin-Opener-Policy: same-origin
   Cross-Origin-Embedder-Policy: require-corp
   ```

   附带的 `GenericStart.py` 已默认下发这两个头；自建服务器需自行配置。缺失这两个头时，多线程 WASM op 会优雅降级或提示不可用，纯前端功能不受影响。

PWA 已接线（`manifest.json` + `sw.js`）：当前预缓存清单含 990 项核心运行资源（随版本变化，更新时按校验和增量下载），完成缓存安装后支持核心功能离线使用；大体积按需资产（天珩字库四平面、WASM、IDS 拼字数据、编码对照图、KaTeX）需先在线加载或安装对应离线包。顶栏“检查更新”目前打开版本页面；Service Worker 的版本激活与跨浏览器离线升级仍持续验证。

## 平台兼容性

| 平台 | 前端功能 | 本地桥（exe 工具） | 启动方式 |
|---|---|---|---|
| Windows | 全功能（主平台） | JPHS / OpenPuff / OurSecret（GUI 启动）+ pyc/exe 本地反编 + 系统强调色同步 | `py GenericStart.py` |
| macOS | 全功能 | 不可用（无 .exe），桥自动跳过，相关 op 灰置提示 | 双击 `Start-macOS.command`，或 `python3 GenericStart.py` |
| Linux | 全功能 | 同 macOS，桥自动跳过 | 双击 `Start-Linux.sh`，或 `python3 GenericStart.py` |
| ChromeOS | 全功能（经 Crostini Linux 容器） | 同 Linux | `python3 GenericStart.py`（Crostini 内） |
| 鸿蒙 / Android / iOS | 全功能（PWA，触屏响应式） | 不可用（移动端无法运行 exe） | 浏览器打开部署地址，可选「添加到主屏幕」 |

说明：
- 「本地桥」指 `bridge.py`（端口 8181，仅 Windows）提供 GUI 启动、pyc/exe 反编与系统强调色等本机能力。桥不可用时，浏览器本地能力仍正常，依赖桥的入口会降级提示。
- 移动端 / 鸿蒙经 PWA 安装后可离线使用；字库 / WASM / 图鉴等大资产按需缓存，首次使用时在线加载一次。
- 桥只监听 `127.0.0.1`，绝不外发，恪守零外发红线。

### 浏览器要求

需支持 ES module、WebAssembly、Web Workers、Service Worker、Web Crypto API、DecompressionStream 的现代浏览器：

- Chrome / Edge 90+
- Firefox 113+
- Safari 16.4+

## 性能要求

本项目核心为纯前端应用，常规计算在浏览器本地完成，无服务端算力依赖；少数 Windows 本地桥能力另行注明。以下为各维度的要求与建议：

| 维度 | 最低 | 建议 | 说明 |
|---|---|---|---|
| CPU | 单核 | 4 核+ | Web Worker 池线程数 = `min(8, navigator.hardwareConcurrency)`，多核可加速爆破 / 大文件分片运算 |
| 内存 | 512 MB | 1 GB+ | 天珩全字库与 WASM 按需加载，大文件分析视文件大小线性增长 |
| GPU | 不需要 | 启用硬件加速即可 | 无 GPU 计算，浏览器合成层走 GPU 加速可改善滚动 / 动画流畅度 |
| 磁盘 | 预留 100 MB+ | 同左 | 代码、字库、WASM 与图鉴会随版本增长，以实际发行包为准 |
| 网络 | 首次加载需连接 | 稳定连接 | 不上传用户输入；PWA 安装后核心功能可离线 |
| OS 位数 | 32 位可用 | 64 位 | 64 位浏览器可寻址更大内存，利于大文件分析 |
| 架构 | x86 / x64 / ARM 均可 | 同左 | 浏览器抽象底层架构，WASM 跨架构运行 |

WASM 多线程（`SharedArrayBuffer`）需跨源隔离头（COOP/COEP），`GenericStart.py` 已默认下发；缺失时多线程 op 降级为单线程或提示不可用，不影响其余功能。首屏使用 HTTP/1.1 keep-alive、ES module 入口前置和字库懒加载；完整离线资源由 Service Worker 在页面加载后后台安装。

## 目录结构

开发、分支协作与 PR 流程见 [CONTRIBUTING.md](./CONTRIBUTING.md)：日常开发集成到 `dev`，稳定发布从 `main` 产生。

```
index.html          入口
src/
  main.js           UI 驱动（注册表声明式渲染）
  core/             算法层（纯函数，每个模块自注册进 registry）
  ui/               样式 + 图标 + 字体加载
  i18n/             20 种语言文案（中英静态主表 + 18 动态分片，含 RTL 与四门民族语言）
public/
  icons/            Material Symbols Rounded 图标（SVG）
  fonts/th/         天珩首屏子集 + 4 平面 WOFF2
资料/              算法码表核对资料 + 研究成果（开发资料，不随发行包分发）
```

## 能力总览

> 逐条算法清单在应用内「全部算法」页与离线手册中维护，README 不再重复罗列。

| 能力组 | 操作数 | 代表能力 |
|---|---:|---|
| Base / 文本 / 进制 / 字符集 | 192 | Base 家族、URL/HTML 编码、任意进制、字符集转换 |
| 花式 / CTF / 深奥语言 / 中文本土 | 120 | 佛曰、熊曰、社会主义核心价值观、Brainfuck、中文电码 |
| 古典密码 | 76 | 维吉尼亚、栅栏、Playfair、Enigma |
| 现代密码（分组 / 流 / 非对称 / 其他） | 214 | AES、SM4、ChaCha20、RSA、SM2、SM9、NTRU |
| 哈希 / 校验 | 82 | MD5 / SHA 家族、SM3、CRC、HMAC |
| 分析 / 爆破 / 密码攻击 | 83 | 频率分析、RSA 攻击、SM2 / SM9 攻击、字典爆破 |
| 压缩 / 归档 / 口令破解 | 34 | ZIP / 7z、office2john、hashcat 联动 |
| 取证 / 文件格式 / 数据结构 | 78 | pcap、PE / ELF、Protobuf、NBT |
| 图像 / 二维码 / 音频 | 46 | 二维码、盲水印、GIF 时序、频谱图 |
| 隐写（文本 / 文件） | 45 | 零宽度、LSB、JSteg、F5、steghide |

官方扩展包 `dcode-extras` 另有 409 个 dCode 风格算法（数学 / 记数 / 文本 / 谜题 / 符号 / 古典），按需加载、不计入主库。

## 插件与 AI 接入

> 产品内统一称「扩展」，本节标题沿用「插件」以对应代码目录与 SDK 文档。

工具箱是声明式注册表驱动的：每个算法就是一条 `{id, cat, name, params, encode/decode/run, detect}` 记录，UI 全自动渲染。这套契约同样对第三方开放。

### 插件 SDK

第三方可零主项目改动写插件：一个插件 = 一个标准 ESM 模块，只面对宿主注入的受控 `ctx`，不 import 主项目内部模块。插件能注册算法 op（自动进菜单、搜索、一键解码）、新增分类、注入多语言文案、用命名空间隔离的本地存储。所有注册动作在卸载时精确回收。

- 开发指南：[`src/plugin/README.md`](./src/plugin/README.md)
- 参考插件（活样板，照抄改名即起步）：[`src/plugin/examples/hello-cipher/index.js`](./src/plugin/examples/hello-cipher/index.js)
- 官方扩展包（随发行包分发、**默认不启用**）：[`addons/dcode-extras-2026-10/`](./addons/dcode-extras-2026-10/)。在扩展面板「官方扩展」区直接点击启用（自动读取 official.json，同源 addons/ 目录发现兜底）；不进主 op 计数、不进预缓存，首次在线加载后离线可用。当前 Beta 数百 op（2026-11 批次），988 个 dCode 工具已逐条入账。

### 给外部 AI 用（MCP / Skills）

工具箱的能力面可暴露给支持 MCP 的 AI 客户端或 Agent，全程本地进程、零外发。能力面单一事实源在 `src/plugin/mcpBridge.js`，对外提供 6 个 MCP 工具（列分类、列 op、查 op 参数 schema、智能识别编码、跑指定 op、一键智能解码）与 3 个 MCP 资源（`ebctf://ops` 全量 op 清单、`ebctf://categories` 分类概览、`ebctf://guide` 解题引导）。浏览器内 AI 面板、Node stdio server、CLI Skill 三端复用同一份定义。

- MCP server（Claude Desktop 等接入）：[`mcp/README.md`](./mcp/README.md)
- Skill（Claude Code / CLI Agent）：[`skills/ebctf-decode/`](./skills/ebctf-decode/)

AI 的联网出口只有可选的 `aiClient`，且必须用户自备 endpoint + key，直连用户站点，主项目不中转、不记录。默认关闭。

## 贡献者

以下名单按工具箱「关于」页的「作者与贡献者」顺序列出。

**创始人 · 作者**

- 恒烈 · EternalBlaze — 创始人 · 作者。

**作者**

- 小布丁 — 共同作者。

**贡献者**

- Enze：提出配方链交互优化方案。
- yy2m1a0 — 内测员 · 一键多重解码评分算法优化。
- 霍雅 — 内测员 · 昼夜切换优化。
- 0x0off — 内测员 · 真题算法补充建议。
- 懒羊羊大王 — 内测员 · 发现 fancy 系列算法判定过于严谨，促成宽松判定模式。
- 风之暇想 — 内测员 · 新增多种现代加密算法提议。
- jluvb — V0.1.2 部分编码转义错误纠正。
- smile1110 — 提出 ECC 等现代密码算法扩充提议（v0.1.6 密钥生命周期与签名扩充方向即由此推进）。
- 拉面：反馈千千秀字、佛曰、SNOW 的原版兼容性，Unicode 与 Twin-Hex 空白边界，以及 Whitespace 执行、Malbolge 识别问题；提出 Scytale 双密钥形式、零宽隐写字符集与格式扩充、科普和工具分类纠正、Brainfuck 非标准变体功能取舍建议。
- qinling072：提出补充 OutGuess 等图像隐写算法。
- cnui6：提出 Rabbit 兼容性修复，促成 CryptoJS 生态互解与口令支持。
- 二月犬：提出补充哦齁编码（仙子曰）、哈基米加密（三进制）与杂鱼密语（官方版及 Base8 变体）。
- 橙子：提出多个 Misc 逻辑代码修复。
- Tokeii：贡献改版图标，项目下游优化作者。
- Jason：提出增加国密攻击工具。
- [星记 (starnotes-xj)](https://github.com/starnotes-xj)：反馈哈希长度扩展的长度参数问题并提交修正建议（[#9](https://github.com/Henglie/EBCrypto/pull/9)）。

## Community

- [Linux.Do](https://linux.do) — 本项目非常认可 LinuxDo 社区！

## 开源协议

本项目自有代码采用 **Apache License 2.0**，可自由使用、修改与再分发，详见根目录 [`LICENSE`](./LICENSE) 全文。第三方资源按各自许可证使用。

第三方组件（如 vendored 的 abracadabra-cn、各 WASM 库等）各自遵循其原始许可证。

## 第三方资源与许可

本项目自身代码依 Apache License 2.0 授权。使用的第三方资源如下：

### 宽松许可组件

- [noble curves / noble hashes](https://github.com/paulmillr/noble-curves)（MIT © Paul Miller）— 椭圆曲线与哈希，随包 `src/core/lib/noble/`（含 LICENSE.txt）。
- [bwip-js](https://github.com/metafilter/bwip-js) 4.11.4 + [BWIPP](https://github.com/bwipp/postscriptbarcode) 2026-05-28（双 MIT）— 条形码生成。
- [material-color-utilities](https://github.com/material-foundation/material-color-utilities) 0.4.0（Apache-2.0）— 动态取色。
- [zxing-wasm](https://github.com/Sec-ant/zxing-wasm)（MIT © 2023 Ze-Zheng Wu；上游 ZXing-C++ 为 Apache-2.0）— 二维码/条码解码。
- [CodeMirror 6](https://github.com/codemirror/dev)（MIT）— 自定义算法编辑器内核。
- [KaTeX](https://github.com/KaTeX/KaTeX) 0.16.11（MIT，字体 OFL）— 数学公式渲染。
- [wubi-code-data](https://github.com/program-in-chinese/npm-wubi-code-data) 1.0.2（ISC；98 表上游 wubi-lex，MIT）— 五笔 86/98 单字全码。
- [Chinese-characters-code-table](https://github.com/yefeijiang/Chinese-characters-code-table)（BSD-2-Clause）— 20,902 字五笔/郑码字表（本工具只用郑码列）。
- [zhengma_for_rime](https://github.com/chen32768/zhengma_for_rime)（Apache-2.0）— 郑码 Rime 单字表，用于补全多码与生僻字。
- [Unicode Unihan 18.0.0](https://www.unicode.org/Public/18.0.0/ucd/Unihan.zip)（Unicode License v3）— 中文电码、四角号码、仓颉码字段。
- [node-ctc](https://github.com/lisposter/node-ctc)（MIT）— 中文电码补缺与交叉核对。
- [hanziDB.csv](https://github.com/ruddfawcett/hanziDB.csv)（MIT；字频源自 Jun Da 现代汉语字频表）— 同码候选的词频排序。

以上汉字码表的完整许可文本见 [`src/core/data/README.md`](./src/core/data/README.md)。

### 图标 · Material Symbols Rounded

- 来源：Google [Material Symbols](https://fonts.google.com/icons)（`@material-symbols/svg-400`）
- 许可：**Apache License 2.0**，可自由商用 / 修改 / 再分发。
- 用法：官方 SVG path 内联进 `src/ui/icons.js`，零请求、零 CDN。

### 字体 · 天珩全字库（全字堂）

- 来源：沈天珩「全字堂」 <http://cheonhyeong.com/index.html>
- 版本：天珩全字库 V5.0.0（编译日期 2025-09-25）
- 覆盖：全 Unicode，支持 15 万余汉字及 Unicode 17.0 所定义的各类符号、小语种等。
- 文件：`public/fonts/th/th-ctf-subset.woff2`（首屏子集）、`th-p0.woff2`（平面 0 BMP）、`th-p1.woff2`（平面 1 SMP）、`th-p2.woff2`（平面 2 SIP）、`th-p16.woff2`（平面 3+）。
- **许可与使用声明**：天珩官方说明第六条载明「为保护字库之版权（包括各大公司的字形版权和本人的整理制作）……**请勿用于商业用途**」。本项目为开源、非商业的 CTF 学习工具，仅在本地引用天珩字库用于显示生僻字符，不对字库本身做任何商业利用，符合上述使用边界。天珩字库的版权归沈天珩及相关字形原始版权方所有；如需商用请联系原作者获取授权，或替换为可商用字体（如思源黑体 / 花园明朝 HanaMin，均为 SIL OFL 许可）。

## 隐私

零外发是本工具的招牌，准确含义是**程序自身不主动外发**：核心算法默认不上传用户输入；PWA 与检查更新只下载本站资源；本地桥只访问 `127.0.0.1`；外部 AI 仅在用户主动配置 endpoint 与密钥后直连该地址，主项目不做中转或记录。

用户显式启用的「随机数服务器」、以及在「自定义实现」里自行编写的 `fetch` / `XMLHttpRequest` / `WebSocket` 等网络调用，属于**用户授权外发**：数据由用户决定，全部在本机浏览器里发出，主项目不代发、不中转。部署到服务器上的后端（MCP / 本地桥）不代用户外发，也不应作为公网多用户服务暴露。

## 安全说明（2026-10）

- **运行时面**：本体是纯前端，不依赖 PHP / Java / Go / Rust；MCP stdio 服务器用 Node。Node 26.4.0 命中 2026-07 安全公告（CVE-2026-58043 / 58044 / 56848：权限模型越权、HTTP/2 UAF 等），MCP 启动时对受影响版本在 stderr 提示；建议 Node ≥ 26.5.1（或 24.18.1 / 22.23.2）。MCP 只走 stdio，不监听 HTTP/2。
- **OpenPGP.js**：已从 5.11.2 升级到 5.11.3，修复 CVE-2025-47934（内联签名/加密签名可伪造，High）。
- **JSFuck / JJEncode**：解码会用 `new Function` 执行输入里的 JS。已从 MCP 工具面隐藏，并从一键解码自动池排除（`noAuto`）；仍可在浏览器 UI 手动运行。
- **RSA 弱参数**：验签/参数计算统一拒绝 e<3 或偶数 e；证书/CSR 解析对 e=3、小模数给出警告。证书解析只做结构展示，不验证签名/信任链。
- **7-Zip WASM**：随包 7zz 24.09 在 CVE-2025-11001 / 11002（目录穿越 RCE，修复 25.00）版本范围内；本工具只在本地 Emscripten MEMFS 解压用户主动选择的 CTF 文件，不暴露网络服务，风险受限；升级到 7-Zip ≥25.00 已列入后续项。
- **eMudhra 事件**：2026-10 印度 CA eMudhra 的中间 CA 使用极小 ECDSA 私钥标量（媒体称“私钥为 4”），Chrome / Firefox / Apple / Microsoft 已阻断。本项目不内置 CA 信任库、不引用 eMudhra，证书验证交给浏览器/系统信任库，不受该事件直接影响。
- **PWA 缓存**：`tools/gen_sw_assets.mjs` 的 revision 现已覆盖按需资产（WASM / KaTeX / 语言包等）内容哈希，旧库不会因缓存名不变而长期滞留。

## 关键词 / Keywords

> 以下为多语言检索关键词，方便不同语言的用户搜到本项目。关键词仅用于检索，不代表界面语言清单（界面语言以应用内「语言」页为准）。

| 语言 | 关键词 |
|---|---|
| 简体中文 | CTF 工具箱、CTF 编码工具箱、在线编解码、加解密工具、密码学工具、古典密码、现代密码、一键解码、隐写分析、二维码识别、哈希校验、进制转换、Base64 解码、离线工具、本地优先、零外发 |
| English | CTF toolbox, encoder decoder, cipher identifier, cryptography toolkit, classical ciphers, modern ciphers, one-click decode, steganography analysis, QR code reader, hash calculator, base64 decode, offline tool, local-first, no upload |
| 日本語 | CTF ツール、エンコード・デコード、暗号化・復号、古典暗号、現代暗号、暗号解析、ステガノグラフィ、QR コード読み取り、ハッシュ計算、基数変換、オフライン |
| 한국어 | CTF 도구, 인코딩 디코딩, 암호화 복호화, 고전 암호, 현대 암호, 암호 분석, 스테가노그래피, QR 코드 인식, 해시 계산, 진법 변환, 오프라인 |
| Русский | CTF инструменты, кодирование и декодирование, шифрование и дешифрование, классические шифры, современные шифры, криптоанализ, стеганография, распознавание QR-кодов, хеширование, системы счисления, офлайн |
| Français | boîte à outils CTF, encodage et décodage, chiffrement et déchiffrement, chiffres classiques, chiffres modernes, cryptanalyse, stéganographie, lecture de QR code, calcul de hachage, conversion de base, hors ligne |
| Deutsch | CTF-Werkzeug, Kodierung und Dekodierung, Ver- und Entschlüsselung, klassische Chiffren, moderne Chiffren, Kryptoanalyse, Steganographie, QR-Code lesen, Hash berechnen, Zahlensysteme, offline |
| Español | herramientas CTF, codificación y decodificación, cifrado y descifrado, cifrados clásicos, cifrados modernos, criptoanálisis, esteganografía, lector de códigos QR, cálculo de hash, conversión de base, sin conexión |
