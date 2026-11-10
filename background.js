// Purple Ad Blocker - Background Service Worker
// Handles filter list updates, statistics, dynamic rules, context menus, and messaging

import { FilterListManager } from './lib/filter-list-manager.js';
import { StatisticsManager } from './lib/statistics-manager.js';
import { RulesManager } from './lib/rules-manager.js';
import { SettingsManager } from './lib/settings-manager.js';
import { ElementZapper } from './lib/element-zapper.js';

const filterListManager = new FilterListManager();
const statisticsManager = new StatisticsManager();
const rulesManager = new RulesManager();
const settingsManager = new SettingsManager();
const elementZapper = new ElementZapper();

// Initialize on install/update
chrome.runtime.onInstalled.addListener(async (details) => {
  await settingsManager.initialize();
  await statisticsManager.initialize();
  await rulesManager.initialize();
  await filterListManager.initialize();

  // Set up context menus
  setupContextMenus();

  // Set up alarms for periodic filter list updates
  chrome.alarms.create('update-filter-lists', { periodInMinutes: 60 * 24 }); // Daily

  // Update badge
  updateBadge();

  if (details.reason === 'install') {
    // Open welcome page on first install
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/welcome.html') });
  }
});

// Alarm listener for periodic updates
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'update-filter-lists') {
    const settings = await settingsManager.getAll();
    if (settings.autoUpdateFilters) {
      await filterListManager.updateAllLists();
    }
  }
});

// Declarative Net Request feedback - track blocked requests
chrome.declarativeNetRequest.onFeedback.addListener(async (details) => {
  if (details.type === 'network_request' && details.request) {
    await statisticsManager.recordBlockedRequest(details.request);
    updateBadge();
  }
});

// Handle messages from content scripts, popup, options
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'GET_STATE':
          sendResponse(await getFullState());
          break;

        case 'SET_ENABLED':
          await setEnabled(message.enabled);
          sendResponse({ success: true });
          break;

        case 'TOGGLE_ENABLED': {
          const state = await getFullState();
          await setEnabled(!state.enabled);
          sendResponse({ success: true, enabled: !state.enabled });
          break;
        }

        case 'GET_STATISTICS':
          sendResponse(await statisticsManager.getStatistics(message.timeRange));
          break;

        case 'GET_DETAILED_STATS':
          sendResponse(await statisticsManager.getDetailedStats());
          break;

        case 'RESET_STATISTICS':
          await statisticsManager.reset();
          updateBadge();
          sendResponse({ success: true });
          break;

        case 'GET_FILTER_LISTS':
          sendResponse(await filterListManager.getListsStatus());
          break;

        case 'TOGGLE_FILTER_LIST':
          await filterListManager.toggleList(message.listId, message.enabled);
          sendResponse({ success: true });
          break;

        case 'UPDATE_FILTER_LISTS':
          await filterListManager.updateAllLists();
          sendResponse({ success: true });
          break;

        case 'GET_ALLOWLIST':
          sendResponse(await rulesManager.getAllowlist());
          break;

        case 'ADD_TO_ALLOWLIST':
          await rulesManager.addToAllowlist(message.domain, message.type);
          sendResponse({ success: true });
          break;

        case 'REMOVE_FROM_ALLOWLIST':
          await rulesManager.removeFromAllowlist(message.domain);
          sendResponse({ success: true });
          break;

        case 'GET_CUSTOM_RULES':
          sendResponse(await rulesManager.getCustomRules());
          break;

        case 'ADD_CUSTOM_RULE':
          await rulesManager.addCustomRule(message.rule);
          sendResponse({ success: true });
          break;

        case 'REMOVE_CUSTOM_RULE':
          await rulesManager.removeCustomRule(message.id);
          sendResponse({ success: true });
          break;

        case 'OPEN_ZAPPER':
          await elementZapper.activate(sender.tab.id);
          sendResponse({ success: true });
          break;

        case 'GET_ZAPPER_STATE':
          sendResponse(await elementZapper.getState(sender.tab.id));
          break;

        case 'GET_SETTINGS':
          sendResponse(await settingsManager.getAll());
          break;

        case 'SET_SETTING':
          await settingsManager.set(message.key, message.value);
          sendResponse({ success: true });
          break;

        case 'EXPORT_SETTINGS':
          sendResponse(await exportAllData());
          break;

        case 'IMPORT_SETTINGS':
          await importAllData(message.data);
          sendResponse({ success: true });
          break;

        case 'GET_REQUEST_LOG':
          sendResponse(await statisticsManager.getRequestLog(message.limit));
          break;

        case 'CLEAR_REQUEST_LOG':
          await statisticsManager.clearRequestLog();
          sendResponse({ success: true });
          break;

        case 'GET_PER_SITE_SETTINGS':
          sendResponse(await settingsManager.getPerSiteSettings(message.domain));
          break;

        case 'SET_PER_SITE_SETTING':
          await settingsManager.setPerSiteSetting(message.domain, message.key, message.value);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (err) {
      console.error('Background error:', err);
      sendResponse({ error: err.message });
    }
  })();
  return true;
});

// Keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  switch (command) {
    case 'toggle-enabled': {
      const state = await getFullState();
      await setEnabled(!state.enabled);
      break;
    }
    case 'open-zapper': {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) await elementZapper.activate(tab.id);
      break;
    }
    case 'open-settings':
      chrome.runtime.openOptionsPage();
      break;
  }
});

// Tab update listener - update badge per tab
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updateBadge(tabId);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  updateBadge(activeInfo.tabId);
});

// Context menu setup
function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'block-element',
      title: 'Block element',
      contexts: ['all'],
      documentUrlPatterns: ['<all_urls>']
    });
    chrome.contextMenus.create({
      id: 'unblock-element',
      title: 'Unblock element on this site',
      contexts: ['all'],
      documentUrlPatterns: ['<all_urls>']
    });
    chrome.contextMenus.create({ type: 'separator' });
    chrome.contextMenus.create({
      id: 'disable-on-site',
      title: 'Disable on this site',
      contexts: ['page'],
      documentUrlPatterns: ['<all_urls>']
    });
    chrome.contextMenus.create({
      id: 'enable-on-site',
      title: 'Enable on this site',
      contexts: ['page'],
      documentUrlPatterns: ['<all_urls>']
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  const domain = new URL(tab.url).hostname;

  switch (info.menuItemId) {
    case 'block-element':
      await elementZapper.activate(tab.id, { mode: 'block' });
      break;
    case 'unblock-element':
      await elementZapper.activate(tab.id, { mode: 'unblock' });
      break;
    case 'disable-on-site':
      await settingsManager.setPerSiteSetting(domain, 'enabled', false);
      await rulesManager.updateSiteRules(domain, false);
      break;
    case 'enable-on-site':
      await settingsManager.setPerSiteSetting(domain, 'enabled', true);
      await rulesManager.updateSiteRules(domain, true);
      break;
  }
});

// Core functions
async function getFullState() {
  const [settings, stats] = await Promise.all([
    settingsManager.getAll(),
    statisticsManager.getStatistics('total')
  ]);
  return {
    enabled: settings.enabled,
    blockedCount: stats.totalBlocked,
    filterLists: await filterListManager.getListsStatus(),
    version: chrome.runtime.getManifest().version
  };
}

async function setEnabled(enabled) {
  const settings = await settingsManager.getAll();
  await settingsManager.set('enabled', enabled);

  if (enabled) {
    await rulesManager.enableAllRulesets();
  } else {
    await rulesManager.disableAllRulesets();
  }

  // Notify all tabs
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, { type: 'ADBLOCK_STATE_CHANGED', enabled }).catch(() => {});
  });

  updateBadge();
}

async function updateBadge(tabId?) {
  const stats = await statisticsManager.getStatistics('total');
  const count = stats.totalBlocked;
  const text = count > 999 ? '999+' : count > 0 ? count.toString() : '';

  if (tabId) {
    chrome.action.setBadgeText({ text, tabId });
  } else {
    chrome.action.setBadgeText({ text });
  }
  chrome.action.setBadgeBackgroundColor({ color: '#007aff' });
}

async function exportAllData() {
  const [settings, stats, customRules, allowlist, perSite] = await Promise.all([
    settingsManager.getAll(),
    statisticsManager.getDetailedStats(),
    rulesManager.getCustomRules(),
    rulesManager.getAllowlist(),
    settingsManager.getAllPerSiteSettings()
  ]);
  return { settings, stats, customRules, allowlist, perSite, version: '2.0.0', exportDate: Date.now() };
}

async function importAllData(data) {
  if (data.settings) await settingsManager.import(data.settings);
  if (data.customRules) await rulesManager.importCustomRules(data.customRules);
  if (data.allowlist) await rulesManager.importAllowlist(data.allowlist);
  if (data.perSite) await settingsManager.importPerSiteSettings(data.perSite);
  await rulesManager.syncRules();
  updateBadge();
}