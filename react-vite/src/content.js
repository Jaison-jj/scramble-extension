const [navEntry] = performance.getEntriesByType("navigation");

async function checkAndSendMessage() {
  const { lastActiveTab, autoPopupEnabledUrl } = await chrome.storage.local.get(
    ["lastActiveTab", "autoPopupEnabledUrl"]
  );

  if (
    navEntry &&
    navEntry.type === "reload"
    &&
    autoPopupEnabledUrl === lastActiveTab.url
  ) {
    chrome.runtime.sendMessage({ action: "appPageReloaded" });
  }
}

checkAndSendMessage();

document.addEventListener("DOMContentLoaded", async () => {
  await checkAndSendMessage();
});
