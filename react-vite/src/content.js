const [navEntry] = performance.getEntriesByType("navigation");

chrome.storage.local
  .get(["lastActiveTab", "autoPopupEnabledUrl"])
  .then(({ lastActiveTab, autoPopupEnabledUrl }) => {
    if (
      navEntry &&
      navEntry.type === "reload" &&
      autoPopupEnabledUrl === lastActiveTab.url
    ) {
      chrome.runtime.sendMessage({ action: "appPageReloaded" });
    }
  });
