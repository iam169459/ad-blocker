// Statistics Manager - Tracks blocked requests, provides detailed analytics
export class StatisticsManager {
  constructor() {
    this.STORAGE_KEY = 'adblock_stats';
    this.LOG_KEY = 'adblock_request_log';
    this.MAX_LOG_ENTRIES = 5000;
  }

  async initialize() {
    const stored = await chrome.storage.local.get([this.STORAGE_KEY, this.LOG_KEY]);
    if (!stored[this.STORAGE_KEY]) {
      await chrome.storage.local.set({
        [this.STORAGE_KEY]: {
          totalBlocked: 0,
          byType: {},
          byDomain: {},
          byFilterList: {},
          timeline: {},
          firstRun: Date.now()
        }
      });
    }
    if (!stored[this.LOG_KEY]) {
      await chrome.storage.local.set({ [this.LOG_KEY]: [] });
    }
  }

  async recordBlockedRequest(request) {
    const now = Date.now();
    const dateKey = new Date(now).toISOString().split('T')[0];
    const hourKey = new Date(now).toISOString().split(':')[0];

    const stored = await chrome.storage.local.get([this.STORAGE_KEY, this.LOG_KEY]);
    const stats = stored[this.STORAGE_KEY];
    const log = stored[this.LOG_KEY];

    // Update totals
    stats.totalBlocked++;

    // By type
    const type = request.resourceType || 'other';
    stats.byType[type] = (stats.byType[type] || 0) + 1;

    // By domain
    try {
      const url = new URL(request.url);
      const domain = url.hostname.replace(/^www\./, '');
      stats.byDomain[domain] = (stats.byDomain[domain] || 0) + 1;
    } catch (e) {
      stats.byDomain['unknown'] = (stats.byDomain['unknown'] || 0) + 1;
    }

    // Timeline (daily)
    stats.timeline[dateKey] = (stats.timeline[dateKey] || 0) + 1;

    // Add to request log
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: now,
      url: request.url,
      type,
      domain: '',
      tabId: request.tabId || 0,
      frameId: request.frameId || 0
    };

    try {
      logEntry.domain = new URL(request.url).hostname.replace(/^www\./, '');
    } catch (e) {
      logEntry.domain = 'unknown';
    }

    log.unshift(logEntry);
    if (log.length > this.MAX_LOG_ENTRIES) {
      log.length = this.MAX_LOG_ENTRIES;
    }

    await chrome.storage.local.set({
      [this.STORAGE_KEY]: stats,
      [this.LOG_KEY]: log
    });
  }

  async getStatistics(timeRange = 'total') {
    const stored = await chrome.storage.local.get(this.STORAGE_KEY);
    const stats = stored[this.STORAGE_KEY] || { totalBlocked: 0, byType: {}, byDomain: {}, timeline: {} };

    if (timeRange === 'total') {
      return {
        totalBlocked: stats.totalBlocked,
        byType: stats.byType,
        topDomains: this.getTopEntries(stats.byDomain, 10),
        timeline: stats.timeline
      };
    }

    const now = Date.now();
    let cutoff;
    switch (timeRange) {
      case 'hour': cutoff = now - 60 * 60 * 1000; break;
      case 'day': cutoff = now - 24 * 60 * 60 * 1000; break;
      case 'week': cutoff = now - 7 * 24 * 60 * 60 * 1000; break;
      case 'month': cutoff = now - 30 * 24 * 60 * 60 * 1000; break;
      default: cutoff = 0;
    }

    if (cutoff > 0) {
      const log = await this.getRequestLog(10000);
      const recentEntries = log.filter(e => e.timestamp >= cutoff);
      const byType = {};
      const byDomain = {};

      recentEntries.forEach(e => {
        byType[e.type] = (byType[e.type] || 0) + 1;
        byDomain[e.domain] = (byDomain[e.domain] || 0) + 1;
      });

      return {
        totalBlocked: recentEntries.length,
        byType,
        topDomains: this.getTopEntries(byDomain, 10),
        timeline: {}
      };
    }

    return {
      totalBlocked: stats.totalBlocked,
      byType: stats.byType,
      topDomains: this.getTopEntries(stats.byDomain, 10),
      timeline: stats.timeline
    };
  }

  async getDetailedStats() {
    const stored = await chrome.storage.local.get(this.STORAGE_KEY);
    const stats = stored[this.STORAGE_KEY] || { totalBlocked: 0, byType: {}, byDomain: {}, timeline: {} };

    const log = await this.getRequestLog(5000);

    return {
      totalBlocked: stats.totalBlocked,
      byType: stats.byType,
      byDomain: stats.byDomain,
      topDomains: this.getTopEntries(stats.byDomain, 20),
      timeline: stats.timeline,
      recentActivity: log.slice(0, 100),
      firstRun: stats.firstRun
    };
  }

  async getRequestLog(limit = 100) {
    const stored = await chrome.storage.local.get(this.LOG_KEY);
    return (stored[this.LOG_KEY] || []).slice(0, limit);
  }

  async clearRequestLog() {
    await chrome.storage.local.set({ [this.LOG_KEY]: [] });
  }

  async reset() {
    await chrome.storage.local.set({
      [this.STORAGE_KEY]: {
        totalBlocked: 0,
        byType: {},
        byDomain: {},
        byFilterList: {},
        timeline: {},
        firstRun: Date.now()
      },
      [this.LOG_KEY]: []
    });
  }

  getTopEntries(obj, limit) {
    return Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, value]) => ({ domain: key, count: value }));
  }
}