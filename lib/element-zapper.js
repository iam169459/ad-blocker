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
    // This would be called from the injected script
    // to permanently block an element
    const { rulesManager } = await import('./rules-manager.js');
    const rules = new rulesManager();
    await rules.initialize();

    // Generate a cosmetic filter rule
    const rule = {
      type: 'cosmetic',
      pattern: selector,
      domain: domain,
      description: `Zapped element on ${domain}`
    };

    await rules.addCustomRule(rule);
  }

  async hideElement(tabId, selector, domain) {
    // Similar to block but with hide action
    const { rulesManager } = await import('./rules-manager.js');
    const rules = new rulesManager();
    await rules.initialize();

    const rule = {
      type: 'cosmetic',
      pattern: selector,
      domain: domain,
      action: 'hide',
      description: `Hidden element on ${domain}`
    };

    await rules.addCustomRule(rule);
  }
}