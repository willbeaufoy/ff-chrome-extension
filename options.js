console.log('options.js loaded');
// Saves options to chrome.storage
function save_options() {
  var autorun = document.getElementById('autorun').checked;
  var ffUser = document.getElementById('ffuser').value;
  var sendPopupBehaviour = document.querySelector('input[name="send-popup-behaviour"]:checked').value;
  chrome.storage.sync.set({
    autorun: autorun,
    ffUser: ffUser,
    sendPopupBehaviour: sendPopupBehaviour
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    autorun: false,
    ffUser: '',
    sendPopupBehaviour: 'any-highlight'
  }, function(items) {
    document.getElementById('autorun').checked = items.autorun;
    document.getElementById('ffuser').value = items.ffUser;
    document.getElementById(items.sendPopupBehaviour).checked = true;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);