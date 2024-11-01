chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    console.log("background.js running...");
    if (tab.url && tab.url.includes("demoguest.com/hr")) {
      let queryOptions = { active: true, lastFocusedWindow: true };
      let [tab] = await chrome.tabs.query(queryOptions);

      await chrome.windows.getAll({ populate: true }, function (windows) {
        let popupFound = false;
        for (let window of windows) {
          if (window.type === "popup") {
            // Check for existing popups
            popupFound = true;
            break;
          }
        }
        if (!popupFound) {
          chrome.windows.create(
            {
              url: "popup.html",
              type: "popup",
              width: tab.width,
              height: tab.height - 36,
              top: 190,
            },
            (window) => {
              // chrome.windows.update(window.id, {
              //   width: 'screen.availWidth',
              //   height: 'screen.availHeight'
              // });
            }
          );
        }
      });
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("fieldsFilled event called");
  if (request.message === "fieldsFilled") {
    // message sent from content.js
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

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "getCookie") {
//     chrome.cookies.get(
//       {
//         url: "https://portal.qa.scrambleid.com/",
//         name: "scramble-session-dem",
//       },
//       (cookie) => {
//         if (cookie) {
//           sendResponse({ value: cookie.value });
//           console.log(cookie.value)
//         } else {
//           sendResponse({ value: null });
//         }
//       }
//     );
//     return true;
//   }
// });

/**
 The extention can access cookies if the right permissions are set.
the extention should have permission for cookies
the extention should have host_permission of the site (this ensures extention can access cookies for specific domains)
cookies marked with HttpOnly attribute extension and sites wont be able to read it
cookies marked with SameSite=Strict attribute the extension wont be able to read it
cookies marked with Secure attribute will be only accessible via HTTPS, so the extension should be running on a secure connection
If the extension to catch cookies on incognito mode, "incognito": "spanning" permission is need to be set to the extension
 */
