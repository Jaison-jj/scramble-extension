import {
  COOKIE_URL,
  COOKIE_NAME,
  INJECTION_PAGE_URL,
  CRED_BASE_URL,
} from "./config.js";

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
  chrome.cookies.get({ url: COOKIE_URL, name: COOKIE_NAME }, (cookie) => {
    if (cookie) {
      chrome.action.setIcon({ path: SCR_ONLINE });
    } else {
      chrome.action.setIcon({ path: SCR_OFFLINE });
    }
  });
}

updateIconBasedOnCookie();

//optional
chrome.tabs.onUpdated.addListener(updateIconBasedOnCookie);
chrome.action.onClicked.addListener(updateIconBasedOnCookie);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openWebsite") {
    chrome.tabs.create({ url: `${COOKIE_URL}/dem` });
  }
});

chrome.manifest = chrome.runtime.getManifest();

async function executeScriptBeforeSendingMessage(tab) {
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"],
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "popupOpened") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      const hasCookie = false;

      chrome.storage.local.get("scrambleUser", async (data) => {
        if (data.scrambleUser) {
          chrome.runtime.sendMessage({ action: "hide_loader" });
          await chrome.runtime.sendMessage({
            action: "hide_loader_fill_fields",
            user: data.scrambleUser,
          });
          return;
        } else {
          if (!tab || tab.url !== INJECTION_PAGE_URL) {
            chrome.runtime.sendMessage({ action: "hide_loader" });
            return;
          }

          chrome.cookies.get(
            {
              url: COOKIE_URL,
              name: COOKIE_NAME,
            },
            async (cookie) => {
              if (cookie) {
                executeScriptBeforeSendingMessage(tab);
                chrome.runtime.sendMessage({ action: "show_loader" });

                await fetch(
                  `${CRED_BASE_URL}/api/v1/lid/start-session/ZGVtfHxsZGFwYXBwMQ`,
                  {
                    method: "post",
                    credentials: "include",
                  }
                )
                  .then((response) => response.json())
                  .then(async (data) => {
                    executeScriptBeforeSendingMessage(tab);
                    await chrome.storage.local.set({ scrambleUser: data.user });
                    await chrome.tabs.sendMessage(tab.id, {
                      action: "retrieve-user",
                      user: data.user,
                      errorCode: data.errorCode,
                      resultCode: data.resultCode,
                    });
                    await chrome.runtime.sendMessage({
                      action: "hide_loader_fill_fields",
                      user: data.user,
                    });
                    hasCookie = true;
                  })
                  .catch((error) => {
                    // console.error("Error fetching data:", error);
                  });
              } else {
                executeScriptBeforeSendingMessage(tab);
                chrome.runtime.sendMessage({ action: "show_error" });
              }
            }
          );
        }
      });
    });
  }
});
