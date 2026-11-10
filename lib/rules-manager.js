// Rules Manager - Handles custom rules, allowlist, and dynamic rules
export class RulesManager {
  constructor() {
    this.CUSTOM_RULES_KEY = 'custom_rules';
    this.ALLOWLIST_KEY = 'allowlist';
    this.CUSTOM_RULE_BASE_ID = 1000000;
    this.ALLOWLIST_BASE_ID = 2000000;
  }

  async initialize() {
    const stored = await chrome.storage.local.get([this.CUSTOM_RULES_KEY, this.ALLOWLIST_KEY]);
    if (!stored[this.CUSTOM_RULES_KEY]) {
      await chrome.storage.local.set({ [this.CUSTOM_RULES_KEY]: [] });
    }
    if (!stored[this.ALLOWLIST_KEY]) {
      await chrome.storage.local.set({ [this.ALLOWLIST_KEY]: [] });
    }
    await this.syncRules();
  }

  async getCustomRules() {
    const stored = await chrome.storage.local.get(this.CUSTOM_RULES_KEY);
    return stored[this.CUSTOM_RULES_KEY] || [];
  }

  async addCustomRule(rule) {
    const rules = await this.getCustomRules();
    const newRule = {
      id: Date.now(),
      ...rule,
      createdAt: Date.now()
    };
    rules.push(newRule);
    await chrome.storage.local.set({ [this.CUSTOM_RULES_KEY]: rules });
    await this.syncRules();
    return newRule;
  }

  async removeCustomRule(id) {
    const rules = await this.getCustomRules();
    const filtered = rules.filter(r => r.id !== id);
    await chrome.storage.local.set({ [this.CUSTOM_RULES_KEY]: filtered });
    await this.syncRules();
  }

  async importCustomRules(rules) {
    await chrome.storage.local.set({ [this.CUSTOM_RULES_KEY]: rules });
    await this.syncRules();
  }

  async getAllowlist() {
    const stored = await chrome.storage.local.get(this.ALLOWLIST_KEY);
    return stored[this.ALLOWLIST_KEY] || [];
  }

  async addToAllowlist(domain, type = 'domain') {
    const allowlist = await this.getAllowlist();
    const entry = {
      id: Date.now(),
      domain,
      type, // 'domain', 'url', 'cosmetic'
      createdAt: Date.now()
    };
    allowlist.push(entry);
    await chrome.storage.local.set({ [this.ALLOWLIST_KEY]: allowlist });
    await this.syncRules();
    return entry;
  }

  async removeFromAllowlist(domain) {
    const allowlist = await this.getAllowlist();
    const filtered = allowlist.filter(a => a.domain !== domain);
    await chrome.storage.local.set({ [this.ALLOWLIST_KEY]: filtered });
    await this.syncRules();
  }

  async importAllowlist(allowlist) {
    await chrome.storage.local.set({ [this.ALLOWLIST_KEY]: allowlist });
    await this.syncRules();
  }

  async syncRules() {
    const [customRules, allowlist] = await Promise.all([
      this.getCustomRules(),
      this.getAllowlist()
    ]);

    // Convert custom rules to DNR format
    const dnrRules = [];
    let ruleId = this.CUSTOM_RULE_BASE_ID;

    for (const rule of customRules) {
      if (!rule.enabled) continue;
      const dnr = this.convertToDNR(rule, ruleId++);
      if (dnr) dnrRules.push(dnr);
    }

    // Convert allowlist to DNR allow rules
    for (const entry of allowlist) {
      const dnr = this.convertAllowToDNR(entry, ruleId++);
      if (dnr) dnrRules.push(dnr);
    }

    // Update dynamic rules
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const ourRuleIds = existing
      .filter(r => r.id >= this.CUSTOM_RULE_BASE_ID)
      .map(r => r.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ourRuleIds,
      addRules: dnrRules
    });
  }

  convertToDNR(rule, id) {
    try {
      const { type, pattern, resourceTypes, domains, options } = rule;

      const condition = {
        urlFilter: pattern,
        resourceTypes: resourceTypes || ['image', 'script', 'stylesheet', 'font', 'media', 'object', 'xmlhttprequest', 'sub_frame', 'ping', 'websocket']
      };

      if (domains && domains.length > 0) {
        condition.initiatorDomains = domains;
      }

      let action = { type: 'block' };
      if (type === 'redirect') {
        action = { type: 'redirect', redirect: { url: options.redirectUrl } };
      } else if (type === 'allow') {
        action = { type: 'allow' };
      } else if (type === 'upgrade') {
        action = { type: 'upgradeScheme' };
      }

      return { id, priority: 1, action, condition };
    } catch (err) {
      console.error('Failed to convert rule:', err);
      return null;
    }
  }

  convertAllowToDNR(entry, id) {
    try {
      const condition = {
        urlFilter: entry.domain.startsWith('||') ? entry.domain : `||${entry.domain}^`,
        resourceTypes: ['image', 'script', 'stylesheet', 'font', 'media', 'object', 'xmlhttprequest', 'sub_frame', 'ping', 'websocket']
      };

      return { id, priority: 2, action: { type: 'allow' }, condition };
    } catch (err) {
      return null;
    }
  }

  async enableAllRulesets() {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: ['ruleset_base', 'ruleset_custom', 'ruleset_allowlist', 'ruleset_dynamic'],
      disableRulesetIds: []
    });
    // Also enable any filter lists that are enabled
    const { filterLists = {} } = await chrome.storage.local.get('filterLists');
    const enabledListIds = Object.entries(filterLists)
      .filter(([_, v]) => v.enabled)
      .map(([_, v]) => v.rulesetId);

    if (enabledListIds.length > 0) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: enabledListIds,
        disableRulesetIds: []
      });
    }
  }

  async disableAllRulesets() {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: [],
      disableRulesetIds: ['ruleset_base', 'ruleset_easylist', 'ruleset_easyprivacy', 'ruleset_custom', 'ruleset_allowlist', 'ruleset_dynamic']
    });
  }

  async updateSiteRules(domain, enabled) {
    // This would add/remove rules for a specific site
    // For now, we handle this via the allowlist
    if (!enabled) {
      await this.addToAllowlist(domain, 'domain');
    } else {
      await this.removeFromAllowlist(domain);
    }
  }

  async addCosmeticFilter(selector, domain) {
    const rules = await this.getCustomRules();
    const newRule = {
      id: Date.now(),
      type: 'cosmetic',
      pattern: selector,
      domain: domain,
      description: `Cosmetic filter for ${domain}`,
      enabled: true,
      createdAt: Date.now()
    };
    rules.push(newRule);
    await chrome.storage.local.set({ [this.CUSTOM_RULES_KEY]: rules });
    await this.syncRules();
    return newRule;
  }
}