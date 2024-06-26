function sendMessage(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        console.log("background.js running...");
        if (tab.url && tab.url.includes("/login")) {
            console.log("/login");

            chrome.runtime.sendMessage({ activatePopup: true });

        }
    }

}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.activatePopup) {
        console.log("Popup activated!");
        document.getElementById("message").innerText = "Google search detected!";
    }
});


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url.includes('/login')) {
      chrome.windows.create({
        url: "popup.html",
        type: "popup",
        focused: true,
        width: 400,
        height: 300,
        top: 0,
        left: 0
      });
    }
  });
  