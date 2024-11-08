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

/**
 The extension can access cookies if the right permissions are set.
the extension should have permission for cookies
the extension should have host_permission of the site (this ensures extension can access cookies for specific domains)
cookies marked with HttpOnly attribute extension and sites wont be able to read it
cookies marked with SameSite=Strict attribute the extension wont be able to read it
cookies marked with Secure attribute will be only accessible via HTTPS, so the extension should be running on a secure connection
If the extension to catch cookies on incognito mode, "incognito": "spanning" permission is need to be set to the extension
 */

//REQUIREMENT #2
/**
 * If there is no cookie take the user to the site t login
 * if there is no cookie show red icon
 * when cookie is found show green icon
 * when clicked on the green icon call the api with the cookie
 * set the fields with the response
 */

const ICON_WITH_COOKIE = "images/scrambleOnline16.png";
const ICON_NO_COOKIE = "images/scrambleOffline16.png";

function updateIconBasedOnCookie() {
  chrome.cookies.getAll(
    { url: "https://portal.qa.scrambleid.com", name: "scramble-session-dem" },
    (cookie) => {
      if (cookie) {
        // console.log(cookie);
        chrome.action.setIcon({ path: ICON_WITH_COOKIE });
        getDemoCredentials()
      } else {
        console.log("No cookie found. Setting default icon.");
        chrome.action.setIcon({ path: ICON_NO_COOKIE });
      }
    }
  );
}

updateIconBasedOnCookie();

//optional
// chrome.tabs.onUpdated.addListener(updateIconBasedOnCookie);
// chrome.action.onClicked.addListener(updateIconBasedOnCookie);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openWebsite") {
    chrome.tabs.create({ url: "https://portal.qa.scrambleid.com/dem" });
  }
});

function getDemoCredentials() {
  chrome.cookies.getAll(
    { url: "https://portal.qa.scrambleid.com" },
    (cookies) => {
      let cookieString = "";
      cookies.forEach((c) => {
        cookieString += `${c?.name}=${c?.value}; `;
      });

      // API CALL
      fetch("https://qa.scrambleid.com/api/v1/lid/start-session/ZGVtfHxsZGFwYXBwMQ", {
        method: "post",
        // headers: {
        //   Authorization: cookieString,
        // },
        credentials:"include"
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("data ", data);
          chrome.storage.sync.set({
            username: data.username,
            password: data.password,
          });
          return;
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: "autofill",
              username: data.username,
              password: data.password,
            });
          });
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    }
  );
}
