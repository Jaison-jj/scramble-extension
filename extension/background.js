
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      console.log("background.js running...");
      if (tab.url && tab.url.includes("login")) {
        chrome.windows.getAll({ populate: true }, function (windows) {
          let popupFound = false;
          for (let window of windows) {
            if (window.type === "popup") { // Check for existing popups
              popupFound = true;
              break;
            }
          }
          if (!popupFound) {
            chrome.windows.create({
              url: "popup.html",
              type: "popup",
              width: 400,
              height: 300
            },(window)=>{
                debugger
                chrome.scripting.executeScript({ // Inject content.js on popup creation
                    target: { tabId: window.tabs[0].id }, // Target the first tab in the popup window
                    files: ['content.js']
                  });
            })
          }
        });
      }
    }
  });
  

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('fieldsFilled event called')
    if (request.message === "fieldsFilled") { // Check for specific message
      chrome.windows.getAll({ populate: true }, function (windows) {
        for (let window of windows) {
          if (window.type === "popup") { // Find the popup window
            chrome.windows.remove(window.id); // Close the popup window
            // break; // Close only the first popup found
          }
        }
      });
    }
  });