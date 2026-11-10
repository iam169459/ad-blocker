// Purple Ad Blocker - Popup Script
import { showStatus } from './utils.js';

const mainToggle = document.getElementById('mainToggle');
const statusText = document.getElementById('statusText');
const statTotal = document.getElementById('statTotal');
const statSession = document.getElementById('statSession');
const statPage = document.getElementById('statPage');
const filterListsEl = document.getElementById('filterLists');
const btnZapper = document.getElementById('btnZapper');
const btnAllowlist = document.getElementById('btnAllowlist');
const btnResetStats = document.getElementById('btnResetStats');
const btnSettings = document.getElementById('btnSettings');
const statusBar = document.getElementById('statusBar');

let currentTab = null;
let siteEnabled = true;

// Initialize
async function init() {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  // Load state
  await loadState();

  // Set up event listeners
  mainToggle.addEventListener('click', toggleProtection);
  btnZapper.addEventListener('click', openZapper);
  btnAllowlist.addEventListener('click', manageAllowlist);
  btnResetStats.addEventListener('click', resetStats);
  btnSettings.addEventListener('click', openSettings);

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.adblock_stats || changes.filterLists) {
      loadState();
    }
  });
}

async function loadState() {
  try {
    const [state, stats, filters] = await Promise.all([
      chrome.runtime.sendMessage({ type: 'GET_STATE' }),
      chrome.runtime.sendMessage({ type: 'GET_STATISTICS', timeRange: 'total' }),
      chrome.runtime.sendMessage({ type: 'GET_FILTER_LISTS' })
    ]);

    if (state) {
      updateMainToggle(state.enabled);
      siteEnabled = state.enabled;
    }

    if (stats) {
      statTotal.textContent = formatNumber(stats.totalBlocked);
      statSession.textContent = formatNumber(stats.sessionBlocked || 0);
    }

    // Get page-specific count
    if (currentTab) {
      const pageStats = await chrome.runtime.sendMessage({ type: 'GET_PAGE_STATS', tabId: currentTab.id });
      if (pageStats) {
        statPage.textContent = formatNumber(pageStats.count);
      }
    }

    if (filters) {
      renderFilterLists(filters);
    }
  } catch (err) {
    console.error('Failed to load state:', err);
  }
}

function updateMainToggle(enabled) {
  siteEnabled = enabled;
  mainToggle.classList.toggle('active', enabled);
  statusText.textContent = enabled ? 'Active on this site' : 'Disabled on this site';
  mainToggle.setAttribute('aria-label', enabled ? 'Disable ad blocking' : 'Enable ad blocking');
}

async function toggleProtection() {
  const newState = !siteEnabled;
  try {
    await chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: newState });
    updateMainToggle(newState);
    showStatus(newState ? 'Protection enabled' : 'Protection disabled', 'success');
  } catch (err) {
    showStatus('Failed to toggle protection', 'error');
  }
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function renderFilterLists(filters) {
  filterListsEl.innerHTML = filters.map(filter => `
    <div class="filter-item">
      <div class="filter-info">
        <span class="filter-name">${filter.name}</span>
        <span class="filter-desc">${filter.description} ${filter.enabled ? `• ${filter.ruleCount.toLocaleString()} rules` : '• Disabled'}</span>
      </div>
      <button class="filter-toggle ${filter.enabled ? 'active' : ''}" data-list="${filter.id}" aria-label="${filter.enabled ? 'Disable' : 'Enable'} ${filter.name}"></button>
    </div>
  `).join('');

  filterListsEl.querySelectorAll('.filter-toggle').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const listId = e.currentTarget.dataset.list;
      const isActive = e.currentTarget.classList.contains('active');
      try {
        await chrome.runtime.sendMessage({ type: 'TOGGLE_FILTER_LIST', listId, enabled: !isActive });
        e.currentTarget.classList.toggle('active');
        showStatus(`${isActive ? 'Disabled' : 'Enabled'} ${listId}`, 'success');
      } catch (err) {
        showStatus('Failed to toggle filter list', 'error');
      }
    });
  });
}

async function openZapper() {
  if (!currentTab) return;
  try {
    await chrome.runtime.sendMessage({ type: 'OPEN_ZAPPER', tabId: currentTab.id });
    window.close();
  } catch (err) {
    showStatus('Failed to open zapper', 'error');
  }
}

function manageAllowlist() {
  chrome.runtime.openOptionsPage();
  window.close();
}

async function resetStats() {
  try {
    await chrome.runtime.sendMessage({ type: 'RESET_STATISTICS' });
    statTotal.textContent = '0';
    statSession.textContent = '0';
    statPage.textContent = '0';
    showStatus('Statistics reset', 'success');
  } catch (err) {
    showStatus('Failed to reset stats', 'error');
  }
}

function openSettings() {
  chrome.runtime.openOptionsPage();
  window.close();
}

init();