function highlightClaims() {
  chrome.runtime.sendMessage('highlightClaims')
}

document.getElementById('highlight-claims').addEventListener('click', highlightClaims);