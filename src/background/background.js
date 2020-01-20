global.browser = require('webextension-polyfill')

browser.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({isExtensionOn: 1});
});

function sendMsg2AllTab(message) {
  chrome.tabs.query({}, (tabs) => {
    for (let tab of tabs) {
      chrome.tabs.sendMessage(tab.id, message);
    }
  });
}

function toggleMode() {
  chrome.storage.local.get("isExtensionOn", (res) => {
    if (res.isExtensionOn == 1) {
      browser.browserAction.setIcon({path: "./icons/icon_48_gray.png"});
      chrome.storage.local.set({isExtensionOn: 0});
      sendMsg2AllTab({func: "toggleMode", data: {isEnabled: false}}) // disable content script
    } else {
      browser.browserAction.setIcon({path: "./icons/icon_48.png"});
      chrome.storage.local.set({isExtensionOn: 1});
      sendMsg2AllTab({func: "toggleMode", data: {isEnabled: true}}) // enable content script
    }
  });
}

browser.browserAction.onClicked.addListener(toggleMode);