/* eslint-disable no-undef */
console.log("hello from sw!!");

const SCR_ONLINE = "assets/images/online48.png";
const SCR_OFFLINE = "assets/images/offline48.png";

// async function executeScriptBeforeSendingMessage(tab) {
//   await chrome.scripting.executeScript({
//     target: { tabId: tab.id },
//     files: ["content.js"],
//   });
// }

const checkUrlToOpenPopup = (tab) => {
  return (
    tab.url.includes("https://demoguest.com/demo/vdi/ldap") ||
    tab.url.includes("https://demoguest.com/demo/vdi/radius")
  );
};

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {

    if (tab.url && checkUrlToOpenPopup(tab)) {
      // let queryOptions = { active: true, lastFocusedWindow: true };
      // let [tab] = await chrome.tabs.query(queryOptions);

      await chrome.windows.getAll({ populate: true }, function (windows) {
        // let popupFound = false;
        for (let window of windows) {
          if (window.type === "popup") {
            // popupFound = true;
            break;
          }
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
              popupWindowId = window.id ?? null;
              // chrome.runtime.sendMessage({
              //   action: "getExtensionWindowId",
              //   id: window.id,
              // });
            }
          );
        });
      });
    }
  }
});

async function updateIconBasedOnCookie() {
  const cookie = await new Promise((resolve) =>
    chrome.cookies.get(
      {
        url: import.meta.env.VITE_CRED_BASE_URL,
        name: import.meta.env.VITE_COOKIE_NAME,
      },
      resolve
    )
  );

  if (cookie) {
    chrome.action.setIcon({ path: SCR_ONLINE });
    return true;
  } else {
    chrome.action.setIcon({ path: SCR_OFFLINE });
    return false;
  }
}

updateIconBasedOnCookie();

let socket = null;
// let timerElapsed = false;

async function getQidOrDid() {
  const res = await fetch(
    `https://wsp2.${
      import.meta.env.VITE_SUBDOMAIN
    }.scrambleid.com/login/portal/ZGVtfHxkZW0tcG9ydGFs?format=json`,
    {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        origin: "http://localhost:3100",
        priority: "u=1, i",
        referer: "http://localhost:3100/",
        "sec-ch-ua":
          '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
    }
  );
  const data = await res.json();
  return data;
}

chrome.runtime.onMessage.addListener(async (request) => {
  const hasCookie = await updateIconBasedOnCookie();

  const { timerElapsed = null } = await chrome.storage.local.get(
    "timerElapsed"
  );

  if (request.action === "open_popup" && timerElapsed && hasCookie) {
    chrome.storage.local.set({ timerElapsed: false });
    await processCredentials();
    return;
  }

  if (request.action === "open_popup") {
    const { User } = await chrome.storage.local.get("User");

    if (User) {
      chrome.runtime.sendMessage({
        action: "userExistShowCreds",
        user: User,
      });
      return;
    }

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
      console.log("WebSocket is not connected or is in a wrong state.");
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
      console.log("WebSocket is not connected or is in a wrong state.");
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
    chrome.storage.local.set({ timerElapsed: false });

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
});

async function getCredentials() {
  const url = `${
    import.meta.env.VITE_CRED_BASE_URL
  }/api/v1/lid/start-session/ZGVtfHxsZGFwYXBwMQ`;
  const options = {
    method: "POST",
    credentials: "include",
  };

  try {
    const response = await fetch(url, options);
    await chrome.runtime.sendMessage({
      action: "callingCredentialsApi",
    });
    if (!response.ok) {
      throw new Error(`Fetch failed with status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    // throw error;
  }
}

async function processCredentials() {
  try {
    const data = await getCredentials();

    await chrome.runtime.sendMessage({
      action: "hideLoaderShowCredentials",
      user: data?.user || "test",
    });

    await chrome.storage.local.set({
      User: data?.user || null,
    });

    updateIconBasedOnCookie();

    setTimeout(() => {
      // timerElapsed = true;
      chrome.storage.local.set({ timerElapsed: true });
    }, 10000);
  } catch (error) {
    console.error("Error processing credentials API:", error);
  }
}

async function establishWsConnection(url) {
  socket = new WebSocket(url);

  await chrome.runtime.sendMessage({
    action: "waitingForWsConnection",
  });

  const {
    Auth: { scrambleState },
  } = await chrome.storage.local.get("Auth");

  socket.addEventListener("open", async () => {
    console.log("WebSocket connection established.");
    await chrome.runtime.sendMessage({
      action: "wsConnectionSuccess",
    });
  });

  socket.addEventListener("message", async (event) => {
    const wsIncomingMessage = JSON.parse(event.data);

    console.log("wsIncomingMessage,", wsIncomingMessage);

    switch (wsIncomingMessage.op) {
      case "WaitForConfirm":
        await chrome.runtime.sendMessage({
          action: "waitingForConfirmationFromMob",
          wsEvent: wsIncomingMessage,
        });
        break;

      case "PORTAL":
        try {
          await chrome.runtime.sendMessage({
            action: "callingCredentialsApi",
          });

          const { cookie, expiresAt: cookieExpireAt } = JSON.parse(
            wsIncomingMessage.value
          );

          chrome.cookies.set(
            {
              url: import.meta.env.VITE_CRED_BASE_URL,
              name: import.meta.env.VITE_COOKIE_NAME,
              value: cookie,
              expirationDate: cookieExpireAt,
            },
            async (cookieSetResult) => {
              if (cookieSetResult) {
                console.log("Cookie set successfully:");
                await processCredentials();
              } else {
                console.error("Error setting cookie");
              }
            }
          );
        } catch (error) {
          console.error("Error handling PORTAL operation:", error);
        }
        break;

      case "QID":
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
        break;

      case "DID":
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
        break;

      case "validationCode":
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
        break;

      case "NO_CONSENT":
        await chrome.runtime.sendMessage({
          action: "refreshCodeNoConsent",
        });
        break;

      case "refreshError":
        await chrome.runtime.sendMessage({
          action: "error",
        });
        break;

      default:
        console.warn(`Unhandled operation: ${wsIncomingMessage.op}`);
        break;
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

// open at center
// when popup opens call credentials api
// if cookie exipired redict user to login