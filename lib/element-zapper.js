// Element Zapper - Interactive element blocking/hiding
export class ElementZapper {
  constructor() {
    this.activeTabs = new Map();
  }

  async activate(tabId, options = {}) {
    const { mode = 'block' } = options;

    // Check if already active
    if (this.activeTabs.has(tabId)) {
      await this.deactivate(tabId);
      return;
    }

    this.activeTabs.set(tabId, { mode, startTime: Date.now() });

    try {
      // Inject zapper UI
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['zapper-injected.js']
      });

      // Send activation message
      await chrome.tabs.sendMessage(tabId, {
        type: 'ZAPPER_ACTIVATE',
        mode
      });
    } catch (err) {
      console.error('Failed to activate zapper:', err);
      this.activeTabs.delete(tabId);
    }
  }

  async deactivate(tabId) {
    this.activeTabs.delete(tabId);
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'ZAPPER_DEACTIVATE' });
    } catch (err) {
      // Ignore
    }
  }

  async getState(tabId) {
    return this.activeTabs.has(tabId) ? this.activeTabs.get(tabId) : null;
  }

  async blockElement(tabId, selector, domain) {
    // Send to background for permanent rule creation
    try {
      await chrome.runtime.sendMessage({
        type: 'ZAPPER_BLOCK_ELEMENT',
        tabId,
        selector,
        domain
      });
    } catch (err) {
      console.error('Failed to block element via zapper:', err);
    }
  }

  async hideElement(tabId, selector, domain) {
    // Send to background for permanent rule creation
    try {
      await chrome.runtime.sendMessage({
        type: 'ZAPPER_HIDE_ELEMENT',
        tabId,
        selector,
        domain
      });
    } catch (err) {
      console.error('Failed to hide element via zapper:', err);
    }
  }
}