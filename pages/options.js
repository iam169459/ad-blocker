// Purple Ad Blocker - Options Script
import { showStatus, escapeHtml, formatNumber, downloadJSON } from './utils.js';

const nav = document.getElementById('optionsNav');
const body = document.getElementById('optionsBody');
const btnExport = document.getElementById('btnExport');
const btnImport = document.getElementById('btnImport');
const importFile = document.getElementById('importFile');

const TABS = [
  { id: 'general', label: 'General', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>' },
  { id: 'filters', label: 'Filter Lists', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
  { id: 'custom-rules', label: 'Custom Rules', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>' },
  { id: 'allowlist', label: 'Allowlist', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
  { id: 'statistics', label: 'Statistics', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>' },
  { id: 'advanced', label: 'Advanced', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' },
  { id: 'about', label: 'About', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>' }
];

let currentTab = 'general';
let settings = {};
let filterLists = [];
let customRules = [];
let allowlist = [];
let statistics = {};

// Utility functions for safe DOM creation
function createEl(tag, className, textContent, attributes = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (textContent) el.textContent = textContent;
  Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

function createSvg(innerHTML) {
  const div = document.createElement('div');
  div.innerHTML = innerHTML;
  return div.firstElementChild;
}

function clearEl(el) {
  el.textContent = '';
}

// Initialize
async function init() {
  await loadAllData();
  renderNav();
  renderTab(currentTab);

  btnExport.addEventListener('click', exportSettings);
  btnImport.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', importSettings);

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.adblock_settings) loadAllData();
    if (changes.filterLists) loadFilterLists();
    if (changes.custom_rules) loadCustomRules();
    if (changes.allowlist) loadAllowlist();
    if (changes.adblock_stats) loadStatistics();
  });
}

async function loadAllData() {
  const [settingsData, filtersData, rulesData, allowlistData, statsData] = await Promise.all([
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }),
    chrome.runtime.sendMessage({ type: 'GET_FILTER_LISTS' }),
    chrome.runtime.sendMessage({ type: 'GET_CUSTOM_RULES' }),
    chrome.runtime.sendMessage({ type: 'GET_ALLOWLIST' }),
    chrome.runtime.sendMessage({ type: 'GET_DETAILED_STATS' })
  ]);

  settings = settingsData || {};
  filterLists = filtersData || [];
  customRules = rulesData || [];
  allowlist = allowlistData || [];
  statistics = statsData || {};
}

async function loadFilterLists() {
  filterLists = await chrome.runtime.sendMessage({ type: 'GET_FILTER_LISTS' }) || [];
  if (currentTab === 'filters') renderTab('filters');
}

async function loadCustomRules() {
  customRules = await chrome.runtime.sendMessage({ type: 'GET_CUSTOM_RULES' }) || [];
  if (currentTab === 'custom-rules') renderTab('custom-rules');
}

async function loadAllowlist() {
  allowlist = await chrome.runtime.sendMessage({ type: 'GET_ALLOWLIST' }) || [];
  if (currentTab === 'allowlist') renderTab('allowlist');
}

async function loadStatistics() {
  statistics = await chrome.runtime.sendMessage({ type: 'GET_DETAILED_STATS' }) || {};
  if (currentTab === 'statistics') renderTab('statistics');
}

function renderNav() {
  clearEl(nav);
  TABS.forEach(tab => {
    const btn = createEl('button', `nav-item ${tab.id === currentTab ? 'active' : ''}`, '', { 'data-tab': tab.id, 'aria-label': tab.label });
    btn.appendChild(createSvg(tab.icon));
    const span = createEl('span', '', tab.label);
    btn.appendChild(span);
    btn.addEventListener('click', () => switchTab(tab.id));
    nav.appendChild(btn);
  });
}

function switchTab(tabId) {
  currentTab = tabId;
  nav.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  renderTab(tabId);
}

function renderTab(tabId) {
  switch (tabId) {
    case 'general': renderGeneralTab(); break;
    case 'filters': renderFiltersTab(); break;
    case 'custom-rules': renderCustomRulesTab(); break;
    case 'allowlist': renderAllowlistTab(); break;
    case 'statistics': renderStatisticsTab(); break;
    case 'advanced': renderAdvancedTab(); break;
    case 'about': renderAboutTab(); break;
  }
}

// General Tab
function renderGeneralTab() {
  clearEl(body);
  const panel = createEl('div', 'tab-panel active');

  const header = createEl('div', 'panel-header');
  header.appendChild(createEl('h2', 'panel-title', 'General'));
  header.appendChild(createEl('p', 'panel-subtitle', 'Configure core ad blocking behavior'));
  panel.appendChild(header);

  // Protection section
  const protectionSection = createEl('section', 'section');
  const protectionTitle = createEl('h3', 'section-title');
  protectionTitle.appendChild(createSvg('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>'));
  protectionTitle.appendChild(document.createTextNode('Protection'));
  protectionSection.appendChild(protectionTitle);

  protectionSection.appendChild(createSettingRow('Enable Ad Blocking', 'Block ads, trackers, and malware on all websites', 'enabled', settings.enabled !== false));
  protectionSection.appendChild(createSettingRow('Cosmetic Filtering', 'Hide ad elements on pages (element hiding)', 'cosmeticFiltering', settings.cosmeticFiltering !== false));
  protectionSection.appendChild(createSettingRow('Element Zapper', 'Click elements on pages to block or hide them', 'elementZapper', settings.elementZapper !== false));
  panel.appendChild(protectionSection);

  // Blocking Options section
  const blockingSection = createEl('section', 'section');
  const blockingTitle = createEl('h3', 'section-title');
  blockingTitle.appendChild(createSvg('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 0 0 3 11.21a9 9 0 0 1 0 15.58A9 9 0 0 1 12.79 21 7 7 0 0 0 21 12.79z"/></svg>'));
  blockingTitle.appendChild(document.createTextNode('Blocking Options'));
  blockingSection.appendChild(blockingTitle);

  blockingSection.appendChild(createSettingRow('Block Ads', 'Block advertisement content', 'blockAds', settings.blockAds !== false));
  blockingSection.appendChild(createSettingRow('Block Trackers', 'Block tracking scripts and pixels', 'blockTrackers', settings.blockTrackers !== false));
  blockingSection.appendChild(createSettingRow('Block Malware Domains', 'Block known malware and phishing domains', 'blockMalware', settings.blockMalware));
  blockingSection.appendChild(createSettingRow('Block Annoyances', 'Block cookie notices, newsletter popups, etc.', 'blockAnnoyances', settings.blockAnnoyances));
  blockingSection.appendChild(createSettingRow('Block Third-Party Requests', 'Block all third-party network requests (may break sites)', 'blockThirdParty', settings.blockThirdParty));
  panel.appendChild(blockingSection);

  // Appearance & Behavior section
  const appearanceSection = createEl('section', 'section');
  const appearanceTitle = createEl('h3', 'section-title');
  appearanceTitle.appendChild(createSvg('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'));
  appearanceTitle.appendChild(document.createTextNode('Appearance & Behavior'));
  appearanceSection.appendChild(appearanceTitle);

  appearanceSection.appendChild(createSelectRow('Theme', 'Choose color theme', 'theme', [
    { value: 'system', label: 'System', selected: settings.theme === 'system' },
    { value: 'light', label: 'Light', selected: settings.theme === 'light' },
    { value: 'dark', label: 'Dark', selected: settings.theme === 'dark' }
  ]));

  appearanceSection.appendChild(createSettingRow('Show Badge Count', 'Display blocked count on extension icon', 'showBadge', settings.showBadge !== false));
  appearanceSection.appendChild(createSettingRow('Show Notifications', 'Show desktop notifications for important events', 'showNotifications', settings.showNotifications));
  appearanceSection.appendChild(createSettingRow('Log Blocked Requests', 'Keep detailed log of blocked requests for statistics', 'logRequests', settings.logRequests !== false));
  panel.appendChild(appearanceSection);

  // Auto-Update section
  const updateSection = createEl('section', 'section');
  const updateTitle = createEl('h3', 'section-title');
  updateTitle.appendChild(createSvg('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'));
  updateTitle.appendChild(document.createTextNode('Auto-Update'));
  updateSection.appendChild(updateTitle);

  updateSection.appendChild(createSettingRow('Auto-Update Filter Lists', 'Automatically download latest filter lists daily', 'autoUpdateFilters', settings.autoUpdateFilters !== false));

  const lastUpdateRow = createEl('div', 'setting-row');
  const lastUpdateInfo = createEl('div', 'setting-info');
  lastUpdateInfo.appendChild(createEl('div', 'setting-label', 'Last Update'));
  const lastUpdateDesc = createEl('div', 'setting-desc');
  const lastUpdate = filterLists.length > 0 ? new Date(Math.max(...filterLists.map(f => f.lastUpdated || 0))).toLocaleString() : 'Never';
  lastUpdateDesc.textContent = lastUpdate;
  lastUpdateInfo.appendChild(lastUpdateDesc);
  lastUpdateRow.appendChild(lastUpdateInfo);
  const btnUpdateNow = createEl('button', 'btn btn-secondary', 'Update Now', { id: 'btnUpdateNow' });
  lastUpdateRow.appendChild(btnUpdateNow);
  updateSection.appendChild(lastUpdateRow);
  panel.appendChild(updateSection);

  body.appendChild(panel);

  // Bind toggle switches
  body.querySelectorAll('.toggle-switch[data-setting]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.setting;
      const newValue = !btn.classList.contains('active');
      btn.classList.toggle('active', newValue);
      await chrome.runtime.sendMessage({ type: 'SET_SETTING', key, value: newValue });
      settings[key] = newValue;
    });
  });

  // Bind select
  body.querySelectorAll('select[data-setting]').forEach(sel => {
    sel.addEventListener('change', async () => {
      const key = sel.dataset.setting;
      const value = sel.value;
      await chrome.runtime.sendMessage({ type: 'SET_SETTING', key, value });
      settings[key] = value;
      if (key === 'theme') applyTheme(value);
    });
  });

  // Update now button
  const btnUpdateNow = document.getElementById('btnUpdateNow');
  if (btnUpdateNow) {
    btnUpdateNow.addEventListener('click', async () => {
      btnUpdateNow.disabled = true;
      btnUpdateNow.textContent = 'Updating...';
      try {
        await chrome.runtime.sendMessage({ type: 'UPDATE_FILTER_LISTS' });
        showStatus('Filter lists updated', 'success');
        await loadFilterLists();
      } catch (err) {
        showStatus('Failed to update filter lists', 'error');
      }
      btnUpdateNow.disabled = false;
      btnUpdateNow.textContent = 'Update Now';
    });
  }
}

function applyTheme(theme) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

function createSettingRow(label, desc, settingKey, active) {
  const row = createEl('div', 'setting-row');
  const info = createEl('div', 'setting-info');
  info.appendChild(createEl('div', 'setting-label', label));
  info.appendChild(createEl('div', 'setting-desc', desc));
  row.appendChild(info);
  const toggle = createEl('button', `toggle-switch ${active ? 'active' : ''}`, '', { 'data-setting': settingKey, 'aria-label': label });
  row.appendChild(toggle);
  return row;
}

function createSelectRow(label, desc, settingKey, options) {
  const row = createEl('div', 'setting-row');
  const info = createEl('div', 'setting-info');
  info.appendChild(createEl('div', 'setting-label', label));
  info.appendChild(createEl('div', 'setting-desc', desc));
  row.appendChild(info);
  const select = createEl('select', 'select', '', { 'data-setting': settingKey, 'style': 'width: auto; min-width: 140px;' });
  options.forEach(opt => {
    const option = createEl('option', '', opt.label, { value: opt.value });
    if (opt.selected) option.selected = true;
    select.appendChild(option);
  });
  row.appendChild(select);
  return row;
}

// Filters Tab
function renderFiltersTab() {
  clearEl(body);
  const panel = createEl('div', 'tab-panel active');

  const header = createEl('div', 'panel-header');
  header.appendChild(createEl('h2', 'panel-title', 'Filter Lists'));
  header.appendChild(createEl('p', 'panel-subtitle', 'Manage filter list subscriptions'));
  panel.appendChild(header);

  const section = createEl('section', 'section');
  if (filterLists.length === 0) {
    const empty = createEl('div', 'empty-state');
    empty.appendChild(createSvg('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'));
    empty.appendChild(createEl('h3', '', 'No filter lists loaded'));
    empty.appendChild(createEl('p', '', 'Filter lists will appear here after first update'));
    section.appendChild(empty);
  } else {
    filterLists.forEach(filter => {
      const item = createEl('div', 'filter-item');
      const main = createEl('div', 'filter-main');
      const icon = createEl('div', 'filter-icon');
      icon.appendChild(createSvg('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'));
      main.appendChild(icon);
      const details = createEl('div', 'filter-details');
      details.appendChild(createEl('div', 'filter-name', filter.name));
      const meta = createEl('div', 'filter-meta');
      meta.textContent = `${filter.ruleCount.toLocaleString()} rules • ${filter.lastUpdated ? 'Updated ' + new Date(filter.lastUpdated).toLocaleDateString() : 'Never updated'} • ${filter.description}`;
      details.appendChild(meta);
      main.appendChild(details);
      item.appendChild(main);

      const actions = createEl('div', 'filter-actions');
      const status = createEl('span', `filter-status ${filter.enabled ? '' : 'inactive'}`, filter.enabled ? '✓ Enabled' : '✗ Disabled');
      actions.appendChild(status);
      const toggle = createEl('button', `toggle-switch ${filter.enabled ? 'active' : ''}`, '', { 'data-filter': filter.id, 'aria-label': `${filter.enabled ? 'Disable' : 'Enable'} ${filter.name}` });
      actions.appendChild(toggle);
      item.appendChild(actions);
      section.appendChild(item);
    });
  }
  panel.appendChild(section);

  // Update source info
  const sourceSection = createEl('section', 'section');
  const sourceTitle = createEl('h3', 'section-title', 'Update Source');
  sourceSection.appendChild(sourceTitle);
  const sourceRow = createEl('div', 'setting-row');
  const sourceInfo = createEl('div', 'setting-info');
  sourceInfo.appendChild(createEl('div', 'setting-label', 'Secure GitHub Updates'));
  sourceInfo.appendChild(createEl('div', 'setting-desc', 'Filter lists are automatically updated from a secure, hardcoded GitHub repository. The update URL cannot be changed for security.'));
  sourceRow.appendChild(sourceInfo);
  const statusBadge = createEl('span', 'filter-status', '✓ Active', { style: 'background: var(--success); color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;' });
  sourceRow.appendChild(statusBadge);
  sourceSection.appendChild(sourceRow);
  panel.appendChild(sourceSection);

  body.appendChild(panel);

  // Bind filter toggles
  body.querySelectorAll('.toggle-switch[data-filter]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const listId = btn.dataset.filter;
      const newValue = !btn.classList.contains('active');
      btn.classList.toggle('active', newValue);
      try {
        await chrome.runtime.sendMessage({ type: 'TOGGLE_FILTER_LIST', listId, enabled: newValue });
        showStatus(`${newValue ? 'Enabled' : 'Disabled'} filter list`, 'success');
      } catch (err) {
        btn.classList.toggle('active', !newValue);
        showStatus('Failed to toggle filter list', 'error');
      }
    });
  });
}

// Custom Rules Tab
function renderCustomRulesTab() {
  clearEl(body);
  const panel = createEl('div', 'tab-panel active');

  const header = createEl('div', 'panel-header');
  header.appendChild(createEl('h2', 'panel-title', 'Custom Rules'));
  header.appendChild(createEl('p', 'panel-subtitle', 'Create your own blocking rules'));
  panel.appendChild(header);

  // Add Rule section
  const addSection = createEl('section', 'section');
  addSection.appendChild(createEl('h3', 'section-title', 'Add Rule'));

  const typeGroup = createEl('div', 'form-group');
  typeGroup.appendChild(createEl('label', '', 'Rule Type'));
  const typeSelect = createEl('select', 'select', '', { id: 'ruleType' });
  ['Block Request', 'Hide Element (Cosmetic)', 'Allow (Exception)', 'Redirect', 'Upgrade to HTTPS'].forEach((label, i) => {
    const opt = createEl('option', '', label, { value: ['block', 'hide', 'allow', 'redirect', 'upgrade'][i] });
    typeSelect.appendChild(opt);
  });
  typeGroup.appendChild(typeSelect);
  addSection.appendChild(typeGroup);

  const patternGroup = createEl('div', 'form-group');
  patternGroup.appendChild(createEl('label', '', 'Pattern (URL filter or CSS selector)'));
  patternGroup.appendChild(createEl('input', 'input', '', { id: 'rulePattern', type: 'text', placeholder: '||example.com^ or .ad-banner' }));
  patternGroup.appendChild(createEl('p', 'hint', 'Use AdBlock Plus syntax for network filters, CSS selectors for cosmetic filters'));
  addSection.appendChild(patternGroup);

  const domainsGroup = createEl('div', 'form-group', '', { id: 'ruleDomainsGroup', style: 'display: none;' });
  domainsGroup.appendChild(createEl('label', '', 'Domains (comma-separated, optional)'));
  domainsGroup.appendChild(createEl('input', 'input', '', { id: 'ruleDomains', type: 'text', placeholder: 'example.com, another.com' }));
  domainsGroup.appendChild(createEl('p', 'hint', 'Limit rule to specific domains (for network filters)'));
  addSection.appendChild(domainsGroup);

  const redirectGroup = createEl('div', 'form-group', '', { id: 'ruleRedirectGroup', style: 'display: none;' });
  redirectGroup.appendChild(createEl('label', '', 'Redirect URL'));
  redirectGroup.appendChild(createEl('input', 'input', '', { id: 'ruleRedirect', type: 'url', placeholder: 'https://example.com/blank.png' }));
  addSection.appendChild(redirectGroup);

  const btnAddRule = createEl('button', 'btn btn-primary', 'Add Rule', { id: 'btnAddRule' });
  addSection.appendChild(btnAddRule);
  panel.appendChild(addSection);

  // Rules List section
  const listSection = createEl('section', 'section');
  listSection.appendChild(createEl('h3', 'section-title', `Your Rules (${customRules.length})`));
  if (customRules.length === 0) {
    const empty = createEl('div', 'empty-state');
    empty.appendChild(createSvg('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>'));
    empty.appendChild(createEl('h3', '', 'No custom rules yet'));
    empty.appendChild(createEl('p', '', 'Create rules to block specific content or allow exceptions'));
    listSection.appendChild(empty);
  } else {
    const list = createEl('div', 'rule-list', '', { id: 'ruleList' });
    customRules.forEach(rule => {
      const item = createEl('div', 'rule-item', '', { 'data-id': rule.id });
      item.appendChild(createEl('span', 'rule-type', rule.type));
      item.appendChild(createEl('span', 'rule-pattern', rule.pattern));
      if (rule.domains) {
        item.appendChild(createEl('span', 'rule-pattern', `@ ${rule.domains.join(', ')}`, { style: 'color: var(--text-secondary); font-size: 11px;' }));
      }
      const actions = createEl('div', 'rule-actions');
      const delBtn = createEl('button', 'btn btn-ghost btn-delete-rule', '', { 'data-id': rule.id, 'title': 'Delete', 'aria-label': 'Delete rule' });
      delBtn.appendChild(createSvg('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'));
      actions.appendChild(delBtn);
      item.appendChild(actions);
      list.appendChild(item);
    });
    listSection.appendChild(list);
  }
  panel.appendChild(listSection);
  body.appendChild(panel);

  // Show/hide fields based on rule type
  const ruleType = document.getElementById('ruleType');
  const ruleDomainsGroup = document.getElementById('ruleDomainsGroup');
  const ruleRedirectGroup = document.getElementById('ruleRedirectGroup');

  function updateRuleFields() {
    const type = ruleType.value;
    ruleDomainsGroup.style.display = ['block', 'redirect'].includes(type) ? 'block' : 'none';
    ruleRedirectGroup.style.display = type === 'redirect' ? 'block' : 'none';
  }
  ruleType.addEventListener('change', updateRuleFields);
  updateRuleFields();

  // Add rule
  const btnAddRule = document.getElementById('btnAddRule');
  const rulePattern = document.getElementById('rulePattern');
  const ruleDomains = document.getElementById('ruleDomains');
  const ruleRedirect = document.getElementById('ruleRedirect');

  if (btnAddRule) {
    btnAddRule.addEventListener('click', async () => {
      const pattern = rulePattern.value.trim();
      if (!pattern) { showStatus('Please enter a pattern', 'error'); return; }

      const rule = {
        type: ruleType.value,
        pattern,
        domains: ruleDomains.value.split(',').map(d => d.trim()).filter(Boolean),
        redirectUrl: ruleRedirect.value.trim()
      };

      try {
        await chrome.runtime.sendMessage({ type: 'ADD_CUSTOM_RULE', rule });
        showStatus('Rule added', 'success');
        rulePattern.value = '';
        ruleDomains.value = '';
        ruleRedirect.value = '';
        await loadCustomRules();
      } catch (err) {
        showStatus('Failed to add rule', 'error');
      }
    });
  }

  // Delete rules
  body.querySelectorAll('.btn-delete-rule').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id, 10);
      try {
        await chrome.runtime.sendMessage({ type: 'REMOVE_CUSTOM_RULE', id });
        showStatus('Rule removed', 'success');
        await loadCustomRules();
      } catch (err) {
        showStatus('Failed to remove rule', 'error');
      }
    });
  });
}

// Allowlist Tab
function renderAllowlistTab() {
  clearEl(body);
  const panel = createEl('div', 'tab-panel active');

  const header = createEl('div', 'panel-header');
  header.appendChild(createEl('h2', 'panel-title', 'Allowlist'));
  header.appendChild(createEl('p', 'panel-subtitle', 'Domains where ad blocking is disabled'));
  panel.appendChild(header);

  // Add to Allowlist section
  const addSection = createEl('section', 'section');
  addSection.appendChild(createEl('h3', 'section-title', 'Add to Allowlist'));
  const domainGroup = createEl('div', 'form-group');
  domainGroup.appendChild(createEl('label', '', 'Domain'));
  domainGroup.appendChild(createEl('input', 'input', '', { id: 'allowlistDomain', type: 'text', placeholder: 'example.com' }));
  domainGroup.appendChild(createEl('p', 'hint', 'Enter a domain to disable ad blocking on that site'));
  addSection.appendChild(domainGroup);
  const btnAddAllowlist = createEl('button', 'btn btn-primary', 'Add Domain', { id: 'btnAddAllowlist' });
  addSection.appendChild(btnAddAllowlist);
  panel.appendChild(addSection);

  // Allowlisted Domains section
  const listSection = createEl('section', 'section');
  listSection.appendChild(createEl('h3', 'section-title', `Allowlisted Domains (${allowlist.length})`));
  if (allowlist.length === 0) {
    const empty = createEl('div', 'empty-state');
    empty.appendChild(createSvg('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'));
    empty.appendChild(createEl('h3', '', 'No allowlisted domains'));
    empty.appendChild(createEl('p', '', 'Add domains where you want to allow ads'));
    listSection.appendChild(empty);
  } else {
    const list = createEl('div', 'allowlist-list', '', { id: 'allowlistList' });
    allowlist.forEach(item => {
      const el = createEl('div', 'allowlist-item', '', { 'data-domain': item.domain });
      el.appendChild(createEl('span', 'allowlist-domain', item.domain));
      el.appendChild(createEl('span', 'rule-type', item.type || 'domain'));
      const actions = createEl('div', 'rule-actions');
      const delBtn = createEl('button', 'btn btn-ghost btn-remove-allowlist', '', { 'data-domain': item.domain, 'title': 'Remove', 'aria-label': 'Remove from allowlist' });
      delBtn.appendChild(createSvg('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'));
      actions.appendChild(delBtn);
      el.appendChild(actions);
      list.appendChild(el);
    });
    listSection.appendChild(list);
  }
  panel.appendChild(listSection);

  // Quick Actions
  const quickSection = createEl('section', 'section');
  quickSection.appendChild(createEl('h3', 'section-title', 'Quick Actions'));
  const quickActions = createEl('div', '', '', { style: 'display: flex; gap: 12px; flex-wrap: wrap;' });
  const btnAllowCurrentSite = createEl('button', 'btn btn-secondary', 'Allow Current Site', { id: 'btnAllowCurrentSite' });
  const btnClearAllowlist = createEl('button', 'btn btn-outline', 'Clear All', { id: 'btnClearAllowlist' });
  quickActions.appendChild(btnAllowCurrentSite);
  quickActions.appendChild(btnClearAllowlist);
  quickSection.appendChild(quickActions);
  panel.appendChild(quickSection);

  body.appendChild(panel);

  // Add to allowlist
  const btnAddAllowlist = document.getElementById('btnAddAllowlist');
  const allowlistDomain = document.getElementById('allowlistDomain');
  if (btnAddAllowlist) {
    btnAddAllowlist.addEventListener('click', async () => {
      const domain = allowlistDomain.value.trim().toLowerCase();
      if (!domain) { showStatus('Please enter a domain', 'error'); return; }
      try {
        await chrome.runtime.sendMessage({ type: 'ADD_TO_ALLOWLIST', domain, type: 'domain' });
        showStatus(`Added ${domain} to allowlist`, 'success');
        allowlistDomain.value = '';
        await loadAllowlist();
      } catch (err) { showStatus('Failed to add domain', 'error'); }
    });
  }

  // Remove from allowlist
  body.querySelectorAll('.btn-remove-allowlist').forEach(btn => {
    btn.addEventListener('click', async () => {
      const domain = btn.dataset.domain;
      try {
        await chrome.runtime.sendMessage({ type: 'REMOVE_FROM_ALLOWLIST', domain });
        showStatus(`Removed ${domain} from allowlist`, 'success');
        await loadAllowlist();
      } catch (err) { showStatus('Failed to remove domain', 'error'); }
    });
  });

  // Allow current site
  const btnAllowCurrentSite = document.getElementById('btnAllowCurrentSite');
  if (btnAllowCurrentSite) {
    btnAllowCurrentSite.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        const domain = new URL(tab.url).hostname;
        try {
          await chrome.runtime.sendMessage({ type: 'ADD_TO_ALLOWLIST', domain, type: 'domain' });
          showStatus(`Added ${domain} to allowlist`, 'success');
          await loadAllowlist();
        } catch (err) { showStatus('Failed to add domain', 'error'); }
      }
    });
  }

  // Clear all
  const btnClearAllowlist = document.getElementById('btnClearAllowlist');
  if (btnClearAllowlist) {
    btnClearAllowlist.addEventListener('click', async () => {
      if (confirm('Clear all allowlisted domains?')) {
        for (const item of allowlist) {
          await chrome.runtime.sendMessage({ type: 'REMOVE_FROM_ALLOWLIST', domain: item.domain });
        }
        showStatus('Allowlist cleared', 'success');
        await loadAllowlist();
      }
    });
  }
}

// Statistics Tab
function renderStatisticsTab() {
  clearEl(body);
  const panel = createEl('div', 'tab-panel active');

  const header = createEl('div', 'panel-header');
  header.appendChild(createEl('h2', 'panel-title', 'Statistics'));
  header.appendChild(createEl('p', 'panel-subtitle', 'Detailed blocking statistics'));
  panel.appendChild(header);

  const total = statistics.totalBlocked || 0;
  const byType = statistics.byType || {};
  const byDomain = statistics.byDomain || {};
  const topDomains = Object.entries(byDomain).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const statsGrid = createEl('div', 'stats-grid');
  [
    { value: total.toLocaleString(), label: 'Total Blocked' },
    { value: Object.values(byType).reduce((a, b) => a + b, 0).toLocaleString(), label: 'Network Requests' },
    { value: Object.keys(byDomain).length, label: 'Domains Blocked' },
    { value: statistics.firstRun ? Math.ceil((Date.now() - statistics.firstRun) / 86400000) : 0, label: 'Days Active' }
  ].forEach(s => {
    const card = createEl('div', 'stat-card');
    card.appendChild(createEl('div', 'stat-value', s.value));
    card.appendChild(createEl('div', 'stat-label', s.label));
    statsGrid.appendChild(card);
  });
  panel.appendChild(statsGrid);

  // Blocked by Type
  const typeSection = createEl('section', 'section');
  typeSection.appendChild(createEl('h3', 'section-title', 'Blocked by Type'));
  const typeList = createEl('div', 'rule-list');
  Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    const item = createEl('div', 'rule-item');
    item.appendChild(createEl('span', 'rule-pattern', type));
    item.appendChild(createEl('span', 'rule-type', count.toLocaleString(), { style: 'background: var(--accent-light); color: var(--accent);' }));
    typeList.appendChild(item);
  });
  typeSection.appendChild(typeList);
  panel.appendChild(typeSection);

  // Top Blocked Domains
  const domainSection = createEl('section', 'section');
  domainSection.appendChild(createEl('h3', 'section-title', 'Top Blocked Domains'));
  const domainList = createEl('div', 'rule-list');
  if (topDomains.length > 0) {
    topDomains.forEach(([domain, count]) => {
      const item = createEl('div', 'rule-item');
      item.appendChild(createEl('span', 'rule-pattern', domain));
      item.appendChild(createEl('span', 'rule-type', count.toLocaleString(), { style: 'background: var(--danger-light); color: var(--danger);' }));
      const actions = createEl('div', 'rule-actions');
      const allowBtn = createEl('button', 'btn btn-ghost btn-allow-domain', 'Allow', { 'data-domain': domain, title: 'Allow this domain' });
      actions.appendChild(allowBtn);
      item.appendChild(actions);
      domainList.appendChild(item);
    });
  } else {
    domainList.appendChild(createEl('div', 'empty-state', 'No domains blocked yet'));
  }
  domainSection.appendChild(domainList);
  panel.appendChild(domainSection);

  // Timeline
  const timelineSection = createEl('section', 'section');
  timelineSection.appendChild(createEl('h3', 'section-title', 'Timeline (Last 30 Days)'));
  const timeline = createEl('div', '', '', { style: 'height: 200px; display: flex; align-items: end; gap: 4px; padding: 16px 0;' });
  Object.entries(statistics.timeline || {}).sort((a, b) => a[0].localeCompare(b[0])).slice(-30).forEach(([date, count]) => {
    const max = Math.max(...Object.values(statistics.timeline || {}), 1);
    const height = (count / max) * 180;
    const bar = createEl('div', '', '', { style: 'flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;' });
    bar.appendChild(createEl('div', '', '', { style: `width: 100%; height: ${height}px; background: var(--accent); border-radius: 2px 2px 0 0; transition: height 0.3s;` }));
    bar.appendChild(createEl('span', '', date.slice(5), { style: 'font-size: 10px; color: var(--text-muted);' }));
    timeline.appendChild(bar);
  });
  timelineSection.appendChild(timeline);
  panel.appendChild(timelineSection);

  // Reset/Export
  const actionSection = createEl('section', 'section');
  const actionDiv = createEl('div', '', '', { style: 'display: flex; gap: 12px; justify-content: center;' });
  const btnResetStats = createEl('button', 'btn btn-danger', 'Reset All Statistics', { id: 'btnResetStats' });
  const btnExportStats = createEl('button', 'btn btn-outline', 'Export Data', { id: 'btnExportStats' });
  actionDiv.appendChild(btnResetStats);
  actionDiv.appendChild(btnExportStats);
  actionSection.appendChild(actionDiv);
  panel.appendChild(actionSection);

  body.appendChild(panel);

  // Allow domain from stats
  body.querySelectorAll('.btn-allow-domain').forEach(btn => {
    btn.addEventListener('click', async () => {
      const domain = btn.dataset.domain;
      try {
        await chrome.runtime.sendMessage({ type: 'ADD_TO_ALLOWLIST', domain, type: 'domain' });
        showStatus(`Added ${domain} to allowlist`, 'success');
        await loadAllowlist();
      } catch (err) { showStatus('Failed to allow domain', 'error'); }
    });
  });

  // Reset stats
  const btnResetStats = document.getElementById('btnResetStats');
  if (btnResetStats) {
    btnResetStats.addEventListener('click', async () => {
      if (confirm('Reset all statistics? This cannot be undone.')) {
        try {
          await chrome.runtime.sendMessage({ type: 'RESET_STATISTICS' });
          showStatus('Statistics reset', 'success');
          await loadStatistics();
        } catch (err) { showStatus('Failed to reset statistics', 'error'); }
      }
    });
  }

  // Export stats
  const btnExportStats = document.getElementById('btnExportStats');
  if (btnExportStats) {
    btnExportStats.addEventListener('click', async () => {
      const data = await chrome.runtime.sendMessage({ type: 'EXPORT_SETTINGS' });
      downloadJSON(data, 'adblocker-stats.json');
      showStatus('Statistics exported', 'success');
    });
  }
}

// Advanced Tab
function renderAdvancedTab() {
  clearEl(body);
  const panel = createEl('div', 'tab-panel active');

  const header = createEl('div', 'panel-header');
  header.appendChild(createEl('h2', 'panel-title', 'Advanced'));
  header.appendChild(createEl('p', 'panel-subtitle', 'Advanced configuration options'));
  panel.appendChild(header);

  // Experimental Features
  const expSection = createEl('section', 'section');
  expSection.appendChild(createEl('h3', 'section-title', 'Experimental Features'));
  expSection.appendChild(createSettingRow('Advanced Mode', 'Enable advanced settings and debug features', 'advancedMode', settings.advancedMode));
  panel.appendChild(expSection);

  // Privacy Protection
  const privacySection = createEl('section', 'section');
  privacySection.appendChild(createEl('h3', 'section-title', 'Privacy Protection'));
  privacySection.appendChild(createSettingRow('Block WebRTC', 'Prevent WebRTC IP leaks (may affect video calls)', 'blockWebRTC', settings.blockWebRTC));
  privacySection.appendChild(createSettingRow('Block Fingerprinting', 'Block canvas, audio, and battery fingerprinting', 'blockFingerprinting', settings.blockFingerprinting));
  privacySection.appendChild(createSettingRow('Block CSP Reports', 'Block Content Security Policy violation reports', 'blockCSPReports', settings.blockCSPReports));
  panel.appendChild(privacySection);

  // Debug & Development
  const debugSection = createEl('section', 'section');
  debugSection.appendChild(createEl('h3', 'section-title', 'Debug & Development'));
  const debugGroup = createEl('div', 'form-group');
  debugGroup.appendChild(createEl('label', '', 'Debug Log Level'));
  const debugSelect = createEl('select', 'select', '', { id: 'debugLevel' });
  ['None', 'Errors Only', 'Warnings', 'Info', 'Debug'].forEach((label, i) => {
    const opt = createEl('option', '', label, { value: ['none', 'error', 'warn', 'info', 'debug'][i] });
    if (settings.debugLevel === ['none', 'error', 'warn', 'info', 'debug'][i]) opt.selected = true;
    debugSelect.appendChild(opt);
  });
  debugGroup.appendChild(debugSelect);
  debugSection.appendChild(debugGroup);
  const debugBtns = createEl('div', '', '', { style: 'display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;' });
  debugBtns.appendChild(createEl('button', 'btn btn-secondary', 'View Console Logs', { id: 'btnViewLogs' }));
  debugBtns.appendChild(createEl('button', 'btn btn-outline', 'Clear Logs', { id: 'btnClearLogs' }));
  debugSection.appendChild(debugBtns);
  panel.appendChild(debugSection);

  // Danger Zone
  const dangerSection = createEl('section', 'section');
  dangerSection.appendChild(createEl('h3', 'section-title', 'Danger Zone'));
  dangerSection.appendChild(createEl('p', '', 'These actions are irreversible.', { style: 'color: var(--text-secondary); margin-bottom: 16px; font-size: 14px;' }));
  const dangerBtns = createEl('div', '', '', { style: 'display: flex; gap: 12px; flex-wrap: wrap;' });
  dangerBtns.appendChild(createEl('button', 'btn btn-danger', 'Reset All Settings', { id: 'btnResetAll' }));
  dangerBtns.appendChild(createEl('button', 'btn btn-outline', 'Reset Custom Rules', { id: 'btnResetRules' }));
  dangerBtns.appendChild(createEl('button', 'btn btn-outline', 'Reset Allowlist', { id: 'btnResetAllowlist' }));
  dangerSection.appendChild(dangerBtns);
  panel.appendChild(dangerSection);

  body.appendChild(panel);

  // Bind advanced toggles
  body.querySelectorAll('.toggle-switch[data-setting]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.setting;
      const newValue = !btn.classList.contains('active');
      btn.classList.toggle('active', newValue);
      await chrome.runtime.sendMessage({ type: 'SET_SETTING', key, value: newValue });
      settings[key] = newValue;
    });
  });

  // Debug level
  const debugLevel = document.getElementById('debugLevel');
  if (debugLevel) {
    debugLevel.addEventListener('change', async () => {
      await chrome.runtime.sendMessage({ type: 'SET_SETTING', key: 'debugLevel', value: debugLevel.value });
      settings.debugLevel = debugLevel.value;
    });
  }

  // Danger zone buttons
  const btnResetAll = document.getElementById('btnResetAll');
  if (btnResetAll) {
    btnResetAll.addEventListener('click', async () => {
      if (confirm('⚠️ This will reset ALL settings, rules, allowlist, and statistics. Are you sure?')) {
        if (confirm('This action cannot be undone. Type "RESET" to confirm.')) {
          try {
            await chrome.runtime.sendMessage({ type: 'RESET_ALL' });
            showStatus('All data reset', 'success');
            await loadAllData();
            renderTab(currentTab);
          } catch (err) { showStatus('Failed to reset', 'error'); }
        }
      }
    });
  }

  const btnResetRules = document.getElementById('btnResetRules');
  if (btnResetRules) {
    btnResetRules.addEventListener('click', async () => {
      if (confirm('Delete all custom rules?')) {
        for (const rule of customRules) {
          await chrome.runtime.sendMessage({ type: 'REMOVE_CUSTOM_RULE', id: rule.id });
        }
        showStatus('Custom rules cleared', 'success');
        await loadCustomRules();
      }
    });
  }

  const btnResetAllowlist = document.getElementById('btnResetAllowlist');
  if (btnResetAllowlist) {
    btnResetAllowlist.addEventListener('click', async () => {
      if (confirm('Clear entire allowlist?')) {
        for (const item of allowlist) {
          await chrome.runtime.sendMessage({ type: 'REMOVE_FROM_ALLOWLIST', domain: item.domain });
        }
        showStatus('Allowlist cleared', 'success');
        await loadAllowlist();
      }
    });
  }

  const btnViewLogs = document.getElementById('btnViewLogs');
  if (btnViewLogs) {
    btnViewLogs.addEventListener('click', () => {
      chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
    });
  }
}

// About Tab
function renderAboutTab() {
  clearEl(body);
  const panel = createEl('div', 'tab-panel active');

  const header = createEl('div', 'panel-header', '', { style: 'text-align: center; padding-top: 24px;' });
  const iconDiv = createEl('div', '', '', { style: 'width: 80px; height: 80px; border-radius: 20px; background: linear-gradient(135deg, var(--accent), #6c5ce7); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 8px 24px rgba(0,122,255,0.3);' });
  iconDiv.appendChild(createSvg('<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M12 17.5a5.5 5.5 0 0 1-5.5-5.5h-1a5.5 5.5 0 1 1 11 0h-1a5.5 5.5 0 0 1-5.5 5.5z"/><path fill="white" d="M10.5 12h3v1.5h-3z"/></svg>'));
  header.appendChild(iconDiv);
  header.appendChild(createEl('h2', 'panel-title', 'Purple Ad Blocker', { style: 'font-size: 28px;' }));
  header.appendChild(createEl('p', 'panel-subtitle', `Version ${chrome.runtime.getManifest().version}`, { style: 'font-size: 16px;' }));
  panel.appendChild(header);

  // About section
  const aboutSection = createEl('section', 'section');
  aboutSection.appendChild(createEl('h3', 'section-title', 'About'));
  const grid = createEl('div', '', '', { style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;' });
  [
    { label: 'Manifest Version', value: chrome.runtime.getManifest().manifest_version },
    { label: 'Base Rules', value: '100+ domains' },
    { label: 'Filter Lists', value: '5 supported' },
    { label: 'Custom Rules', value: 'Unlimited' }
  ].forEach(item => {
    const card = createEl('div', '', '', { style: 'padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-md);' });
    card.appendChild(createEl('div', '', item.label, { style: 'font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;' }));
    card.appendChild(createEl('div', '', item.value, { style: 'font-weight: 600;' }));
    grid.appendChild(card);
  });
  aboutSection.appendChild(grid);
  panel.appendChild(aboutSection);

  // Features
  const featuresSection = createEl('section', 'section');
  featuresSection.appendChild(createEl('h3', 'section-title', 'Features'));
  const featuresList = createEl('ul', '', '', { style: 'list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;' });
  [
    '🛡️ Network-level ad & tracker blocking',
    '🎨 Cosmetic element hiding',
    '🎯 Interactive element zapper',
    '📊 Detailed statistics & analytics',
    '📋 Multiple filter list support (EasyList, EasyPrivacy, Fanboy, uBlock)',
    '⚙️ Custom blocking rules with ABP syntax',
    '✅ Per-site allowlist/exceptions',
    '🔄 Auto-updating filter lists',
    '📤 Import/Export settings',
    '🌙 Dark/Light/System theme support',
    '⌨️ Keyboard shortcuts (Alt+Shift+A/Z/S)',
    '🖱️ Right-click context menu integration'
  ].forEach(f => {
    const li = createEl('li', '', f, { style: 'padding: 12px 16px; background: var(--bg-tertiary); border-radius: var(--radius-md); font-size: 14px;' });
    featuresList.appendChild(li);
  });
  featuresSection.appendChild(featuresList);
  panel.appendChild(featuresSection);

  // Links
  const linksSection = createEl('section', 'section');
  linksSection.appendChild(createEl('h3', 'section-title', 'Links'));
  const linksDiv = createEl('div', '', '', { style: 'display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;' });
  linksDiv.appendChild(createEl('a', 'btn btn-secondary', 'Documentation', { href: '#', target: '_blank' }));
  linksDiv.appendChild(createEl('a', 'btn btn-secondary', 'GitHub', { href: 'https://github.com/purple-dev', target: '_blank' }));
  linksDiv.appendChild(createEl('a', 'btn btn-outline', 'Report Issue', { href: '#', target: '_blank' }));
  linksDiv.appendChild(createEl('a', 'btn btn-outline', 'Privacy Policy', { href: '#', target: '_blank' }));
  linksSection.appendChild(linksDiv);
  panel.appendChild(linksSection);

  // Credits
  const creditsSection = createEl('section', 'section');
  creditsSection.appendChild(createEl('h3', 'section-title', 'Credits'));
  const credits = createEl('p', '', '', { style: 'color: var(--text-secondary); font-size: 14px; line-height: 1.8;' });
  credits.innerHTML = 'Created by <strong>purple-dev</strong>.<br>Built with Manifest V3 for Chrome, Edge, Brave, and Firefox.<br>Filter lists powered by <a href="https://easylist.to/" target="_blank" style="color: var(--accent);">EasyList</a>, <a href="https://github.com/uBlockOrigin/uAssets" target="_blank" style="color: var(--accent);">uBlock Origin</a>, and <a href="https://github.com/ryanbr/fanboy-adblock" target="_blank" style="color: var(--accent);">Fanboy\'s Lists</a>.<br>Icons from <a href="https://feathericons.com/" target="_blank" style="color: var(--accent);">Feather Icons</a>.';
  creditsSection.appendChild(credits);
  panel.appendChild(creditsSection);

  // Copyright
  const copyright = createEl('div', '', '© 2024 Purple Ad Blocker by purple-dev. Open source under MIT License.', { style: 'text-align: center; padding: 24px; color: var(--text-muted); font-size: 12px;' });
  panel.appendChild(copyright);

  body.appendChild(panel);
}

// Export/Import
async function exportSettings() {
  const data = await chrome.runtime.sendMessage({ type: 'EXPORT_SETTINGS' });
  downloadJSON(data, `adblocker-backup-${new Date().toISOString().split('T')[0]}.json`);
  showStatus('Settings exported', 'success');
}

async function importSettings(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    await chrome.runtime.sendMessage({ type: 'IMPORT_SETTINGS', data });
    showStatus('Settings imported successfully', 'success');
    await loadAllData();
    renderTab(currentTab);
  } catch (err) { showStatus('Failed to import: ' + err.message, 'error'); }
  e.target.value = '';
}

// Apply theme on load
function applySavedTheme() {
  const theme = settings.theme || 'system';
  applyTheme(theme);
}

// Back button handler
document.getElementById('backBtn')?.addEventListener('click', () => window.close());

// Start
applySavedTheme();
init();
