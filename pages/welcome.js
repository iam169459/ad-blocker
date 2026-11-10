// Welcome page script
document.getElementById('btnGetStarted').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
  window.close();
});