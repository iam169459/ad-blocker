// Filter List Manager - Handles EasyList, EasyPrivacy, and custom filter lists
// Includes secure GitHub-based auto-update (URL hardcoded, not user-configurable)

export class FilterListManager {
  constructor() {
    // Hardcoded GitHub repository for filter list updates - NOT user configurable
    // This is compiled into the extension and cannot be changed by users
    this._githubConfig = {
      owner: 'purple-dev',
      repo: 'filter-lists',
      branch: 'main',
      paths: {
        easylist: 'lists/easylist.txt',
        easyprivacy: 'lists/easyprivacy.txt',
        fanboy_annoyance: 'lists/fanboy-annoyance.txt',
        fanboy_social: 'lists/fanboy-social.txt',
        ublock_filters: 'lists/ublock-filters.txt'
      }
    };

    // Primary sources (official) - used as fallback
    this._primarySources = {
      easylist: 'https://easylist.to/easylist/easylist.txt',
      easyprivacy: 'https://easylist.to/easylist/easyprivacy.txt',
      fanboy_annoyance: 'https://easylist.to/easylist/fanboy-annoyance.txt',
      fanboy_social: 'https://easylist.to/easylist/fanboy-social.txt',
      ublock_filters: 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt'
    };

    this.lists = {
      easylist: {
        id: 'easylist',
        name: 'EasyList',
        description: 'Primary list for blocking ads',
        rulesetId: 'ruleset_easylist',
        enabled: false,
        lastUpdated: 0,
        ruleCount: 0,
        _source: 'primary'
      },
      easyprivacy: {
        id: 'easyprivacy',
        name: 'EasyPrivacy',
        description: 'Blocks tracking and surveillance',
        rulesetId: 'ruleset_easyprivacy',
        enabled: false,
        lastUpdated: 0,
        ruleCount: 0,
        _source: 'primary'
      },
      fanboy_annoyance: {
        id: 'fanboy_annoyance',
        name: "Fanboy's Annoyance List",
        description: 'Blocks social widgets, popups, and annoyances',
        rulesetId: 'ruleset_fanboy_annoyance',
        enabled: false,
        lastUpdated: 0,
        ruleCount: 0,
        _source: 'primary'
      },
      fanboy_social: {
        id: 'fanboy_social',
        name: "Fanboy's Social List",
        description: 'Blocks social media buttons and widgets',
        rulesetId: 'ruleset_fanboy_social',
        enabled: false,
        lastUpdated: 0,
        ruleCount: 0,
        _source: 'primary'
      },
      ublock_filters: {
        id: 'ublock_filters',
        name: 'uBlock Filters',
        description: 'Additional filters optimized for uBlock Origin',
        rulesetId: 'ruleset_ublock_filters',
        enabled: false,
        lastUpdated: 0,
        ruleCount: 0,
        _source: 'primary'
      }
    };
  }

  // Private method to build GitHub raw URL - never exposed publicly
  _getGitHubUrl(listId) {
    const path = this._githubConfig.paths[listId];
    if (!path) return null;
    return `https://raw.githubusercontent.com/${this._githubConfig.owner}/${this._githubConfig.repo}/${this._githubConfig.branch}/${path}`;
  }

  // Private method to get primary source URL
  _getPrimaryUrl(listId) {
    return this._primarySources[listId] || null;
  }

  async initialize() {
    const stored = await chrome.storage.local.get('filterLists');
    if (stored.filterLists) {
      Object.keys(this.lists).forEach(key => {
        if (stored.filterLists[key]) {
          // Merge stored data but preserve internal _source and _githubConfig
          const storedData = stored.filterLists[key];
          this.lists[key] = { 
            ...this.lists[key], 
            ...storedData,
            _source: storedData._source || 'primary' // Preserve source preference
          };
        }
      });
    }
    await this.ensureRulesetFiles();
  }

  async ensureRulesetFiles() {
    // Ruleset files are declared in manifest.json and loaded by Chrome
    // They exist as pre-created empty JSON arrays
  }

  async getListsStatus() {
    // Return only public-safe data - never expose internal URLs or config
    return Object.values(this.lists).map(list => ({
      id: list.id,
      name: list.name,
      description: list.description,
      enabled: list.enabled,
      lastUpdated: list.lastUpdated,
      ruleCount: list.ruleCount
      // _source and URLs are intentionally omitted
    }));
  }

  async toggleList(listId, enabled) {
    const list = this.lists[listId];
    if (!list) throw new Error(`Unknown filter list: ${listId}`);

    list.enabled = enabled;

    if (enabled) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: [list.rulesetId],
        disableRulesetIds: []
      });
    } else {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: [],
        disableRulesetIds: [list.rulesetId]
      });
    }

    await this.save();
  }

  async updateAllLists() {
    const enabledLists = Object.values(this.lists).filter(l => l.enabled);
    const results = await Promise.allSettled(
      enabledLists.map(list => this.updateList(list))
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[FilterListManager] Failed to update ${enabledLists[index].id}:`, result.reason);
      }
    });

    await this.save();
    return results;
  }

  // Secure update method - tries GitHub first, falls back to primary source
  async updateList(list) {
    const listId = list.id;
    let lastError = null;

    // Try GitHub source first (if configured)
    const githubUrl = this._getGitHubUrl(listId);
    if (githubUrl) {
      try {
        await this._fetchAndApply(listId, githubUrl, 'github');
        return;
      } catch (err) {
        lastError = err;
        console.warn(`[FilterListManager] GitHub update failed for ${listId}, trying primary source:`, err.message);
      }
    }

    // Fallback to primary source
    const primaryUrl = this._getPrimaryUrl(listId);
    if (primaryUrl) {
      try {
        await this._fetchAndApply(listId, primaryUrl, 'primary');
        return;
      } catch (err) {
        lastError = err;
        console.error(`[FilterListManager] Primary source update failed for ${listId}:`, err.message);
      }
    }

    throw lastError || new Error(`No valid update source for ${listId}`);
  }

  // Internal fetch and apply - never exposed
  async _fetchAndApply(listId, url, source) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(url, { 
        cache: 'no-cache',
        signal: controller.signal,
        headers: {
          'Accept': 'text/plain,*/*'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const text = await response.text();
      
      // Validate content - basic sanity check
      if (!text || text.length < 100) {
        throw new Error('Downloaded content too small, likely invalid');
      }
      
      // Check for HTML error pages
      if (text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html')) {
        throw new Error('Received HTML instead of filter list');
      }

      const rules = this.parseFilterList(text, listId);
      
      if (rules.length === 0) {
        throw new Error('No valid rules parsed from filter list');
      }

      // Limit rules to DNR maximum
      const limitedRules = rules.slice(0, 5000);
      
      this.lists[listId].ruleCount = limitedRules.length;
      this.lists[listId].lastUpdated = Date.now();
      this.lists[listId]._source = source;

      await this.applyAsDynamicRules(this.lists[listId].rulesetId, limitedRules);
      
      console.log(`[FilterListManager] Updated ${listId} from ${source}: ${limitedRules.length} rules`);
      
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Update timeout');
      }
      throw err;
    }
  }

  parseFilterList(text, listId) {
    const rules = [];
    let ruleId = 1;
    const baseId = this.getBaseId(listId);

    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('!') || trimmed.startsWith('[')) continue;

      const dnrRule = this.convertFilterToDNR(trimmed, baseId + ruleId);
      if (dnrRule) {
        rules.push(dnrRule);
        ruleId++;
        if (ruleId > 5000) break;
      }
    }

    return rules;
  }

  getBaseId(listId) {
    const bases = {
      easylist: 10000,
      easyprivacy: 20000,
      fanboy_annoyance: 30000,
      fanboy_social: 40000,
      ublock_filters: 50000
    };
    return bases[listId] || 10000;
  }

  convertFilterToDNR(filter, id) {
    try {
      let urlFilter = filter;
      let resourceTypes = ['image', 'script', 'stylesheet', 'font', 'media', 'object', 'xmlhttprequest', 'sub_frame', 'ping', 'websocket'];

      const domainMatch = filter.match(/\$domain=([^,\s]+)/);
      let domains = null;
      if (domainMatch) {
        domains = domainMatch[1].split('|').map(d => d.replace(/^~/, ''));
        urlFilter = filter.replace(/\$domain=[^,\s]+/, '');
      }

      const typeMatch = filter.match(/\$([a-z~|]+)(?:,|$)/);
      if (typeMatch) {
        const types = typeMatch[1].split('|');
        const typeMap = {
          'script': 'script',
          'image': 'image',
          'stylesheet': 'stylesheet',
          'object': 'object',
          'xmlhttprequest': 'xmlhttprequest',
          'subdocument': 'sub_frame',
          'ping': 'ping',
          'websocket': 'websocket',
          'font': 'font',
          'media': 'media',
          'popup': 'sub_frame'
        };
        resourceTypes = types
          .filter(t => !t.startsWith('~') && typeMap[t])
          .map(t => typeMap[t]);
        if (resourceTypes.length === 0) resourceTypes = ['image', 'script', 'stylesheet', 'font', 'media', 'object', 'xmlhttprequest', 'sub_frame', 'ping', 'websocket'];
      }

      urlFilter = urlFilter
        .replace(/^\|\|/, '||')
        .replace(/\^\$/, '^')
        .replace(/\*/g, '*')
        .replace(/\|$/, '');

      if (filter.startsWith('@@')) return null;
      if (filter.includes('##') || filter.includes('#@#')) return null;

      return {
        id,
        priority: 1,
        action: { type: 'block' },
        condition: {
          urlFilter,
          resourceTypes,
          ...(domains && { initiatorDomains: domains })
        }
      };
    } catch (err) {
      return null;
    }
  }

  async applyAsDynamicRules(rulesetId, rules) {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const listId = rulesetId.replace('ruleset_', '');
    const baseId = this.getBaseId(listId);
    
    const toRemove = existing
      .filter(r => r.id >= baseId && r.id < baseId + 5000)
      .map(r => r.id);

    if (toRemove.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: toRemove,
        addRules: rules
      });
    } else {
      await chrome.declarativeNetRequest.updateDynamicRules({ addRules: rules });
    }
  }

  async save() {
    const data = {};
    Object.keys(this.lists).forEach(key => {
      // Only save public-safe data + minimal internal state
      const { _source, ...publicData } = this.lists[key];
      data[key] = { ...publicData, _source: this.lists[key]._source };
    });
    await chrome.storage.local.set({ filterLists: data });
  }

  // Method to force update from specific source (for testing/admin)
  // Not exposed in UI - only callable via console or background script
  async forceUpdateFromSource(listId, source) {
    const list = this.lists[listId];
    if (!list) throw new Error(`Unknown filter list: ${listId}`);

    if (source === 'github') {
      const url = this._getGitHubUrl(listId);
      if (!url) throw new Error('GitHub source not configured for this list');
      await this._fetchAndApply(listId, url, 'github');
    } else if (source === 'primary') {
      const url = this._getPrimaryUrl(listId);
      if (!url) throw new Error('Primary source not configured for this list');
      await this._fetchAndApply(listId, url, 'primary');
    } else {
      throw new Error(`Unknown source: ${source}`);
    }
    
    await this.save();
  }

  // Get update status for debugging (not shown in UI)
  getUpdateStatus() {
    return Object.values(this.lists).map(list => ({
      id: list.id,
      name: list.name,
      lastUpdated: list.lastUpdated,
      ruleCount: list.ruleCount,
      currentSource: list._source
    }));
  }
}