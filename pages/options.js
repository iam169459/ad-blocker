// Purple Ad Blocker - Options Script
import { showStatus, escapeHtml } from './utils.js';

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

// Initialize
async function init() {
  // Load all data
  await loadAllData();

  // Render navigation
  renderNav();

  // Render initial tab
  renderTab(currentTab);

  // Event listeners
  btnExport.addEventListener('click', exportSettings);
  btnImport.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', importSettings);

  // Listen for storage changes
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
  nav.innerHTML = TABS.map(tab => `
    <button class="nav-item ${tab.id === currentTab ? 'active' : ''}" data-tab="${tab.id}" aria-label="${tab.label}">
      ${tab.icon}
      <span>${tab.label}</span>
    </button>
  `).join('');

  nav.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
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
  body.innerHTML = `
    <div class="tab-panel active">
      <div class="panel-header">
        <h2 class="panel-title">General</h2>
        <p class="panel-subtitle">Configure core ad blocking behavior</p>
      </div>

      <section class="section">
        <h3 class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
          Protection
        </h3>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Enable Ad Blocking</div>
            <div class="setting-desc">Block ads, trackers, and malware on all websites</div>
          </div>
          <button class="toggle-switch ${settings.enabled !== false ? 'active' : ''}" data-setting="enabled" aria-label="Enable ad blocking"></button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Cosmetic Filtering</div>
            <div class="setting-desc">Hide ad elements on pages (element hiding)</div>
          </div>
          <button class="toggle-switch ${settings.cosmeticFiltering !== false ? 'active' : ''}" data-setting="cosmeticFiltering" aria-label="Enable cosmetic filtering"></button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Element Zapper</div>
            <div class="setting-desc">Click elements on pages to block or hide them</div>
          </div>
          <button class="toggle-switch ${settings.elementZapper !== false ? 'active' : ''}" data-setting="elementZapper" aria-label="Enable element zapper"></button>
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 0 0 3 11.21a9 9 0 0 1 0 15.58A9 9 0 0 1 12.79 21 7 7 0 0 0 21 12.79z"/></svg>
          Blocking Options
        </h3>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Block Ads</div>
            <div class="setting-desc">Block advertisement content</div>
          </div>
          <button class="toggle-switch ${settings.blockAds !== false ? 'active' : ''}" data-setting="blockAds"></button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Block Trackers</div>
            <div class="setting-desc">Block tracking scripts and pixels</div>
          </div>
          <button class="toggle-switch ${settings.blockTrackers !== false ? 'active' : ''}" data-setting="blockTrackers"></button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Block Malware Domains</div>
            <div class="setting-desc">Block known malware and phishing domains</div>
          </div>
          <button class="toggle-switch ${settings.blockMalware ? 'active' : ''}" data-setting="blockMalware"></button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Block Annoyances</div>
            <div class="setting-desc">Block cookie notices, newsletter popups, etc.</div>
          </div>
          <button class="toggle-switch ${settings.blockAnnoyances ? 'active' : ''}" data-setting="blockAnnoyances"></button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Block Third-Party Requests</div>
            <div class="setting-desc">Block all third-party network requests (may break sites)</div>
          </div>
          <button class="toggle-switch ${settings.blockThirdParty ? 'active' : ''}" data-setting="blockThirdParty"></button>
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          Appearance & Behavior
        </h3>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Theme</div>
            <div class="setting-desc">Choose color theme</div>
          </div>
          <select class="select" data-setting="theme" style="width: auto; min-width: 140px;">
            <option value="system" ${settings.theme === 'system' ? 'selected' : ''}>System</option>
            <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
            <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
          </select>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Show Badge Count</div>
            <div class="setting-desc">Display blocked count on extension icon</div>
          </div>
          <button class="toggle-switch ${settings.showBadge !== false ? 'active' : ''}" data-setting="showBadge"></button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Show Notifications</div>
            <div class="setting-desc">Show desktop notifications for important events</div>
          </div>
          <button class="toggle-switch ${settings.showNotifications ? 'active' : ''}" data-setting="showNotifications"></button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Log Blocked Requests</div>
            <div class="setting-desc">Keep detailed log of blocked requests for statistics</div>
          </div>
          <button class="toggle-switch ${settings.logRequests !== false ? 'active' : ''}" data-setting="logRequests"></button>
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Auto-Update
        </h3>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Auto-Update Filter Lists</div>
            <div class="setting-desc">Automatically download latest filter lists daily</div>
          </div>
          <button class="toggle-switch ${settings.autoUpdateFilters !== false ? 'active' : ''}" data-setting="autoUpdateFilters"></button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Last Update</div>
            <div class="setting-desc">${filterLists.length > 0 ? new Date(Math.max(...filterLists.map(f => f.lastUpdated || 0))).toLocaleString() : 'Never'}</div>
          </div>
          <button class="btn btn-secondary" id="btnUpdateNow">Update Now</button>
        </div>
      </section>
    </div>
  `;

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

// Filters Tab
function renderFiltersTab() {
  body.innerHTML = `
    <div class="tab-panel active">
      <div class="panel-header">
        <h2 class="panel-title">Filter Lists</h2>
        <p class="panel-subtitle">Manage filter list subscriptions</p>
      </div>

      <section class="section">
        ${filterLists.length === 0 ? `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <h3>No filter lists loaded</h3>
            <p>Filter lists will appear here after first update</p>
          </div>
        ` : filterLists.map(filter => `
          <div class="filter-item">
            <div class="filter-main">
              <div class="filter-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <div class="filter-details">
                <div class="filter-name">${escapeHtml(filter.name)}</div>
                <div class="filter-meta">
                  ${filter.ruleCount.toLocaleString()} rules •
                  ${filter.lastUpdated ? 'Updated ' + new Date(filter.lastUpdated).toLocaleDateString() : 'Never updated'} •
                  ${filter.description}
                </div>
              </div>
            </div>
            <div class="filter-actions">
              <span class="filter-status ${filter.enabled ? '' : 'inactive'}">
                ${filter.enabled ? '✓ Enabled' : '✗ Disabled'}
              </span>
              <button class="toggle-switch ${filter.enabled ? 'active' : ''}" data-filter="${filter.id}" aria-label="${filter.enabled ? 'Disable' : 'Enable'} ${filter.name}"></button>
            </div>
          </div>
        `).join('')}
      </section>

      </section>

      <section class="section">
        <h3 class="section-title">Update Source</h3>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Secure GitHub Updates</div>
            <div class="setting-desc">Filter lists are automatically updated from a secure, hardcoded GitHub repository. The update URL cannot be changed for security.</div>
          </div>
          <span class="filter-status" style="background: var(--success); color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">✓ Active</span>
        </div>
      </section>
    </div>
  `;

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
  body.innerHTML = `
    <div class="tab-panel active">
      <div class="panel-header">
        <h2 class="panel-title">Custom Rules</h2>
        <p class="panel-subtitle">Create your own blocking rules</p>
      </div>

      <section class="section">
        <h3 class="section-title">Add Rule</h3>
        <div class="form-group">
          <label>Rule Type</label>
          <select class="select" id="ruleType">
            <option value="block">Block Request</option>
            <option value="hide">Hide Element (Cosmetic)</option>
            <option value="allow">Allow (Exception)</option>
            <option value="redirect">Redirect</option>
            <option value="upgrade">Upgrade to HTTPS</option>
          </select>
        </div>
        <div class="form-group">
          <label>Pattern (URL filter or CSS selector)</label>
          <input type="text" class="input" id="rulePattern" placeholder="||example.com^ or .ad-banner" />
          <p class="hint">Use AdBlock Plus syntax for network filters, CSS selectors for cosmetic filters</p>
        </div>
        <div class="form-group" id="ruleDomainsGroup" style="display: none;">
          <label>Domains (comma-separated, optional)</label>
          <input type="text" class="input" id="ruleDomains" placeholder="example.com, another.com" />
          <p class="hint">Limit rule to specific domains (for network filters)</p>
        </div>
        <div class="form-group" id="ruleRedirectGroup" style="display: none;">
          <label>Redirect URL</label>
          <input type="url" class="input" id="ruleRedirect" placeholder="https://example.com/blank.png" />
        </div>
        <button class="btn btn-primary" id="btnAddRule">Add Rule</button>
      </section>

      <section class="section">
        <h3 class="section-title">Your Rules (${customRules.length})</h3>
        ${customRules.length === 0 ? `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            <h3>No custom rules yet</h3>
            <p>Create rules to block specific content or allow exceptions</p>
          </div>
        ` : `
          <div class="rule-list" id="ruleList">
            ${customRules.map(rule => `
              <div class="rule-item" data-id="${rule.id}">
                <span class="rule-type">${rule.type}</span>
                <span class="rule-pattern">${escapeHtml(rule.pattern)}</span>
                ${rule.domains ? `<span class="rule-pattern" style="color: var(--text-secondary); font-size: 11px;">@ ${escapeHtml(rule.domains.join(', '))}</span>` : ''}
                <div class="rule-actions">
                  <button class="btn btn-ghost btn-delete-rule" data-id="${rule.id}" title="Delete" aria-label="Delete rule">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </section>
    </div>
  `;

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
      if (!pattern) {
        showStatus('Please enter a pattern', 'error');
        return;
      }

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
  body.innerHTML = `
    <div class="tab-panel active">
      <div class="panel-header">
        <h2 class="panel-title">Allowlist</h2>
        <p class="panel-subtitle">Domains where ad blocking is disabled</p>
      </div>

      <section class="section">
        <h3 class="section-title">Add to Allowlist</h3>
        <div class="form-group">
          <label>Domain</label>
          <input type="text" class="input" id="allowlistDomain" placeholder="example.com" />
          <p class="hint">Enter a domain to disable ad blocking on that site</p>
        </div>
        <button class="btn btn-primary" id="btnAddAllowlist">Add Domain</button>
      </section>

      <section class="section">
        <h3 class="section-title">Allowlisted Domains (${allowlist.length})</h3>
        ${allowlist.length === 0 ? `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <h3>No allowlisted domains</h3>
            <p>Add domains where you want to allow ads</p>
          </div>
        ` : `
          <div class="allowlist-list" id="allowlistList">
            ${allowlist.map(item => `
              <div class="allowlist-item" data-domain="${escapeHtml(item.domain)}">
                <span class="allowlist-domain">${escapeHtml(item.domain)}</span>
                <span class="rule-type">${item.type || 'domain'}</span>
                <div class="rule-actions">
                  <button class="btn btn-ghost btn-remove-allowlist" data-domain="${escapeHtml(item.domain)}" title="Remove" aria-label="Remove from allowlist">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </section>

      <section class="section">
        <h3 class="section-title">Quick Actions</h3>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <button class="btn btn-secondary" id="btnAllowCurrentSite">Allow Current Site</button>
          <button class="btn btn-outline" id="btnClearAllowlist">Clear All</button>
        </div>
      </section>
    </div>
  `;

  // Add to allowlist
  const btnAddAllowlist = document.getElementById('btnAddAllowlist');
  const allowlistDomain = document.getElementById('allowlistDomain');

  if (btnAddAllowlist) {
    btnAddAllowlist.addEventListener('click', async () => {
      const domain = allowlistDomain.value.trim().toLowerCase();
      if (!domain) {
        showStatus('Please enter a domain', 'error');
        return;
      }

      try {
        await chrome.runtime.sendMessage({ type: 'ADD_TO_ALLOWLIST', domain, type: 'domain' });
        showStatus(`Added ${domain} to allowlist`, 'success');
        allowlistDomain.value = '';
        await loadAllowlist();
      } catch (err) {
        showStatus('Failed to add domain', 'error');
      }
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
      } catch (err) {
        showStatus('Failed to remove domain', 'error');
      }
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
        } catch (err) {
          showStatus('Failed to add domain', 'error');
        }
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
  const total = statistics.totalBlocked || 0;
  const byType = statistics.byType || {};
  const byDomain = statistics.byDomain || {};
  const topDomains = Object.entries(byDomain)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  body.innerHTML = `
    <div class="tab-panel active">
      <div class="panel-header">
        <h2 class="panel-title">Statistics</h2>
        <p class="panel-subtitle">Detailed blocking statistics</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${total.toLocaleString()}</div>
          <div class="stat-label">Total Blocked</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Object.values(byType).reduce((a, b) => a + b, 0).toLocaleString()}</div>
          <div class="stat-label">Network Requests</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Object.keys(byDomain).length}</div>
          <div class="stat-label">Domains Blocked</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${statistics.firstRun ? Math.ceil((Date.now() - statistics.firstRun) / 86400000) : 0}</div>
          <div class="stat-label">Days Active</div>
        </div>
      </div>

      <section class="section">
        <h3 class="section-title">Blocked by Type</h3>
        <div class="rule-list">
          ${Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => `
            <div class="rule-item">
              <span class="rule-pattern">${escapeHtml(type)}</span>
              <span class="rule-type" style="background: var(--accent-light); color: var(--accent);">${count.toLocaleString()}</span>
            </div>
          `).join('') || '<div class="empty-state"><p>No data yet</p></div>'}
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">Top Blocked Domains</h3>
        <div class="rule-list">
          ${topDomains.length > 0 ? topDomains.map(([domain, count]) => `
            <div class="rule-item">
              <span class="rule-pattern">${escapeHtml(domain)}</span>
              <span class="rule-type" style="background: var(--danger-light); color: var(--danger);">${count.toLocaleString()}</span>
              <div class="rule-actions">
                <button class="btn btn-ghost btn-allow-domain" data-domain="${escapeHtml(domain)}" title="Allow this domain">Allow</button>
              </div>
            </div>
          `).join('') : '<div class="empty-state"><p>No domains blocked yet</p></div>'}
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">Timeline (Last 30 Days)</h3>
        <div style="height: 200px; display: flex; align-items: end; gap: 4px; padding: 16px 0;">
          ${Object.entries(statistics.timeline || {})
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-30)
            .map(([date, count]) => {
              const max = Math.max(...Object.values(statistics.timeline || {}), 1);
              const height = (count / max) * 180;
              return `<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                <div style="width: 100%; height: ${height}px; background: var(--accent); border-radius: 2px 2px 0 0; transition: height 0.3s;"></div>
                <span style="font-size: 10px; color: var(--text-muted);">${date.slice(5)}</span>
              </div>`;
            }).join('')}
        </div>
      </section>

      <section class="section">
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button class="btn btn-danger" id="btnResetStats">Reset All Statistics</button>
          <button class="btn btn-outline" id="btnExportStats">Export Data</button>
        </div>
      </section>
    </div>
  `;

  // Allow domain from stats
  body.querySelectorAll('.btn-allow-domain').forEach(btn => {
    btn.addEventListener('click', async () => {
      const domain = btn.dataset.domain;
      try {
        await chrome.runtime.sendMessage({ type: 'ADD_TO_ALLOWLIST', domain, type: 'domain' });
        showStatus(`Added ${domain} to allowlist`, 'success');
        await loadAllowlist();
      } catch (err) {
        showStatus('Failed to allow domain', 'error');
      }
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
        } catch (err) {
          showStatus('Failed to reset statistics', 'error');
        }
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
  body.innerHTML = `
    <div class="tab-panel active">
      <div class="panel-header">
        <h2 class="panel-title">Advanced</h2>
        <p class="panel-subtitle">Advanced configuration options</p>
      </div>

      <section class="section">
        <h3 class="section-title">Experimental Features</h3>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Advanced Mode</div>
            <div class="setting-desc">Enable advanced settings and debug features</div>
          </div>
          <button class="toggle-switch ${settings.advancedMode ? 'active' : ''}" data-setting="advancedMode"></button>
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">Privacy Protection</h3>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Block WebRTC</div>
            <div class="setting-desc">Prevent WebRTC IP leaks (may affect video calls)</div>
          </div>
          <button class="toggle-switch ${settings.blockWebRTC ? 'active' : ''}" data-setting="blockWebRTC"></button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Block Fingerprinting</div>
            <div class="setting-desc">Block canvas, audio, and battery fingerprinting</div>
          </div>
          <button class="toggle-switch ${settings.blockFingerprinting ? 'active' : ''}" data-setting="blockFingerprinting"></button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Block CSP Reports</div>
            <div class="setting-desc">Block Content Security Policy violation reports</div>
          </div>
          <button class="toggle-switch ${settings.blockCSPReports ? 'active' : ''}" data-setting="blockCSPReports"></button>
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">Debug & Development</h3>
        <div class="form-group">
          <label>Debug Log Level</label>
          <select class="select" id="debugLevel">
            <option value="none" ${settings.debugLevel === 'none' ? 'selected' : ''}>None</option>
            <option value="error" ${settings.debugLevel === 'error' ? 'selected' : ''}>Errors Only</option>
            <option value="warn" ${settings.debugLevel === 'warn' ? 'selected' : ''}>Warnings</option>
            <option value="info" ${settings.debugLevel === 'info' ? 'selected' : ''}>Info</option>
            <option value="debug" ${settings.debugLevel === 'debug' ? 'selected' : ''}>Debug</option>
          </select>
        </div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
          <button class="btn btn-secondary" id="btnViewLogs">View Console Logs</button>
          <button class="btn btn-outline" id="btnClearLogs">Clear Logs</button>
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">Danger Zone</h3>
        <p style="color: var(--text-secondary); margin-bottom: 16px; font-size: 14px;">These actions are irreversible.</p>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <button class="btn btn-danger" id="btnResetAll">Reset All Settings</button>
          <button class="btn btn-outline" id="btnResetRules">Reset Custom Rules</button>
          <button class="btn btn-outline" id="btnResetAllowlist">Reset Allowlist</button>
        </div>
      </section>
    </div>
  `;

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
          } catch (err) {
            showStatus('Failed to reset', 'error');
          }
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
  const manifest = chrome.runtime.getManifest();
  body.innerHTML = `
    <div class="tab-panel active">
      <div class="panel-header" style="text-align: center; padding-top: 24px;">
        <div style="width: 80px; height: 80px; border-radius: 20px; background: linear-gradient(135deg, var(--accent), #6c5ce7); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 8px 24px rgba(0,122,255,0.3);">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M12 17.5a5.5 5.5 0 0 1-5.5-5.5h-1a5.5 5.5 0 1 1 11 0h-1a5.5 5.5 0 0 1-5.5 5.5z"/>
            <path fill="white" d="M10.5 12h3v1.5h-3z"/>
          </svg>
        </div>
        <h2 class="panel-title" style="font-size: 28px;">Purple Ad Blocker</h2>
        <p class="panel-subtitle" style="font-size: 16px;">Version ${manifest.version}</p>
      </div>

      <section class="section">
        <h3 class="section-title">About</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div style="padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-md);">
            <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Manifest Version</div>
            <div style="font-weight: 600;">${manifest.manifest_version}</div>
          </div>
          <div style="padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-md);">
            <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Base Rules</div>
            <div style="font-weight: 600;">100+ domains</div>
          </div>
          <div style="padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-md);">
            <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Filter Lists</div>
            <div style="font-weight: 600;">5 supported</div>
          </div>
          <div style="padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-md);">
            <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Custom Rules</div>
            <div style="font-weight: 600;">Unlimited</div>
          </div>
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">Features</h3>
        <ul style="list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
          ${[
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
          ].map(f => `<li style="padding: 12px 16px; background: var(--bg-tertiary); border-radius: var(--radius-md); font-size: 14px;">${f}</li>`).join('')}
        </ul>
      </section>

      <section class="section">
        <h3 class="section-title">Links</h3>
        <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
          <a href="https://github.com/purple-dev" class="btn btn-secondary" target="_blank">GitHub</a>
          <a href="https://github.com/purple-dev/issues" class="btn btn-outline" target="_blank">Report Issue</a>
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">Credits</h3>
        <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.8;">
          Created by <strong>purple-dev</strong>.<br>
          Built with Manifest V3 for Chrome, Edge, Brave, and Firefox.<br>
          Filter lists powered by <a href="https://easylist.to/" target="_blank" style="color: var(--accent);">EasyList</a>,
          <a href="https://github.com/uBlockOrigin/uAssets" target="_blank" style="color: var(--accent);">uBlock Origin</a>,
          and <a href="https://github.com/ryanbr/fanboy-adblock" target="_blank" style="color: var(--accent);">Fanboy's Lists</a>.<br>
          Icons from <a href="https://feathericons.com/" target="_blank" style="color: var(--accent);">Feather Icons</a>.
        </p>
      </section>

      <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 12px;">
        © 2024 Purple Ad Blocker by purple-dev. Open source under MIT License.
      </div>
    </div>
  `;
}

// Export/Import
async function exportSettings() {
  const data = await chrome.runtime.sendMessage({ type: 'EXPORT_SETTINGS' });
  downloadJSON(data, `adblocker-backup-${new Date().toISOString().split('T')[0]}.json`);
  showStatus('Settings exported', 'success');
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
  } catch (err) {
    showStatus('Failed to import: ' + err.message, 'error');
  }
  e.target.value = '';
}

// Apply theme on load
function applySavedTheme() {
  const theme = settings.theme || 'system';
  applyTheme(theme);
}

// Start
applySavedTheme();
init();