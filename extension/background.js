
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      console.log("background.js running...");
      if (tab.url && tab.url.includes("demoguest.com/hr")) {
        // debugger
        let queryOptions = { active: true, lastFocusedWindow: true };
        let [tab] = await chrome.tabs.query(queryOptions);


        await chrome.windows.getAll({ populate: true }, function (windows) {
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
              width: tab.width,
              height: tab.height-36,
              top:190
            },(window)=>{
                // chrome.windows.update(window.id, {
                //   width: 'screen.availWidth',
                //   height: 'screen.availHeight'
                // });
            })
          }
        });
      }
    }
  });


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('fieldsFilled event called')
    if (request.message === "fieldsFilled") { // message sent from content.js
      chrome.windows.getAll({ populate: true }, function (windows) {
        for (let window of windows) {
          if (window.type === "popup") { 
            chrome.windows.remove(window.id); 
            // break; // Close only the first popup found
          }
        }
      });
    }
  });