// Element Zapper Injected Script
// Runs in page context when zapper is activated

(() => {
  'use strict';

  let zapperState = { active: false, mode: 'block' };
  let hoveredEl = null;
  let toolbar = null;
  let stylesInjected = false;

  // Listen for messages from content script
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (!event.data?.type?.startsWith('ADBLOCKER_ZAPPER_')) return;

    switch (event.data.type) {
      case 'ADBLOCKER_ZAPPER_ACTIVATE':
        zapperState = { active: true, mode: event.data.mode || 'block' };
        activateZapper();
        break;
      case 'ADBLOCKER_ZAPPER_DEACTIVATE':
        zapperState.active = false;
        deactivateZapper();
        break;
      case 'ADBLOCKER_ZAPPER_SET_MODE':
        zapperState.mode = event.data.mode;
        updateToolbar();
        break;
    }
  });

  function injectStyles() {
    if (stylesInjected) return;
    const style = document.createElement('style');
    style.id = 'adblocker-zapper-injected-styles';
    style.textContent = `
      .adblocker-zapper-hover {
        outline: 2px solid #ff4444 !important;
        outline-offset: 2px !important;
        background-color: rgba(255, 68, 68, 0.1) !important;
        cursor: crosshair !important;
        position: relative !important;
      }
      .adblocker-zapper-hover::before {
        content: "Click to ${zapperState.mode}" !important;
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
        flex-wrap: wrap !important;
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
    stylesInjected = true;
  }

  function activateZapper() {
    injectStyles();
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);
    createToolbar();
  }

  function deactivateZapper() {
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown, true);

    if (hoveredEl) {
      hoveredEl.classList.remove('adblocker-zapper-hover');
      hoveredEl = null;
    }

    if (toolbar) {
      toolbar.remove();
      toolbar = null;
    }

    const styles = document.getElementById('adblocker-zapper-injected-styles');
    if (styles) styles.remove();
    stylesInjected = false;
  }

  function createToolbar() {
    toolbar = document.createElement('div');
    toolbar.id = 'adblocker-zapper-toolbar';
    document.body.appendChild(toolbar);
    updateToolbar();
  }

  function updateToolbar() {
    if (!toolbar) return;
    const { mode } = zapperState;
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
        zapperState.mode = btn.dataset.mode;
        // Notify content script
        window.postMessage({ type: 'ADBLOCKER_ZAPPER_SET_MODE', mode: zapperState.mode }, '*');
        updateToolbar();
      });
    });

    toolbar.querySelector('#adblocker-zapper-exit').addEventListener('click', () => {
      deactivateZapper();
      window.postMessage({ type: 'ADBLOCKER_ZAPPER_DEACTIVATE' }, '*');
    });
  }

  function handleMouseOver(e) {
    if (!zapperState.active) return;
    const target = e.target;
    if (target.id?.startsWith('adblocker-zapper') || target.closest('#adblocker-zapper-toolbar')) return;

    if (hoveredEl && hoveredEl !== target) {
      hoveredEl.classList.remove('adblocker-zapper-hover');
    }
    hoveredEl = target;
    target.classList.add('adblocker-zapper-hover');
    updateSelectorDisplay(target);
  }

  function handleMouseOut(e) {
    if (!zapperState.active) return;
    const target = e.target;
    if (target === hoveredEl && !target.matches(':hover')) {
      target.classList.remove('adblocker-zapper-hover');
      hoveredEl = null;
      updateSelectorDisplay(null);
    }
  }

  function handleClick(e) {
    if (!zapperState.active) return;
    if (e.target.id?.startsWith('adblocker-zapper') || e.target.closest('#adblocker-zapper-toolbar')) return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.target;
    const selector = generateSelector(target);

    switch (zapperState.mode) {
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

    showFeedback(target, zapperState.mode);
  }

  function handleKeyDown(e) {
    if (!zapperState.active) return;
    if (e.key === 'Escape') {
      deactivateZapper();
      window.postMessage({ type: 'ADBLOCKER_ZAPPER_DEACTIVATE' }, '*');
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
    element.style.display = 'none';
    element.setAttribute('data-adblocker-blocked', 'true');
    element.setAttribute('data-adblocker-selector', selector);

    // Send to background for permanent rule
    window.postMessage({
      type: 'ADBLOCKER_ZAPPER_BLOCK',
      selector,
      domain: location.hostname,
      url: location.href
    }, '*');
  }

  function hideElement(element, selector) {
    element.style.visibility = 'hidden';
    element.style.opacity = '0';
    element.style.height = '0';
    element.style.overflow = 'hidden';
    element.setAttribute('data-adblocker-hidden', 'true');
    element.setAttribute('data-adblocker-selector', selector);

    window.postMessage({
      type: 'ADBLOCKER_ZAPPER_HIDE',
      selector,
      domain: location.hostname,
      url: location.href
    }, '*');
  }

  function inspectElement(element, selector) {
    console.log('[AdBlocker Zapper] Inspected:', selector, element);
    window.postMessage({
      type: 'ADBLOCKER_ZAPPER_INSPECT',
      selector,
      element: {
        tag: element.tagName,
        id: element.id,
        class: element.className,
        selector
      }
    }, '*');
  }

  function showFeedback(element, mode) {
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
      setTimeout(() => {
        feedback.remove();
        style.remove();
      }, 300);
    }, 1500);
  }
})();