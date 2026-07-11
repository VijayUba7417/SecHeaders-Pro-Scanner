# 🎯 SecHeaders Pro Scanner - Offensive Hacker Suite

`SecHeaders Pro Scanner` by Vijay™ is engineered specifically for penetration testers, offensive security analysts, and red teamers who need to perform instant, live audits of web application HTTP response headers across tabs without page refreshes, detect missing defensive controls, identify information disclosure banners, and capture pristine executive screenshots for vulnerability reports.

---

## 🚀 Key Features

- **⚡ Real-Time Auto-Scanning:** Automatically re-scans live headers immediately when switching tabs or navigating inside Single Page Applications (`SPA`) without requiring manual page refreshes.
- **📊 OWASP Top 10 Header Compliance:** Automated grading (`A+` down to `F`) based on severity weights (`Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options`, `Nosniff`, `Referrer-Policy`, `Permissions-Policy`, `COOP`, `COEP`, `CORP`).
- **⚠️ Information Disclosure Detection:** Flags server fingerprinting and banner leaks (`Server`, `X-Powered-By`, `X-AspNet-Version`, `X-Generator`).
- **📸 Screenshot Prep Mode:** With one click, hides interactive buttons/tabs, expands summary cards, and inserts assessment metadata (`Target Host`, `Pentest Timestamp`, `Scope`)—producing a clean, professional artifact ready for client audit reports.
- **📋 Remediation Code Snippets:** Copy hardened, ready-to-deploy header configurations directly to your clipboard for client developers.
- **💾 Markdown & JSON Export:** Instant 1-click export of structured finding summaries for DefectDojo, Jira, and executive PDFs.

---

## 🛠️ Two Ways to Use

### Option 1: The 1-Click Bookmarklet Sidebar (Zero-Install)
Ideal for quick pentest assessments or environments where you cannot install custom browser extensions.

1. Open `index.html` inside your browser.
2. Drag the **`🎯 SecHeaders Scanner`** button up to your Chrome Bookmarks Bar.
3. On any live web application target, click the bookmark. A dark-slate cybersecurity drawer overlay will slide in from the right with live header analysis and **Screenshot Mode**.

---

### Option 2: Manifest V3 Chrome Extension (Native Side Panel API)
Ideal for deep, unfiltered HTTP header interception (`chrome.webRequest` & `chrome.sidePanel`) without cross-origin (`CORS`) limitations and live tab synchronization.

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** in the top-right toggle switch.
3. Click **Load unpacked** and select the extension directory (`./chrome-extension`).
4. Click the **SecHeaders Pro Scanner** icon in your Chrome toolbar or open the **Side Panel** (`Alt+B`) on any active tab.

---

## 📁 Repository & Directory Structure

```
SecHeaders-Pro-Scanner/
├── index.html                  # Interactive Dashboard & Bookmarklet Installer Hub (by Vijay Uba™)
├── bookmarklet-sidebar.js      # Self-contained slide-in hacker scanner overlay source
├── generate_hacker_icons.py    # Python script that generated our custom Offensive Hacker Scanner icons
├── README.md                   # Documentation & Trademark Notice
└── chrome-extension/           # Manifest V3 Chrome Extension package
    ├── manifest.json           # Extension permissions & Vijay Uba™ branding
    ├── background.js           # Real-time HTTP header interception & tab switch auto-scanner
    ├── sidepanel.html          # Cyber-dark Side Panel & Popup UI with Vijay Uba™ title
    ├── sidepanel.css           # Executive dark-slate design system & screenshot styles
    ├── sidepanel.js            # OWASP auditing engine, search, export & screenshot logic
    └── icons/                  # 16x16, 48x48, and 128x128 Offensive Hacker Scanner PNG icons
```

---
