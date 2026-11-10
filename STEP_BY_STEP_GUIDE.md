# Step-by-Step Guide - Purple Ad Blocker

**Version:** 2.0.0  
**Platform:** macOS + Google Chrome / Edge / Brave  
**Repository:** https://github.com/iam169459/ad-blocker

---

## Table of Contents

1. [Installation](#1-installation)
2. [Verification](#2-verification)
3. [Features Overview](#3-features-overview)
4. [Configuration](#4-configuration)
5. [Troubleshooting](#5-troubleshooting)
6. [Development](#6-development)
7. [Common Errors & Solutions](#7-common-errors--solutions)

---

## 1. Installation

### Method A: Load Unpacked (Development/Testing)

1. **Open Chrome Extensions Page**
   ```
   chrome://extensions
   ```
   Or: Menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" in top-right corner

3. **Load Extension**
   - Click "Load unpacked" (top-left)
   - Select folder: `/Users/Apple/Documents/chrome ext/ad blocker`
   - Click "Select"

4. **Verify Installation**
   - "Purple Ad Blocker" appears in extension list
   - Purple shield icon appears in toolbar
   - No red error messages

### Method B: Chrome Web Store (When Published)

*Coming soon - extension will be available on Chrome Web Store*

### Method C: Manual .crx Install (Not Recommended)

Chrome no longer supports manual .crx installs outside Web Store.

---

## 2. Verification

### Quick Health Check

After installation, verify these work:

| Check | How to Verify |
|-------|---------------|
| **Extension loaded** | `chrome://extensions` → "Purple Ad Blocker" enabled, no errors |
| **Service worker** | `chrome://extensions` → Details → "Service worker" shows "Active" |
| **Toolbar icon** | Purple shield visible in Chrome toolbar |
| **Popup opens** | Click icon → Dashboard appears with stats |
| **Settings opens** | Click "Settings" in popup → Full settings page |

### Test Ad Blocking

1. Visit a site with ads (e.g., `example.com` with test ads)
2. Open popup → Check "Blocked Total" increases
3. Right-click page → "Block element" → Click an ad → It disappears

---

## 3. Features Overview

### Popup Dashboard (Click Toolbar Icon)

| Section | Function |
|---------|----------|
| **Main Toggle** | Enable/disable all protection |
| **Stats Cards** | Total blocked, session, current page |
| **Filter Lists** | Toggle EasyList, EasyPrivacy on/off |
| **Element Zapper** | Launch visual element blocker |
| **Allowlist** | Manage per-site exceptions |
| **Reset Stats** | Clear all statistics |
| **Settings** | Open full settings page |

### Element Zapper (Alt+Shift+Z)

1. Press `Alt+Shift+Z` on any page
2. Hover elements - they highlight in red
3. Click to **Block** (remove permanently), **Hide** (invisible), or **Inspect** (view selector)
4. Press `ESC` to exit

### Settings Page (7 Tabs)

| Tab | Features |
|-----|----------|
| **General** | Protection toggles, blocking options, theme, auto-update |
| **Filter Lists** | Enable/disable EasyList, EasyPrivacy, view rule counts |
| **Custom Rules** | Add block/allow/redirect/upgrade rules with ABP syntax |
| **Allowlist** | Domains where ads are allowed |
| **Statistics** | Total blocked, by type, top domains, 30-day timeline |
| **Advanced** | WebRTC blocking, fingerprinting, CSP reports, debug logs |
| **About** | Version info, credits, links |

---

## 4. Configuration

### Custom Rules (ABP Syntax)

In Settings → Custom Rules → Add Rule:

| Type | Pattern Example | Description |
|------|----------------|-------------|
| **Block** | `\|\|example.com^` | Block all requests to example.com |
| **Block (script only)** | `\|\|example.com^$script` | Block only scripts from example.com |
| **Allow** | `@@\|\|example.com^` | Allow all requests to example.com |
| **Redirect** | `\|\|example.com^$redirect=blank.png` | Redirect to blank.png |
| **Upgrade** | `\|\|example.com^` + "Upgrade to HTTPS" | Force HTTPS |
| **Cosmetic** | `.ad-banner` | Hide element by CSS selector |

### Per-Site Settings

1. Visit a site
2. Click extension icon → "Settings" → "General" tab
2. Toggle "Enable Ad Blocking" for that site
3. Or: Right-click page → "Disable on this site"

### Filter List Updates

- **Auto-update:** Daily (enabled by default)
- **Manual update:** Settings → General → "Update Now"
- **Sources:** GitHub (`iam169459/ad-blocker`) with fallback to official sources

### Theme

Settings → General → Appearance → Theme:
- **System** (follows OS)
- **Light**
- **Dark**

---

## 5. Troubleshooting

### Extension Won't Load

| Error | Solution |
|-------|----------|
| "Could not load manifest" | Ensure all files present, re-select folder |
| "Service worker registration failed" | Check for syntax errors in background.js |
| "Could not load JavaScript" | Verify all JS files exist and have valid syntax |

### Service Worker Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Status Code 15 | Syntax error in background.js | Run `node -c background.js` |
| "Unexpected token" | TypeScript syntax in .js file | Remove `?`, `??`, type annotations |
| "Cannot find module" | Import path wrong | Check relative paths in imports |

### Popup Doesn't Open

1. Check `chrome://extensions` → Details → "Popup" path is `pages/popup.html`
2. Verify `pages/popup.html` and `pages/popup.js` exist
3. Check console for errors (right-click extension → "Inspect popup")

### Ad Blocking Not Working

| Issue | Check |
|-------|-------|
| Ads still show | Extension enabled? Filter lists enabled? |
| Specific site | Site on allowlist? Per-site setting disabled? |
| Cosmetic filters | "Cosmetic Filtering" enabled in Settings? |
| Element zapper | Press Alt+Shift+Z, click element |

### Statistics Not Updating

1. Settings → Statistics → Check "Log Blocked Requests" is enabled
2. Visit sites with ads
3. Refresh statistics tab

---

## 6. Development

### Project Structure

```
ad-blocker/
├── manifest.json              # MV3 manifest
├── background.js              # Service worker (ES modules)
├── content.js / content.css   # Content script
├── zapper-injected.js         # Element zapper (injected on demand)
├── lib/
│   ├── filter-list-manager.js # Filter list updates
│   ├── statistics-manager.js  # Analytics & logging
│   ├── rules-manager.js       # Custom rules & allowlist
│   ├── settings-manager.js    # Settings + per-site
│   └── element-zapper.js      # Zapper coordination
├── pages/
│   ├── popup.html/js/css      # Toolbar popup
│   ├── options.html/js/css    # Full settings (7 tabs)
│   ├── welcome.html/js        # First-run page
│   └── utils.js               # Shared utilities
├── rules/
│   ├── base.json              # 100 built-in rules
│   ├── easylist.json          # EasyList (auto-updated)
│   ├── easyprivacy.json       # EasyPrivacy (auto-updated)
│   ├── custom.json            # User custom rules
│   ├── allowlist.json         # Allowlist exceptions
│   └── dynamic.json           # Runtime dynamic rules
└── icons/                     # SVG icons (6 files)
```

### Making Changes

1. Edit source files
2. Reload extension: `chrome://extensions` → Refresh icon
3. Test changes

### Adding Filter Lists

1. Add list config to `lib/filter-list-manager.js` → `_githubConfig.paths`
2. Place list file in GitHub repo: `iam169459/ad-blocker/lists/<name>.txt`
3. Extension auto-discovers on next update cycle

### Debugging

- **Background script:** `chrome://extensions` → Details → "Inspect views: Service worker"
- **Popup:** Right-click extension icon → "Inspect popup"
- **Content script:** DevTools on any page → Console
- **Storage:** Application tab → Local Storage → chrome-extension://<id>

---

## 7. Common Errors & Solutions

| Error Message | File | Solution |
|--------------|------|----------|
| `Service worker registration failed. Status code: 15` | background.js | Syntax error - run `node -c background.js` |
| `Uncaught SyntaxError: Unexpected token '?'` | background.js | Remove TypeScript `?` optional params |
| `Could not load JavaScript 'content-zapper.js'` | manifest.json | Remove missing file from content_scripts |
| `Could not load manifest` | manifest.json | JSON syntax error - validate with `node -c` |
| `chrome.runtime.sendMessage` returns undefined | background.js | Add `return true` in onMessage listener |
| `Cannot read property 'id' of undefined` | content.js | Check `sender.tab` exists before using |
| `declarativeNetRequest.updateDynamicRules` fails | rules-manager.js | Rule ID conflicts - check base IDs |
| Filter lists not updating | filter-list-manager.js | Check GitHub config, network, CORS |
| Element zapper not activating | element-zapper.js | Check `chrome.scripting` permission |
| Settings not saving | settings-manager.js | Check `storage` permission |

---

## Support

- **Issues:** https://github.com/iam169459/ad-blocker/issues
- **Author:** purple-dev
- **License:** MIT

---

## Quick Reference

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Alt+Shift+A` | Toggle protection |
| `Alt+Shift+Z` | Element Zapper |
| `Alt+Shift+S` | Open Settings |

### File Validation Commands
```bash
# Check all JS syntax
node -c background.js content.js zapper-injected.js lib/*.js pages/*.js

# Validate manifest
node -e "JSON.parse(require('fs').readFileSync('manifest.json'))"

# Check all paths exist
node -e "
const fs=require('fs'),m=JSON.parse(fs.readFileSync('manifest.json'));
[...m.content_scripts.flatMap(c=>[...c.js,...c.css]),m.background.service_worker,m.action.default_popup,m.options_ui.page,...Object.values(m.icons),...m.web_accessible_resources.flatMap(r=>r.resources),...m.declarative_net_request.rule_resources.map(r=>r.path)].forEach(p=>{if(!fs.existsSync(p))console.log('MISSING:',p);});
"
```

---

*Built with ❤️ by purple-dev*