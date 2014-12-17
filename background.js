var prefs = {'autorun': false,
             'ffUser': '',
            'sendPopupBehaviour': 'any-highlight'};

function getPrefs() {
  console.log('getPrefs ran');
  chrome.storage.sync.get({
    'autorun': false,
    'ffUser': '',
    'sendPopupBehaviour': 'any-highlight'
  }, function(items) {
    prefs.autorun = items.autorun;
    prefs.ffUser = items.ffUser;
    prefs.sendPopupBehaviour = items.sendPopupBehaviour;
  });
}

getPrefs();

chrome.runtime.onInstalled.addListener(function(details){
  console.log('extension installed');
  chrome.tabs.query({currentWindow: true}, function(tabs) {
    for(tab in tabs) {
      selectListen(tabs[tab].id);
    }
  });
});

chrome.storage.onChanged.addListener(function(changes, areaName) {
  for(change in changes) {
    prefs[change] = changes[change].newValue;
    if(change == 'sendPopupBehaviour') {
      chrome.tabs.query({currentWindow: true}, function(tabs) {
        for(tab in tabs) {
          if(changes[change].newValue != 'disabled') {
            selectListen(tabs[tab].id);
          }
          else {
            console.log('sendpopup has been disabled. Messaging tabs now');
            chrome.tabs.sendMessage(tabs[tab].id, {'message': 'stopListening'});
          }
        }
      });
    }
    if(change == 'ffUser') {
      chrome.tabs.query({currentWindow: true}, function(tabs) {
        for(tab in tabs) {
          chrome.tabs.sendMessage(tabs[tab].id, {'message': 'updateFfUser', 'ffUser': prefs.ffUser});
        }
      });
    }
  }
});

chrome.tabs.onUpdated.addListener(function(tabId, info) {
  if(info.status == 'complete') {
  // If plugin is on and tab is a web page set up the app
    console.log('Tab ready');
    if(prefs.sendPopupBehaviour != 'disabled') {
      selectListen(tabId, prefs.sendPopupBehaviour);
    }
    if(prefs.autorun) {
      console.log('autorun is true, calling highlightclaims');
      highlightClaims();
    }
  }
});

function selectListen(tabId) {
  console.log('select listen called in background.js');
  console.log('tabId: ' + String(tabId));
  console.log(prefs.sendPopupBehaviour);
  console.log(prefs.ffUser);
  chrome.tabs.sendMessage(tabId, {'message': 'selectListen', 'sendPopupBehaviour': prefs.sendPopupBehaviour, 'ffUser': prefs.ffUser});
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('message received by background.js');
  if(request == "highlightClaims") {
    highlightClaims();
  }
});

function highlightClaims() {
  console.log('highlightClaims called from background.js')
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {'message': 'highlightClaims'});
  });
}
