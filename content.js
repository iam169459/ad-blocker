// Purple Ad Blocker - Content Script
// Handles cosmetic filtering, request logging, and communication with background

(() => {
  'use strict';

  // State
  let enabled = true;
  let settings = {};
  let observer = null;
  let zapperActive = false;
  let zapperMode = 'block';
  let hoveredElement = null;
  let selectedElement = null;

  // Cosmetic filter selectors (updated from background)
  let cosmeticFilters = [];

  // Initialize
  async function init() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
      if (response) {
        enabled = response.enabled;
        settings = response.settings || {};
      }

      // Load cosmetic filters
      await loadCosmeticFilters();

      // Apply cosmetic filtering
      if (enabled && settings.cosmeticFiltering !== false) {
        applyCosmeticFilters();
      }

      // Set up mutation observer for dynamic content
      setupMutationObserver();

      // Listen for messages
      chrome.runtime.onMessage.addListener(handleMessage);

      // Notify background of page load
      chrome.runtime.sendMessage({
        type: 'PAGE_LOADED',
        url: location.href,
        domain: location.hostname
      }).catch(() => {});
    } catch (err) {
      console.error('[AdBlocker] Init error:', err);
    }
  }

  async function loadCosmeticFilters() {
    // In a real implementation, this would fetch from filter lists
    // For now, use built-in common selectors
    cosmeticFilters = [
      // Google ads
      '.adsbygoogle',
      '[data-ad-client]',
      '[data-ad-slot]',
      '.ad-unit',
      '.ad-container',
      '.ad-wrapper',
      '#google_ads_iframe_*',
      'ins.adsbygoogle',

      // Generic ad containers
      '[class*="ad-"]:not([class*="gradient"]):not([class*="accordion"]):not([class*="address"]):not([class*="advanced"]):not([class*="adventure"])',
      '[id*="ad-"]:not([id*="gradient"]):not([id*="accordion"]):not([id*="address"]):not([id*="advanced"]):not([id*="adventure"])',
      '[class*="-ad-"]',
      '[id*="-ad-"]',
      '[class*="advertisement"]',
      '[id*="advertisement"]',
      '[class*="sponsored"]',
      '[id*="sponsored"]',
      '.sponsored-content',
      '.sponsored-link',
      '.sponsored-post',

      // Common ad classes
      '.ad-banner',
      '.ad-header',
      '.ad-footer',
      '.ad-sidebar',
      '.ad-slot',
      '.ad-place',
      '.ad-space',
      '.ad-area',
      '.ad-box',
      '.advert-box',
      '.advertisement-box',
      '.banner-ad',
      '.banner_ads',
      '.advertising',
      '.advert',
      '.ads',
      '#ads',
      '#ad',

      // Social widgets
      '[class*="social-"]',
      '.social-widget',
      '.social-buttons',
      '.share-buttons',
      '.share-widget',
      '[data-social]',

      // Popups/Overlays
      '.popup-ad',
      '.overlay-ad',
      '.interstitial-ad',
      '.preroll-ad',
      '.midroll-ad',
      '.postroll-ad',
      '.video-ad',
      '.ad-overlay',
      '.ad-modal',
      '.ad-popup',

      // Native ads
      '.native-ad',
      '.native-ad-item',
      '.recommended-content',
      '.recommended-links',
      '.content-recommendation',
      '.outbrain',
      '.taboola',
      '[data-widget*="taboola"]',
      '[data-widget*="outbrain"]',

      // Newsletter/popup
      '.newsletter-popup',
      '.email-popup',
      '.subscribe-popup',
      '[class*="newsletter"]',
      '[class*="subscribe-modal"]',

      // Cookie notices (often blockable)
      '.cookie-banner',
      '.cookie-notice',
      '.gdpr-banner',
      '.consent-banner',
      '#cookie-law',
      '#cookie-banner',

      // Iframe ads
      'iframe[src*="doubleclick"]',
      'iframe[src*="googlesyndication"]',
      'iframe[src*="googleadservices"]',
      'iframe[src*="amazon-adsystem"]',
      'iframe[src*="facebook.com/tr"]',
      'iframe[src*="pubmatic"]',
      'iframe[src*="rubiconproject"]',
      'iframe[src*="openx.net"]',
      'iframe[src*="adnxs"]',
      'iframe[src*="taboola"]',
      'iframe[src*="outbrain"]',
      'iframe[src*="criteo"]',
      'iframe[src*="adsafeprotected"]',
      'iframe[src*="moatads"]',
      'iframe[src*="scorecardresearch"]',
      'iframe[src*="quantserve"]',
      'iframe[id*="google_ads"]',
      'iframe[name*="google_ads"]'
    ];
  }

  function applyCosmeticFilters() {
    if (!enabled || !settings.cosmeticFiltering) return;

    const style = document.createElement('style');
    style.id = 'adblocker-cosmetic-filters';
    style.textContent = cosmeticFilters.map(sel => {
      try {
        // Test if selector is valid
        document.querySelector(sel);
        return `${sel} { display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; width: 0 !important; position: absolute !important; pointer-events: none !important; }`;
      } catch (e) {
        return '';
      }
    }).filter(Boolean).join('\n');

    if (style.textContent) {
      (document.head || document.documentElement).appendChild(style);
    }
  }

  function setupMutationObserver() {
    if (observer) return;

    observer = new MutationObserver((mutations) => {
      if (!enabled || !settings.cosmeticFiltering) return;

      let shouldReapply = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if added node matches any ad selector
              if (matchesAdSelector(node) || node.querySelector(cosmeticFilters.join(','))) {
                shouldReapply = true;
                break;
              }
            }
          }
        }
        if (shouldReapply) break;
      }

      if (shouldReapply) {
        // Debounce
        clearTimeout(observer.debounceTimer);
        observer.debounceTimer = setTimeout(() => {
          applyCosmeticFilters();
        }, 100);
      }
    });

    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true
    });
  }

  function matchesAdSelector(element) {
    if (!element.matches) return false;
    try {
      return cosmeticFilters.some(sel => {
        try {
          return element.matches(sel);
        } catch (e) {
          return false;
        }
      });
    } catch (e) {
      return false;
    }
  }

  async function handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'ADBLOCK_STATE_CHANGED':
        enabled = message.enabled;
        if (enabled && settings.cosmeticFiltering !== false) {
          applyCosmeticFilters();
        } else {
          removeCosmeticFilters();
        }
        sendResponse({ success: true });
        break;

      case 'ZAPPER_ACTIVATE':
        zapperActive = true;
        zapperMode = message.mode || 'block';
        activateZapper(message.mode);
        sendResponse({ success: true });
        break;

      case 'ZAPPER_DEACTIVATE':
        zapperActive = false;
        deactivateZapper();
        sendResponse({ success: true });
        break;

      case 'GET_COSMETIC_FILTERS':
        sendResponse({ filters: cosmeticFilters });
        break;

      case 'ADD_COSMETIC_FILTER':
        cosmeticFilters.push(message.selector);
        applyCosmeticFilters();
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ error: 'Unknown message' });
    }
    return true;
  }

  function removeCosmeticFilters() {
    const style = document.getElementById('adblocker-cosmetic-filters');
    if (style) style.remove();
  }

  // Element Zapper functionality
  function activateZapper(mode) {
    if (!document.body) return;

    // Add styles for zapper
    addZapperStyles();

    // Event handlers
    document.addEventListener('mouseover', handleZapperMouseOver, true);
    document.addEventListener('mouseout', handleZapperMouseOut, true);
    document.addEventListener('click', handleZapperClick, true);
    document.addEventListener('keydown', handleZapperKeyDown, true);

    // Show toolbar
    showZapperToolbar(mode);
  }

  function deactivateZapper() {
    document.removeEventListener('mouseover', handleZapperMouseOver, true);
    document.removeEventListener('mouseout', handleZapperMouseOut, true);
    document.removeEventListener('click', handleZapperClick, true);
    document.removeEventListener('keydown', handleZapperKeyDown, true);

    // Remove highlight
    if (hoveredElement) {
      hoveredElement.classList.remove('adblocker-zapper-hover');
      hoveredElement = null;
    }

    // Remove toolbar
    const toolbar = document.getElementById('adblocker-zapper-toolbar');
    if (toolbar) toolbar.remove();

    // Remove styles
    const styles = document.getElementById('adblocker-zapper-styles');
    if (styles) styles.remove();
  }

  function addZapperStyles() {
    if (document.getElementById('adblocker-zapper-styles')) return;

    const style = document.createElement('style');
    style.id = 'adblocker-zapper-styles';
    style.textContent = `
      .adblocker-zapper-hover {
        outline: 2px solid #ff4444 !important;
        outline-offset: 2px !important;
        background-color: rgba(255, 68, 68, 0.1) !important;
        cursor: crosshair !important;
        position: relative !important;
      }
      .adblocker-zapper-hover::before {
        content: "Click to block" !important;
        position: absolute !important;
        top: -30px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        background: #ff4444 !important;
        color: white !important;
        padding: 2px 8px !important;
        border-radius: 4px !important;
        font-size: 12px !important;
        white-space: nowrap !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
      }
      .adblocker-zapper-selected {
        outline: 2px solid #44ff44 !important;
        outline-offset: 2px !important;
        background-color: rgba(68, 255, 68, 0.1) !important;
      }
      #adblocker-zapper-toolbar {
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        background: #1a1a2e !important;
        color: white !important;
        padding: 16px !important;
        border-radius: 12px !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
        z-index: 2147483647 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        min-width: 280px !important;
        border: 1px solid #333 !important;
      }
      #adblocker-zapper-toolbar h3 {
        margin: 0 0 12px !important;
        font-size: 16px !important;
        font-weight: 600 !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
      }
      #adblocker-zapper-toolbar .mode-buttons {
        display: flex !important;
        gap: 8px !important;
        margin-bottom: 12px !important;
      }
      #adblocker-zapper-toolbar button {
        padding: 8px 16px !important;
        border: none !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        transition: all 0.2s !important;
      }
      #adblocker-zapper-toolbar .btn-primary {
        background: #007aff !important;
        color: white !important;
      }
      #adblocker-zapper-toolbar .btn-secondary {
        background: #333 !important;
        color: white !important;
      }
      #adblocker-zapper-toolbar .btn-danger {
        background: #ff4444 !important;
        color: white !important;
      }
      #adblocker-zapper-toolbar .btn-primary.active,
      #adblocker-zapper-toolbar .btn-secondary.active {
        box-shadow: 0 0 0 2px #007aff !important;
      }
      #adblocker-zapper-toolbar .info {
        font-size: 12px !important;
        color: #aaa !important;
        margin-bottom: 12px !important;
      }
      #adblocker-zapper-toolbar .selector {
        font-family: monospace !important;
        font-size: 11px !important;
        background: #000 !important;
        padding: 8px !important;
        border-radius: 4px !important;
        word-break: break-all !important;
        max-height: 60px !important;
        overflow: auto !important;
      }
    `;
    document.head.appendChild(style);
  }

  function showZapperToolbar(mode) {
    let toolbar = document.getElementById('adblocker-zapper-toolbar');
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.id = 'adblocker-zapper-toolbar';
      document.body.appendChild(toolbar);
    }

    toolbar.innerHTML = `
      <h3>🎯 Element Zapper</h3>
      <div class="mode-buttons">
        <button class="btn-${mode === 'block' ? 'primary active' : 'secondary'}" data-mode="block">🚫 Block</button>
        <button class="btn-${mode === 'hide' ? 'primary active' : 'secondary'}" data-mode="hide">👁️ Hide</button>
        <button class="btn-${mode === 'inspect' ? 'primary active' : 'secondary'}" data-mode="inspect">🔍 Inspect</button>
      </div>
      <div class="info">Hover an element, click to ${mode}. Press ESC to exit.</div>
      <div class="selector" id="adblocker-zapper-selector">No element selected</div>
      <div style="display:flex; gap:8px; margin-top:12px;">
        <button class="btn-danger" id="adblocker-zapper-exit">Exit Zapper</button>
      </div>
    `;

    toolbar.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        zapperMode = btn.dataset.mode;
        showZapperToolbar(zapperMode);
      });
    });

    toolbar.querySelector('#adblocker-zapper-exit').addEventListener('click', () => {
      deactivateZapper();
      chrome.runtime.sendMessage({ type: 'ZAPPER_DEACTIVATE' }).catch(() => {});
    });
  }

  function handleZapperMouseOver(e) {
    if (!zapperActive) return;
    const target = e.target;
    if (target.id?.startsWith('adblocker-zapper')) return;
    if (target.closest('#adblocker-zapper-toolbar')) return;

    if (hoveredElement && hoveredElement !== target) {
      hoveredElement.classList.remove('adblocker-zapper-hover');
    }
    hoveredElement = target;
    target.classList.add('adblocker-zapper-hover');
    updateSelectorDisplay(target);
  }

  function handleZapperMouseOut(e) {
    if (!zapperActive) return;
    const target = e.target;
    if (target === hoveredElement && !target.matches(':hover')) {
      target.classList.remove('adblocker-zapper-hover');
      hoveredElement = null;
      updateSelectorDisplay(null);
    }
  }

  function handleZapperClick(e) {
    if (!zapperActive) return;
    if (e.target.id?.startsWith('adblocker-zapper') || e.target.closest('#adblocker-zapper-toolbar')) return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.target;
    const selector = generateSelector(target);

    // Apply action based on mode
    switch (zapperMode) {
      case 'block':
        blockElement(target, selector);
        break;
      case 'hide':
        hideElement(target, selector);
        break;
      case 'inspect':
        inspectElement(target, selector);
        break;
    }

    // Show feedback
    showZapperFeedback(target, zapperMode);
  }

  function handleZapperKeyDown(e) {
    if (!zapperActive) return;
    if (e.key === 'Escape') {
      deactivateZapper();
      chrome.runtime.sendMessage({ type: 'ZAPPER_DEACTIVATE' }).catch(() => {});
    }
  }

  function generateSelector(element) {
    if (element.id) return `#${element.id}`;

    const path = [];
    let current = element;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/).filter(c => c && !c.startsWith('adblocker-'));
        if (classes.length > 0) {
          selector += '.' + classes.join('.');
        }
      }
      path.unshift(selector);
      if (path.length > 4) break;
      current = current.parentElement;
    }
    return path.join(' > ');
  }

  function updateSelectorDisplay(element) {
    const display = document.getElementById('adblocker-zapper-selector');
    if (display) {
      display.textContent = element ? generateSelector(element) : 'No element selected';
    }
  }

  function blockElement(element, selector) {
    // Hide immediately
    element.style.display = 'none';
    element.setAttribute('data-adblocker-blocked', 'true');

    // Save as cosmetic filter
    chrome.runtime.sendMessage({
      type: 'ADD_COSMETIC_FILTER',
      selector,
      domain: location.hostname
    }).catch(() => {});
  }

  function hideElement(element, selector) {
    element.style.visibility = 'hidden';
    element.style.opacity = '0';
    element.style.height = '0';
    element.style.overflow = 'hidden';
    element.setAttribute('data-adblocker-hidden', 'true');

    chrome.runtime.sendMessage({
      type: 'ADD_COSMETIC_FILTER',
      selector,
      domain: location.hostname
    }).catch(() => {});
  }

  function inspectElement(element, selector) {
    // Just show info, don't modify
    console.log('[AdBlocker] Inspected element:', selector, element);
  }

  function showZapperFeedback(element, mode) {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      background: ${mode === 'block' ? '#ff4444' : mode === 'hide' ? '#ffaa00' : '#007aff'} !important;
      color: white !important;
      padding: 16px 32px !important;
      border-radius: 12px !important;
      font-size: 18px !important;
      font-weight: 600 !important;
      z-index: 2147483647 !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
      animation: adblocker-pop 0.3s ease-out !important;
    `;
    feedback.textContent = mode === 'block' ? '🚫 Blocked!' : mode === 'hide' ? '👁️ Hidden!' : '🔍 Inspected!';

    const style = document.createElement('style');
    style.textContent = `
      @keyframes adblocker-pop {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.1); }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.style.animation = 'adblocker-pop 0.3s ease-in reverse';
      setTimeout(() => feedback.remove(), 300);
    }, 1500);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();