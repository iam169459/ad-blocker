# Purple Ad Blocker

> Professional-grade ad blocker for Chrome, Edge, Brave, and Firefox. Created by **purple-dev**.

![Version](https://img.shields.io/badge/version-2.0.0-purple)
![Manifest](https://img.shields.io/badge/manifest-V3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Network Blocking** | 100+ built-in rules + Declarative Net Request API |
| **Filter Lists** | EasyList, EasyPrivacy, Fanboy's Annoyance/Social, uBlock Filters |
| **Auto-Updates** | Secure GitHub-based updates (hardcoded, hidden from users) |
| **Cosmetic Filtering** | 60+ CSS selectors hiding ad elements instantly |
| **Element Zapper** | Click any page element to block/hide/inspect (Alt+Shift+Z) |
| **Custom Rules** | ABP syntax support: block, hide, allow, redirect, upgrade |
| **Allowlist** | Per-domain exceptions with quick "Allow Current Site" |
| **Statistics** | Total/session/page counts, by type, by domain, 30-day timeline |
| **Per-Site Settings** | Different rules for different domains |
| **Privacy Protection** | WebRTC leak blocking, fingerprinting protection, CSP report blocking |
| **Import/Export** | Full settings backup/restore as JSON |
| **Keyboard Shortcuts** | Alt+Shift+A (toggle), Alt+Shift+Z (zapper), Alt+Shift+S (settings) |
| **Context Menu** | Right-click to block element, allow site, disable on site |
| **Theme Support** | Light/Dark/System with CSS variables |

---

## 🚀 Installation

### Development (Load Unpacked)
1. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`)
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → Select the extension folder

### Distribution
```bash
# Create installable zip
zip -r purple-ad-blocker.zip . -x "*.git*" "*.DS_Store"
```
Drag the zip to `chrome://extensions` in developer mode, or upload to Chrome Web Store.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+Shift+A` | Toggle ad blocking on/off |
| `Alt+Shift+Z` | Open Element Zapper |
| `Alt+Shift+S` | Open Settings |

---

## 🔧 Configuration

### Filter Lists (Auto-updated from GitHub)
- **EasyList** — Primary ad blocking
- **EasyPrivacy** — Tracking protection
- **Fanboy's Annoyance** — Social widgets, popups
- **Fanboy's Social** — Social media buttons
- **uBlock Filters** — Optimized for uBlock Origin

> **Security**: Update URLs are hardcoded to `purple-dev/filter-lists` and cannot be viewed or changed by users.

### Custom Rules
Create your own rules in Settings → Custom Rules using AdBlock Plus syntax:
```
||example.com^          # Block domain
||example.com^$script   # Block scripts only
@@||example.com^        # Allow exception
.ad-banner              # Hide element (cosmetic)
||example.com^$redirect=blank.png  # Redirect
```

---

## 📊 Statistics Dashboard

- **Total blocked** — All-time counter
- **By type** — Script, image, stylesheet, XHR, etc.
- **Top domains** — Most blocked domains with one-click allowlist
- **30-day timeline** — Visual chart of daily blocking activity

---

## 🛡️ Privacy Features

- **No data collection** — Everything runs locally
- **No external connections** — Except filter list updates (GitHub)
- **WebRTC blocking** — Prevent IP leaks
- **Fingerprinting protection** — Canvas, audio, battery APIs
- **CSP report blocking** — Stop violation reports

---

## 🏗️ Architecture

```
├── manifest.json          # MV3 manifest
├── background.js          # Service worker (ES modules)
├── content.js/.css        # Cosmetic filtering + zapper
├── zapper-injected.js     # Element zapper (injected on demand)
├── lib/
│   ├── filter-list-manager.js   # Filter lists + secure GitHub updates
│   ├── statistics-manager.js    # Analytics & request logging
│   ├── rules-manager.js         # Custom rules & allowlist
│   ├── settings-manager.js      # Settings + per-site config
│   └── element-zapper.js        # Zapper coordination
├── pages/
│   ├── popup.html/js/css        # Popup UI
│   ├── options.html/js/css      # Full settings (7 tabs)
│   └── welcome.html             # First-run page
├── rules/
│   ├── base.json           # 100+ built-in domains
│   ├── easylist.json       # EasyList (auto-updated)
│   ├── easyprivacy.json    # EasyPrivacy (auto-updated)
│   ├── custom.json         # User custom rules
│   ├── allowlist.json      # Allowlist/exceptions
│   └── dynamic.json        # Dynamic rules
└── icons/                  # SVG icons (16/48/128, enabled + disabled)
```

---

## 🔐 Secure Auto-Update

Filter lists update automatically from a private GitHub repository:
- **Repository**: `purple-dev/filter-lists`
- **Branch**: `main`
- **Paths**: `lists/easylist.txt`, `lists/easyprivacy.txt`, etc.
- **Fallback**: Official sources (easylist.to, uBlockOrigin) if GitHub unavailable
- **Validation**: Content size check, HTML detection

The update URL is compiled into the extension and **never exposed to users**.

---

## 📝 License

MIT License — Created by **purple-dev**

```
Copyright (c) 2024 purple-dev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 🔗 Links

- **GitHub**: [github.com/purple-dev](https://github.com/purple-dev)
- **Issues**: [Report a bug](https://github.com/purple-dev/issues)

---

<p align="center">Built with ❤️ by <strong>purple-dev</strong></p>