// Shared utilities for popup and options

export function showStatus(message, type = 'success') {
  const statusBar = document.getElementById('statusBar');
  if (!statusBar) return;

  statusBar.textContent = message;
  statusBar.className = `status-bar show ${type}`;

  setTimeout(() => {
    statusBar.classList.remove('show');
  }, 3000);
}

export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}