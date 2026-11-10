<p align="center">
  <img src="icons/icon128.svg" alt="Purple Ad Blocker" width="128" height="128">
</p>

<h1 align="center">Purple Ad Blocker</h1>

<p align="center">
  <strong>Professional-grade, privacy-first ad blocker for modern browsers</strong>
</p>

<p align="center">
  <a href="https://github.com/iam169459/ad-blocker/releases"><img src="https://img.shields.io/github/v/release/iam169459/ad-blocker?color=8b5cf6&label=version" alt="Release"></a>
  <a href="https://github.com/iam169459/ad-blocker/blob/main/LICENSE"><img src="https://img.shields.io/github/license/iam169459/ad-blocker?color=8b5cf6" alt="License"></a>
  <a href="https://github.com/iam169459/ad-blocker"><img src="https://img.shields.io/github/stars/iam169459/ad-blocker?color=8b5cf6" alt="Stars"></a>
  <a href="https://github.com/iam169459/ad-blocker/issues"><img src="https://img.shields.io/github/issues/iam169459/ad-blocker?color=8b5cf6" alt="Issues"></a>
  <br>
  <a href="https://developer.chrome.com/docs/extensions/mv3/"><img src="https://img.shields.io/badge/Manifest-V3-blue?logo=googlechrome&logoColor=white" alt="Manifest V3"></a>
  <a href="https://github.com/iam169459/ad-blocker"><img src="https://img.shields.io/badge/Chrome%20%7C%20Edge%20%7C%20Brave%20%7C%20Firefox-4285F4?logo=googlechrome&logoColor=white" alt="Browsers"></a>
  <a href="https://github.com/iam169459/ad-blocker"><img src="https://img.shields.io/badge/Author-purple--dev-8b5cf6" alt="Author"></a>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Architecture](#-architecture)
- [Security](#-security)
- [Privacy](#-privacy)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**Purple Ad Blocker** is a Manifest V3 extension that delivers professional-grade ad and tracker blocking with a focus on privacy, performance, and user control. Built by **purple-dev**, it combines network-level filtering with cosmetic element hiding, an interactive element zapper, and comprehensive statistics — all without collecting any user data.

> **Supported Browsers:** Chrome 88+, Edge 88+, Brave, Firefox 109+ (MV3)

---

## ✨ Features

### Network-Level Protection
| Capability | Description |
|------------|-------------|
| **Declarative Net Request** | Chrome's high-performance MV3 blocking API |
| **100+ Built-in Rules** | Major ad/tracker domains blocked out of the box |
| **5 Filter Lists** | EasyList, EasyPrivacy, Fanboy's Annoyance/Social, uBlock Filters |
| **Auto-Updates** | Daily secure updates from GitHub (hardcoded, user-inaccessible) |

### Visual & Interactive
| Feature | Description |
|---------|-------------|
| **Cosmetic Filtering** | 60+ CSS selectors hide ad containers instantly |
| **Element Zapper** | Click any element to block/hide/inspect (`Alt+Shift+Z`) |
| **Per-Site Control** | Enable/disable protection per domain |
| **Context Menu** | Right-click → Block element, Allow site, Disable on site |

### Customization
| Feature | Description |
|---------|-------------|
| **Custom Rules** | Full ABP syntax: block, allow, redirect, upgrade, cosmetic |
| **Allowlist** | Domain exceptions with one-click "Allow Current Site" |
| **Import/Export** | Full settings backup/restore as JSON |
| **Themes** | Light / Dark / System (CSS variables) |

### Analytics & Privacy
| Feature | Description |
|---------|-------------|
| **Statistics Dashboard** | Total/session/page counts, by type, by domain, 30-day timeline |
| **Request Logging** | Optional detailed blocked request log |
| **Privacy Hardening** | WebRTC leak blocking, fingerprinting protection, CSP report blocking |
| **Zero Telemetry** | No analytics, no tracking, no external connections except filter updates |

---

## 🚀 Installation

### Development (Load Unpacked)
```bash
# 1. Clone the repository
git clone https://github.com/iam169459/ad-blocker.git
cd ad-blocker

# 2. Open browser extensions page
# Chrome:    chrome://extensions
# Edge:      edge://extensions
# Brave:     brave://extensions
# Firefox:   about:debugging#/runtime/this-firefox

# 3. Enable "Developer mode" → "Load unpacked" → Select the project folder
```

### Distribution Package
```bash
# Create installable .zip for Chrome Web Store or manual install
zip -r purple-ad-blocker-v2.0.0.zip . -x "*.git*" "*.DS_Store" "LICENSE"
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt` + `Shift` + `A` | Toggle protection on/off |
| `Alt` + `Shift` + `Z` | Open Element Zapper |
| `Alt` + `Shift` + `S` | Open Settings |

> Customize in `chrome://extensions/shortcuts`

---

## 🏗️ Architecture

```
ad-blocker/
├── manifest.json              # MV3 manifest (permissions, rulesets, commands)
├── background.js              # Service worker (ES modules)
├── content.js / content.css   # Cosmetic filtering + page integration
├── zapper-injected.js         # Element zapper (injected on demand)
│
├── lib/                       # Core managers (ES modules)
│   ├── filter-list-manager.js   # Filter lists + secure GitHub updates
│   ├── statistics-manager.js    # Analytics, request logging, timeline
│   ├── rules-manager.js         # Custom rules, allowlist, DNR sync
│   ├── settings-manager.js      # Settings + per-site configuration
│   └── element-zapper.js        # Zapper activation & coordination
│
├── pages/                     # UI pages
│   ├── popup.html / .js / .css    # Toolbar popup (stats, toggles)
│   ├── options.html / .js / .css  # Full settings (7 tabs)
│   ├── welcome.html               # First-run experience
│   └── utils.js                   # Shared UI utilities
│
├── rules/                     # Declarative Net Request rulesets
│   ├── base.json             # 100+ built-in domains (always on)
│   ├── easylist.json         # EasyList (auto-updated)
│   ├── easyprivacy.json      # EasyPrivacy (auto-updated)
│   ├── custom.json           # User custom rules
│   ├── allowlist.json        # Domain exceptions
│   └── dynamic.json          # Runtime dynamic rules
│
└── icons/                     # SVG icons (16/48/128, enabled + disabled)
```

### Data Flow
```
User browses page
       │
       ▼
┌──────────────────┐     ┌──────────────────┐
│  Declarative Net │────▶│  Statistics Mgr  │──▶ Dashboard
│  Request (Chrome)│     │  (blocked count) │
└──────────────────┘     └──────────────────┘
       │
       ▼
┌──────────────────┐
│  Content Script  │──▶ Cosmetic hiding (CSS)
│  (DOM ready)     │     Element Zapper events
└──────────────────┘
       │
       ▼
┌──────────────────┐     Daily (24h)      ┌──────────────────┐
│ Filter List Mgr  │────────────────────▶│  GitHub Source   │
│ (auto-update)    │  Fallback: Official │  (purple-dev/    │
└──────────────────┘                     │  filter-lists)   │
                                        └──────────────────┘
```

---

## 🔐 Security

### Secure Auto-Update Mechanism
- **Repository**: `purple-dev/filter-lists` (hardcoded at compile time)
- **Transport**: HTTPS with certificate validation
- **Validation**: Content size check, HTML detection, rule parsing verification
- **Fallback**: Official sources (easylist.to, uBlockOrigin) if GitHub unavailable
- **User Exposure**: Zero — URL never appears in UI, storage, or network panel

### Threat Model
| Threat | Mitigation |
|--------|------------|
| Malicious filter list | Content validation, size limits, HTML detection |
| MITM on update | HTTPS pinning via browser, GitHub cert transparency |
| Rule injection | DNR API enforces declarative, static rules |
| Settings tampering | `chrome.storage.local` isolated per extension |
| Cross-site leakage | No cross-origin requests except filter updates |

---

## 🛡️ Privacy

**Purple Ad Blocker follows a strict zero-data policy:**

| Practice | Implementation |
|----------|----------------|
| **No analytics** | No Google Analytics, Mixpanel, or custom telemetry |
| **No tracking** | No user IDs, fingerprints, or session recording |
| **No external calls** | Only filter list updates (GitHub) — user-controllable |
| **Local-only storage** | All settings, rules, stats in `chrome.storage.local` |
| **Open source** | Full source auditable at github.com/iam169459/ad-blocker |

### Optional Privacy Features
- **Block WebRTC** — Prevents local IP leakage during video calls
- **Block Fingerprinting** — Canvas, AudioContext, Battery API protection
- **Block CSP Reports** — Stops violation reports to third parties

---

## 💻 Development

### Prerequisites
- Node.js 18+ (for tooling only — extension runs without build step)
- Chrome/Edge/Brave with Developer mode

### Project Structure
```
# All source files are loaded directly by browser — no bundler required
# ES Modules used in background.js and lib/
```

### Testing Changes
1. Edit source files
2. Reload extension in `chrome://extensions`
3. Test on target sites

### Adding Filter Lists
1. Add list config to `lib/filter-list-manager.js` → `_githubConfig.paths`
2. Place list file in GitHub repo: `purple-dev/filter-lists/lists/<name>.txt`
3. Extension auto-discovers on next update cycle

---

## 🤝 Contributing

Contributions welcome! Please read our guidelines:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** with conventional messages: `feat: add amazing feature`
4. **Push** and open a **Pull Request**

### Code Standards
- ESLint (recommended config in `.eslintrc.json`)
- Prettier formatting
- JSDoc for public APIs
- No external dependencies in runtime code

### Reporting Issues
- Use [GitHub Issues](https://github.com/iam169459/ad-blocker/issues)
- Include browser, version, steps to reproduce
- Attach relevant console logs (Settings → Advanced → View Logs)

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

```
Copyright (c) 2024 purple-dev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🔗 Links

| Resource | Link |
|----------|------|
| **Repository** | [github.com/iam169459/ad-blocker](https://github.com/iam169459/ad-blocker) |
| **Issues** | [Report a Bug](https://github.com/iam169459/ad-blocker/issues) |
| **Author** | [purple-dev](https://github.com/purple-dev) |
| **Filter Lists** | [purple-dev/filter-lists](https://github.com/purple-dev/filter-lists) |

---

<p align="center">
  <strong>Built with ❤️ by <a href="https://github.com/purple-dev">purple-dev</a></strong><br>
  <sub>Professional ad blocking for the modern web</sub>
</p>