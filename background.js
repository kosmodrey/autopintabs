'use strict';

// Globals

const
  tabs = chrome.tabs,
  settings = localStorage,
  button = chrome.browserAction;

// Settings

function getSetting(id) {
  return settings[id] && JSON.parse(settings[id]);
}

function setSetting(id, data) {
  if (typeof data != 'string') data = JSON.stringify(data);
  return (settings[id] = data);
}

// Pin tab

function pinTab(tab) {
  if (!getSetting('enabled') || tab.pinned) return Promise.resolve(false);
  tabs.update(tab.id, { pinned: true });
  return Promise.resolve(tab);
}

// Unpin tab

function unpinTab(tab) {
  tabs.update(tab.id, { pinned: false });
}

// Update button

function updateButton() {
  if (getSetting('enabled') === undefined) setSetting('enabled', true);
  const text = getSetting('enabled') ? 'on' : 'off';
  button.setBadgeText({ text });
}

// Update tabs

function updateTabs() {
  const fn = getSetting('enabled') ? pinTab : unpinTab;
  tabs.query({}, tabs => {
    for (let tab of tabs) fn(tab);
  });
}

// On new tab

tabs.onCreated.addListener(tab => {
  pinTab(tab).then(is => {
    if (!is) return; 
    tabs.query({ 'active': true, 'currentWindow': true }, t => {
      tabs.move(tab.id, { index: ++t[0].index });
    });
  });
});

// On button click

button.onClicked.addListener(x => {
  setSetting('enabled', !getSetting('enabled'));
  updateButton();
  updateTabs();
});

// Update on init

updateButton();
updateTabs();
