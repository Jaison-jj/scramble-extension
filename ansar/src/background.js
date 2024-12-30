import { fetchUserCredentials, getQidOrDid } from "./backgroundUtils/api";

console.log("hello from sw!!");

const SCR_ONLINE = "assets/images/online48.png";
const SCR_OFFLINE = "assets/images/offline48.png";
let eventData;
let popupWindowId = null;
let popupOpenedSiteTab = null;
const autoPopupCheckUrls = [
  "https://demoguest.com/demo/vdi/ldap",
  "https://demoguest.com/demo/vdi/radius",
  "https://demoguest.com/ukg/ldap",
  "https://demoguest.com/ukg/radius",
  "https://demoguest.com/qa/ukg/ldap",
  "https://demoguest.com/qa/ukg/radius",
  "https://demoguest.com/demo/ukg/ldap",
  "https://demoguest.com/demo/ukg/radius",
  "https://demoguest.com/uat/ukg/ldap",
  "https://demoguest.com/uat/ukg/radius",
  "https://demoguest.com/prod/ukg/ldap",
  "https://demoguest.com/prod/ukg/radius",

  "https://demoguest.com/vdi/radius",
  "https://demoguest.com/vdi/ldap",
];

const checkUrlToOpenPopup = (tab) => {
  return autoPopupCheckUrls.some((url) => tab.url === url);
};

chrome.windows.onRemoved.addListener((wind) => {
  popupWindowId = null;
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    const { isAutoPopup } =
      (await chrome.storage.local.get("isAutoPopup")) || false;

    // popupOpenedSiteTab = tab;
    // console.log("here", tab)

    if (tab.url && checkUrlToOpenPopup(tab) && isAutoPopup) {
      // Close the existing popup if it exists
      if (popupWindowId) {
        chrome.windows.remove(popupWindowId, () => {
          popupWindowId = null;
        });
      }

      chrome.windows.getCurrent({ populate: true }, (currentWindow) => {
        const windowWidth = 356;
        const windowHeight = 597;

        const left =
          currentWindow.left +
          Math.floor((currentWindow.width - windowWidth) / 2);
        const top =
          currentWindow.top +
          Math.floor((currentWindow.height - windowHeight) / 2);

        chrome.windows.create(
          {
            url: "index.html",
            type: "popup",
            width: windowWidth,
            height: windowHeight,
            left: left,
            top: top,
          },
          (window) => {
            popupWindowId = window?.id || null;
            // chrome.runtime.sendMessage({
            //   action: "getExtensionWindowId",
            //   id: window.id,
            // });
          }
        );
      });
    }
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab?.url) {
      // popupOpenedSiteTab = tab;
      chrome.storage.local.set({ lastActiveTab: tab });
    }
  });
});

function updateIconBasedOnCookie() {
  chrome.cookies.get(
    {
      url: import.meta.env.VITE_CRED_BASE_URL,
      name: import.meta.env.VITE_COOKIE_NAME,
    },
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

let socket = null;

async function configureLogin() {
  const authCodeData = await getQidOrDid();

  chrome.storage.local.set({
    Auth: {
      scrambleState: authCodeData,
    },
  });

  const epochTime = Math.floor(Date.now() / 1000) * 1000;
  const wsUrl = `wss://wsp.${
    import.meta.env.VITE_SUBDOMAIN
  }.scrambleid.com/v1?action=PORTAL&qid=${authCodeData?.qid}&did=${
    authCodeData.did
  }&org=${authCodeData?.code}&epoch=${epochTime}&amznReqId=${
    authCodeData?.amznReqId
  }`;

  await establishWsConnection(wsUrl);

  await chrome.runtime.sendMessage({
    action: "transfer_auth_code",
    authCodeData,
  });
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "saveUserSettingForAutoPopup") {
    chrome.storage.local.set({ isAutoPopup: request.enableAuto });
    return;
  }

  if (request.action === "open_popup") {
    // console.log("currentTab", popupOpenedSiteTab);
    // console.log("canOpen", checkUrlToOpenPopup(popupOpenedSiteTab));

    // if (!checkUrlToOpenPopup(popupOpenedSiteTab)) {
    //   chrome.runtime.sendMessage({
    //     action: "unsupportedSite",
    //   });
    //   return;
    // }

    chrome.cookies.get(
      {
        url: import.meta.env.VITE_CRED_BASE_URL,
        name: import.meta.env.VITE_COOKIE_NAME,
      },
      async (cookie) => {
        if (!cookie || isCookieValueExpired(cookie)) {
          await chrome.storage.local.set({
            User: null,
          });
          await configureLogin();
          return;
        }
        const { User } = await chrome.storage.local.get("User");

        if (cookie && !isCookieValueExpired(cookie)) {
          fetchUserNew();
          return;
        }

        const endTime = await chrome.storage.local.get("endTime");
        const now = Date.now();
        const epochTime = Math.floor(Date.now() / 1000) * 1000;

        if (endTime) {
          if (endTime.endTime < now) {
            console.log("Start time expired");
            fetchUserNew();
            return;
          }
        }
      }
    );
    const { User } = await chrome.storage.local.get("User");

    if (User) {
      chrome.runtime.sendMessage({
        action: "userExistShowCreds",
        user: User,
      });
      return;
    }
    await configureLogin();
  }

  const {
    Auth: { scrambleState },
  } = await chrome.storage.local.get("Auth");

  if (request.action === "restart_qr_timer") {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message = {
        op: "QID",
        value: scrambleState.qid,
        org: scrambleState.code,
        source: "PORTAL",
        action: "PORTAL",
        amznReqId: scrambleState.amznReqId,
      };
      socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected or is in a wrong state.");
      await chrome.runtime.sendMessage({
        action: "error",
      });
      return;
    }
  }

  if (request.action === "restart_type_code_timer") {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message = {
        op: "DID",
        value: scrambleState.qid,
        org: scrambleState.code,
        source: "PORTAL",
        action: "PORTAL",
        amznReqId: scrambleState.amznReqId,
      };
      socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected or is in a wrong state.");
      await chrome.runtime.sendMessage({
        action: "error",
      });
    }
  }

  if (request.action === "switchCodeType") {
    const message = {
      op: request.codeType,
      value: scrambleState.qid,
      org: scrambleState.code,
      source: "PORTAL",
      action: "PORTAL",
      amznReqId: scrambleState.amznReqId,
    };
    socket.send(JSON.stringify(message));
  }

  if (request.action === "dropUserCreds") {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        console.error("Error clearing storage:", chrome.runtime.lastError);
      } else {
        console.log("Local storage cleared successfully.");
      }
    });
    chrome.cookies.remove(
      {
        url: import.meta.env.VITE_CRED_BASE_URL,
        name: import.meta.env.VITE_COOKIE_NAME,
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Error removing cookie:", chrome.runtime.lastError);
        } else {
          console.log("Cookie removed successfully.");
          updateIconBasedOnCookie();
        }
      }
    );
  }

  if (request.action === "resetToLogin") {
    await configureLogin();
  }
});

async function establishWsConnection(url) {
  socket = new WebSocket(url);

  const {
    Auth: { scrambleState },
  } = await chrome.storage.local.get("Auth");

  socket.addEventListener("open", () => {
    console.log("WebSocket connection established.");
  });

  socket.addEventListener("message", async (event) => {
    const wsIncomingMessage = JSON.parse(event.data);
    eventData = event;

    console.log("wsIncomingMessage,", wsIncomingMessage);

    if (wsIncomingMessage.op === "WaitForConfirm") {
      await chrome.runtime.sendMessage({
        action: "waitingForConfirmationFromMob",
        wsEvent: wsIncomingMessage,
      });
    }

    if (wsIncomingMessage.op === "PORTAL") {
      fetchUserCredentials(
        eventData,
        // popupOpenedSiteTab,
        updateIconBasedOnCookie,
        startTimerAlarm
      );
    }

    if (wsIncomingMessage.op === "QID") {
      await chrome.storage.local.set({
        Auth: {
          scrambleState: { ...scrambleState, qid: wsIncomingMessage.value },
        },
      });

      await chrome.runtime.sendMessage({
        action: "restartQrTimer",
        newQid: wsIncomingMessage.value,
        newCodeData: { ...scrambleState, qid: wsIncomingMessage.value },
      });
    }

    //this can cause message port disconnected error
    if (wsIncomingMessage.op === "DID") {
      //user has chosen typeCode
      await chrome.storage.local.set({
        Auth: {
          scrambleState: { ...scrambleState, did: wsIncomingMessage.value },
        },
      });

      await chrome.runtime.sendMessage({
        action: "restartTypeCodeTimer",
        newDid: wsIncomingMessage.value,
        newCodeData: { ...scrambleState, did: wsIncomingMessage.value },
      });
    }

    if (wsIncomingMessage.op === "validationCode") {
      await chrome.storage.local.set({
        Auth: {
          scrambleState: {
            ...scrambleState,
            did: JSON.stringify(wsIncomingMessage.value),
          },
        },
      });

      await chrome.runtime.sendMessage({
        action: "validationCodeReceived",
        newDid: wsIncomingMessage.value,
        newCodeData: {
          ...scrambleState,
          did: JSON.stringify(wsIncomingMessage.value),
        },
      });
    }

    if (wsIncomingMessage.op === "NO_CONSENT") {
      await chrome.runtime.sendMessage({
        action: "refreshCodeNoConsent",
      });
    }

    if (wsIncomingMessage.op === "refreshError") {
      await chrome.runtime.sendMessage({
        action: "error",
      });
    }
  });

  socket.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
  });

  socket.addEventListener("close", (event) => {
    console.warn(
      `WebSocket connection closed: Code=${event.code}, Reason=${event.reason}`
    );
  });
}

// const fetchUserCredentials = async () => {
//   const wsIncomingMessage = JSON.parse(eventData.data);

//   try {
//     await chrome.runtime.sendMessage({
//       action: "callingCredentialsApi",
//     });

//     const cookie = JSON.parse(wsIncomingMessage.value).cookie;
//     const cookieExpireAt = JSON.parse(wsIncomingMessage.value).expiresAt;

//     chrome.cookies.set(
//       {
//         url: import.meta.env.VITE_CRED_BASE_URL,
//         name: import.meta.env.VITE_COOKIE_NAME,
//         value: cookie,
//         expirationDate: cookieExpireAt,
//       },
//       async (cookie) => {
//         ///api/v1/lid/start-session/ZGVtfHxsZGFwYXBwMQ
//         if (cookie) {
//           console.log("Cookie set successfully:");
//           await fetch(
//             `${
//               import.meta.env.VITE_CRED_BASE_URL
//             }/api/v1/lid/start-session`,
//             {
//               method: "post",
//               credentials: "include",
//               body: JSON.stringify({
//                 appUrl: popupOpenedSiteTab?.url || null,
//               }),
//             }
//           )
//             .then(async (response) => {
//               if (!response.ok) {
//                 // throw new Error(
//                 //   `HTTP error! Status: ${response.status} ${response.statusText}`
//                 // );
//                 await chrome.runtime.sendMessage({
//                   action: "unsupportedSite",
//                 });
//                 return;
//                 //instead of throwing error show api failed ui,remove the cookie as well
//               }
//               return response.json();
//             })
//             .then(async (data) => {
//               // if (!data?.user) {
//               //   await chrome.runtime.sendMessage({
//               //     action: "error",
//               //   });
//               //   return;
//               // }

//               await chrome.runtime.sendMessage({
//                 action: "hideLoaderShowCredentials",
//                 user: data.user || "test",
//               });

//               await chrome.storage.local.set({
//                 User: data?.user || null,
//               });

//               updateIconBasedOnCookie();
//               startTimerAlarm(2);
//             })
//             .catch((err) => {
//               console.log("fetchUserCredentials", err);
//               //go to some error page
//             });
//         } else {
//           console.error("Error setting cookie");
//         }
//       }
//     );
//   } catch (err) {
//     console.log(err);
//   }
// };

const fetchUserNew = async () => {
  try {
    await chrome.runtime.sendMessage({
      action: "callingCredentialsApi",
    });

    await fetch(
      `${import.meta.env.VITE_CRED_BASE_URL}/api/v1/lid/start-session`,
      {
        method: "post",
        credentials: "include",
        body: JSON.stringify({
          appUrl: popupOpenedSiteTab.url || null,
        }),
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          // throw new Error(
          //   `HTTP error! Status: ${response.status} ${response.statusText}`
          // );
          await chrome.runtime.sendMessage({
            action: "unsupportedSite",
          });
          return;
        }
        return response.json();
      })
      .then(async (data) => {
        if (!data?.user) {
          // If API returns a cookie error, delete user and start login.
          await chrome.runtime.sendMessage({
            action: "dropUserCreds",
          });
          await configureLogin();
          return;
        }
        await chrome.runtime.sendMessage({
          action: "hideLoaderShowCredentials",
          user: data.user || "test",
        });
        await chrome.storage.local.set({
          User: data?.user || null,
        });

        updateIconBasedOnCookie();
        startTimerAlarm(2);
      })
      .catch((err) => {
        console.error("fetchUserNew", err);
      });
  } catch (err) {
    console.error("Outer catch block", err);
  }
};

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "timerAlarm") {
    // Logic to execute when the timer alarm goes off
    console.log("Timer finished!");
    fetchUserNew();
  }
});

// Function to start the timer
async function startTimerAlarm(duration) {
  console.log("Timer started");
  // Get the current time in milliseconds since the Unix epoch
  const now = Date.now();

  // Calculate the time that is 2 minutes from now in milliseconds
  const twoMinutesFromNow = now + 2 * 60 * 1000; // 2 minutes in milliseconds
  await chrome.storage.local.set({
    startTime: now,
    endTime: twoMinutesFromNow,
  });
  chrome.alarms.create("timerAlarm", { delayInMinutes: duration });
}

// Function to stop the timer
function stopTimer() {
  chrome.alarms.clear("timerAlarm", (wasCleared) => {
    if (wasCleared) {
      console.log("Timer stopped successfully.");
    } else {
      console.log("No timer was running.");
    }
  });
}

function isCookieValueExpired(cookieValue) {
  const expDate = cookieValue.expirationDate;
  const epochTime = Math.floor(Date.now() / 1000) * 1000;
  return Date(expDate) < Date();
}
