// SecHeaders Pro - Background Service Worker
// Captures live HTTP response headers and broadcasts real-time updates when switching tabs or viewing new pages without any manual refresh.

const tabHeadersMap = new Map();

// 1. Listen for HTTP response headers across all URLs
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.type === "main_frame") {
      const headerObj = {};
      const rawHeaders = details.responseHeaders || [];
      
      for (const header of rawHeaders) {
        const name = header.name.toLowerCase();
        if (headerObj[name]) {
          headerObj[name] += ` | ${header.value || header.binaryValue}`;
        } else {
          headerObj[name] = header.value || header.binaryValue || "";
        }
      }

      const tabData = {
        url: details.url,
        statusCode: details.statusCode,
        statusLine: details.statusLine,
        timestamp: Date.now(),
        headers: headerObj,
        rawHeaders: rawHeaders
      };

      tabHeadersMap.set(details.tabId, tabData);

      // Broadcast live update immediately to open Side Panel / Popup without page or panel refresh
      chrome.runtime.sendMessage({
        action: "headersUpdated",
        tabId: details.tabId,
        data: tabData
      }).catch(() => { /* Side panel/popup not open, ignore */ });
    }
  },
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["responseHeaders"]
);

// 2. Auto-trigger scan immediately when switching active tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tabId = activeInfo.tabId;
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab && tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("edge://") && !tab.url.startsWith("about:")) {
      let data = tabHeadersMap.get(tabId);
      if (!data) {
        // If tab was opened before extension loaded, fetch headers directly from background worker without refreshing active tab
        data = await fetchTabHeadersInBackground(tabId, tab.url);
      }
      if (data) {
        chrome.runtime.sendMessage({
          action: "tabChanged",
          tabId: tabId,
          data: data
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error("Error on tab switch:", err);
  }
});

// 3. Auto-trigger update when tab URL or navigation completes
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && !tab.url.startsWith("chrome://")) {
    let data = tabHeadersMap.get(tabId);
    if (!data || changeInfo.url) {
      data = await fetchTabHeadersInBackground(tabId, tab.url);
    }
    if (data) {
      chrome.runtime.sendMessage({
        action: "headersUpdated",
        tabId: tabId,
        data: data
      }).catch(() => {});
    }
  }
});

// 4. Background fetcher to get live headers without reloading the user's active webpage
async function fetchTabHeadersInBackground(tabId, url) {
  try {
    const response = await fetch(url, { method: "HEAD", cache: "no-store" });
    const headerObj = {};
    const rawHeaders = [];
    response.headers.forEach((val, key) => {
      headerObj[key.toLowerCase()] = val;
      rawHeaders.push({ name: key, value: val });
    });

    const tabData = {
      url: url,
      statusCode: response.status,
      statusLine: response.statusText,
      timestamp: Date.now(),
      headers: headerObj,
      rawHeaders: rawHeaders
    };

    tabHeadersMap.set(tabId, tabData);
    return tabData;
  } catch (err) {
    console.warn("Background HEAD check failed, attempting GET or fallback:", err);
    return null;
  }
}

// Clean up memory when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabHeadersMap.delete(tabId);
});

// Allow clicking action icon to open Side Panel
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error("Error setting side panel behavior:", error));
  }
});

// Handle direct requests from sidepanel.js when opened
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTabHeaders") {
    const tabId = request.tabId;
    
    if (tabId && tabHeadersMap.has(tabId)) {
      sendResponse({ status: "success", data: tabHeadersMap.get(tabId) });
    } else if (request.url && !request.url.startsWith("chrome://")) {
      // Perform background fetch instantly so user does NOT have to refresh
      fetchTabHeadersInBackground(tabId, request.url).then((data) => {
        if (data) {
          sendResponse({ status: "success", data: data });
        } else {
          sendResponse({ status: "not_cached", tabId: tabId });
        }
      });
      return true; // Keep message channel open for async response
    } else {
      sendResponse({ status: "not_cached", tabId: tabId });
    }
    return true;
  }
});
