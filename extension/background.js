const cookieUrl = "https://portal.qa.scrambleid.com";
const cookieName = "scramble-session-dem";
const injectionPageUrl = "https://demoguest.com/qa/vdi";

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  console.log("background.js running...");
  if (changeInfo.status === "complete") {
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
          // return //bypassed for REQUIREMENT #2
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

const SCR_ONLINE = "assets/icons/online48.png";
const SCR_OFFLINE = "assets/icons/offline48.png";

function updateIconBasedOnCookie() {
  chrome.cookies.get(
    { url: cookieUrl, name: cookieName },
    (cookie) => {
      if (cookie) {
        chrome.action.setIcon({ path: SCR_ONLINE });
      } else {
        chrome.action.setIcon({ path: SCR_OFFLINE });
      }
    }
  );
}

updateIconBasedOnCookie();

//optional
chrome.tabs.onUpdated.addListener(updateIconBasedOnCookie);
chrome.action.onClicked.addListener(updateIconBasedOnCookie);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openWebsite") {
    chrome.tabs.create({ url: "https://portal.qa.scrambleid.com/dem" });
  }
});


async function detectDemoSiteAndSendMessage() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  if (tab && tab.url === "https://demoguest.com/vdi") {
    chrome.storage.sync.get(["username", "password"], (data) => {
      // chrome.tabs.sendMessage(tab.id, { action: "autofillDemoCred" });
    });
  }
  return tab;
}

// chrome.tabs.onActivated.addListener(detectDemoSiteAndSendMessage);

chrome.manifest = chrome.runtime.getManifest();

// chrome.tabs.onActivated.addListener(() => {
//   chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
//     const tab = tabs[0];
//     if (tab && tab.url === "https://demoguest.com/vdi") {
//       await chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         files: ["content.js"],
//       });

//       await chrome.tabs.sendMessage(tab.id, { greeting: "hello" });
//     }
//   });
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "popupOpened") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];

      if (!tab || tab.url !== injectionPageUrl) {
        chrome.runtime.sendMessage({ action: "hide_loader" });
        return;
      }

      chrome.cookies.get(
        {
          url: cookieUrl,
          name: cookieName,
        },
        async (cookie) => {
          if (cookie) {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["content.js"],
            });

            chrome.runtime.sendMessage({ action: "show_loader" });
            await fetch(
              "https://qa.scrambleid.com/api/v1/lid/start-session/ZGVtfHxsZGFwYXBwMQ",
              {
                method: "post",
                credentials: "include",
              }
            )
              .then((response) => response.json())
              .then(async (data) => {
                await chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  files: ["content.js"],
                });
                await chrome.tabs.sendMessage(tab.id, {
                  action: "retrieve-user",
                  user: data.user,
                  errorCode: data.errorCode,
                  resultCode: data.resultCode,
                });
                await chrome.runtime.sendMessage({
                  action: "hide_loader_and_close_popup",
                });
              })
              .catch((error) => {
                // console.error("Error fetching data:", error);
              });
          } else {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["content.js"],
            });
            chrome.runtime.sendMessage({ action: "show_error" });
          }
        }
      );
    });
  }
});
