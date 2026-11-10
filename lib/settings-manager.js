// Settings Manager - Handles all extension settings
export class SettingsManager {
  constructor() {
    this.SETTINGS_KEY = 'adblock_settings';
    this.PER_SITE_KEY = 'adblock_per_site_settings';
    this.defaults = {
      enabled: true,
      blockAds: true,
      blockTrackers: true,
      blockMalware: false,
      blockAnnoyances: false,
      blockThirdParty: false,
      blockScripts: false,
      blockFonts: false,
      blockImages: false,
      blockMedia: false,
      blockWebRTC: false,
      blockFingerprinting: false,
      blockCSP: false,
      blockCSPReports: false,
      cosmeticFiltering: true,
      elementZapper: true,
      autoUpdateFilters: true,
      showBadge: true,
      showNotifications: false,
      logRequests: true,
      theme: 'system', // 'light', 'dark', 'system'
      language: 'en',
      zapperMode: 'block', // 'block', 'hide', 'inspect'
      advancedMode: false
    };
  }

  async initialize() {
    const stored = await chrome.storage.local.get([this.SETTINGS_KEY, this.PER_SITE_KEY]);
    if (!stored[this.SETTINGS_KEY]) {
      await chrome.storage.local.set({ [this.SETTINGS_KEY]: this.defaults });
    }
    if (!stored[this.PER_SITE_KEY]) {
      await chrome.storage.local.set({ [this.PER_SITE_KEY]: {} });
    }
  }

  async getAll() {
    const stored = await chrome.storage.local.get(this.SETTINGS_KEY);
    return { ...this.defaults, ...stored[this.SETTINGS_KEY] };
  }

  async get(key) {
    const settings = await this.getAll();
    return settings[key];
  }

  async set(key, value) {
    const settings = await this.getAll();
    settings[key] = value;
    await chrome.storage.local.set({ [this.SETTINGS_KEY]: settings });
    return settings;
  }

  async import(data) {
    const merged = { ...this.defaults, ...data };
    await chrome.storage.local.set({ [this.SETTINGS_KEY]: merged });
  }

  // Per-site settings
  async getPerSiteSettings(domain) {
    const stored = await chrome.storage.local.get(this.PER_SITE_KEY);
    return stored[this.PER_SITE_KEY]?.[domain] || {};
  }

  async getAllPerSiteSettings() {
    const stored = await chrome.storage.local.get(this.PER_SITE_KEY);
    return stored[this.PER_SITE_KEY] || {};
  }

  async setPerSiteSetting(domain, key, value) {
    const stored = await chrome.storage.local.get(this.PER_SITE_KEY);
    const perSite = stored[this.PER_SITE_KEY] || {};
    if (!perSite[domain]) perSite[domain] = {};
    perSite[domain][key] = value;
    await chrome.storage.local.set({ [this.PER_SITE_KEY]: perSite });
  }

  async importPerSiteSettings(data) {
    await chrome.storage.local.set({ [this.PER_SITE_KEY]: data });
  }

  async reset() {
    await chrome.storage.local.set({
      [this.SETTINGS_KEY]: this.defaults,
      [this.PER_SITE_KEY]: {}
    });
  }
}