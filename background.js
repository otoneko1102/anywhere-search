chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle_search") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ["content.js"]
        }).then(() => {
          chrome.tabs.sendMessage(tabs[0].id, { action: "toggleSearch" });
        }).catch((err) => console.error("Script execution failed:", err));
      }
    });
  } else if (command === "toggle_popup") {
    chrome.action.openPopup();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openTab") {
    chrome.tabs.create({ url: message.url, active: false });
  } else if (message.action === "openShortcuts") {
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  }
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: `https://anywhere-search.commonjs.work/${chrome.i18n.getMessage("LangCode")}.html`, active: true });
  }

  if (details.reason === "update") {
    // chrome.tabs.create({ url: `https://anywhere-search.commonjs.work/${chrome.i18n.getMessage("LangCode")}.html`, active: true });
  }
});
