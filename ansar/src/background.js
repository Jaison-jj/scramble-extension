console.log("hello from sw!!");

import {
  initialFetchUser,
  getQidOrDid,
  fetchCredentials,
} from "./backgroundUtils/api";
import { isNotValidUrl } from "./backgroundUtils/helpers";

const SCR_ONLINE = "assets/images/online48.png";
const SCR_OFFLINE = "assets/images/offline48.png";

const epochTime = Math.floor(Date.now() / 1000) * 1000;

let socket = null;
let wsEventData = null;
let lastActiveTab = null;
let appEnv = "dev";
let popupWindowId = null;
let autoPopupEnabled = false;

// chrome.storage.onChanged.addListener((changes, namespace) => {
//   for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
//     console.log(
//       `Storage key "${key}" in namespace "${namespace}" changed.`,
//       `Old value was "${oldValue}", new value is "${newValue}".`
//     );
//   }
// });

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url) {
      lastActiveTab = tab;
      chrome.storage.local.set({ lastActiveTab });
      console.log(tab.url);
    }
  });
});

chrome.runtime.onInstalled.addListener(function(details){
  chrome.storage.local.set({ selectedEnv:'dev' });
});

// ##################
// ##################
// ##################
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {

  
  if (changeInfo.status === "complete" && tab?.url) {

    lastActiveTab = tab;
    chrome.storage.local.set({ lastActiveTab });
    console.log("updatedUrl",tab?.url)
    
    // debugger
    // const { isAutoPopup } =
    //   (await chrome.storage.local.get("isAutoPopup")) || false;

    if (tab.url.startsWith("chrome")) {
      return
    }

    
    if (tab?.url && !isNotValidUrl(tab, appEnv) && autoPopupEnabled) {
      console.log("updatedTab",tab?.url)
      if (popupWindowId) {
       await chrome.windows.remove(popupWindowId, () => {
          popupWindowId = null;
        })
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



function updateIconBasedOnCookie() {
  chrome.cookies.get(
    {
      url: `https://${appEnv}.scrambleid.com`,
      name: import.meta.env.VITE_COOKIE_NAME,
    },
    (cookie) => {
      const iconPath = cookie ? SCR_ONLINE : SCR_OFFLINE;
      chrome.action.setIcon({ path: iconPath });
    }
  );
}
updateIconBasedOnCookie();

async function getAuthDataSetWsCon() {
  const authCodeData = await getQidOrDid();
  chrome.storage.local.set({ authCodeData });

  const epochTime = Math.floor(Date.now() / 1000) * 1000;
  const wsUrl = `wss://wsp.${appEnv}.scrambleid.com/v1?action=PORTAL&qid=${authCodeData?.qid}&did=${authCodeData.did}&org=${authCodeData?.code}&epoch=${epochTime}&amznReqId=${authCodeData?.amznReqId}`;

  await establishWsConnection(wsUrl);

  await chrome.runtime.sendMessage({
    action: "transfer_auth_code",
    authCodeData,
  });
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  switch (request.action) {
    case "popupWindowClosed":
      popupWindowId = null;
      break;
    case "saveUserSettings":
      appEnv = request.selectedEnv;
      await chrome.storage.local.set({
        isAutoPopup: request.enableAuto,
        selectedEnv: request.selectedEnv,
      });
      autoPopupEnabled = request.enableAuto;
      break;
    case "open_popup":
      await handleOpenPopup();
      await chrome.runtime.sendMessage({
        action: "appEnvToPopup",
        selectedEnv: appEnv,
      });
      break;
    case "restart_qr_timer":
      handleRestartQrTimer();
      break;
    case "restart_type_code_timer":
      handleRestartTypeCodeTimer();
      break;
    case "switchCodeType":
      handleSwitchCodeType(request.codeType);
      break;
    case "dropUserCreds":
      handleDropUserCreds();
      break;
    default:
      break;
  }
});

async function handleOpenPopup() {
  console.log("isNotValidUrl", isNotValidUrl(lastActiveTab, appEnv));

  if (isNotValidUrl(lastActiveTab, appEnv)) {
    chrome.runtime.sendMessage({
      action: "unsupportedSite",
    });
    return;
  }

  chrome.cookies.get(
    {
      url: `https://${appEnv}.scrambleid.com`,
      name: import.meta.env.VITE_COOKIE_NAME,
    },
    async (cookie) => {
      if (cookie && isCookieValueExpired(cookie)) {
        handleDropUserCreds();
        await chrome.storage.local.set({ User: null });
      } else if (cookie && !isCookieValueExpired(cookie)) {
        const creds = await fetchCredentials(lastActiveTab?.url);
        await chrome.runtime.sendMessage({
          action: "hideLoaderShowCredentials",
          user: creds.user || { userName: null, password: null },
        });
      } else {
        getAuthDataSetWsCon();
      }
    }
  );
}

async function handleRestartQrTimer() {
  const { authCodeData: scrambleState } = await chrome.storage.local.get(
    "authCodeData"
  );
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      const message = {
        op: "QID",
        value: scrambleState.qid,
        org: scrambleState.code,
        source: "PORTAL",
        action: "PORTAL",
        amznReqId: scrambleState.amznReqId,
      };
      socket.send(JSON.stringify(message));
    } catch (error) {
      console.error("ws error", error);
      await chrome.runtime.sendMessage({ action: "error" });
    }
  }
}

async function handleRestartTypeCodeTimer() {
  const { authCodeData: scrambleState } = await chrome.storage.local.get(
    "authCodeData"
  );
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      const message = {
        op: "DID",
        value: scrambleState.qid,
        org: scrambleState.code,
        source: "PORTAL",
        action: "PORTAL",
        amznReqId: scrambleState.amznReqId,
      };
      socket.send(JSON.stringify(message));
    } catch (error) {
      console.error("ws error", error);
      await chrome.runtime.sendMessage({ action: "error" });
    }
  }
}

async function handleSwitchCodeType(codeType) {
  const { authCodeData: scrambleState } = await chrome.storage.local.get(
    "authCodeData"
  );
  if (socket.readyState === WebSocket.OPEN) {
    try {
      const message = {
        op: codeType,
        value: scrambleState.qid || "null",
        org: scrambleState.code || "null",
        source: "PORTAL",
        action: "PORTAL",
        amznReqId: scrambleState.amznReqId,
      };
      socket.send(JSON.stringify(message));
    } catch (error) {
      console.error("ws error", error);
      await chrome.runtime.sendMessage({ action: "error" });
    }
  }
}

async function handleDropUserCreds() {
  chrome.storage.local.clear(() => {
    if (chrome.runtime.lastError) {
      console.error("Error clearing storage:", chrome.runtime.lastError);
    } else {
      console.log("Local storage cleared successfully.");
    }
  });
  chrome.cookies.remove(
    {
      url: `https://${appEnv}.scrambleid.com`,
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

async function establishWsConnection(url) {
  socket = new WebSocket(url);
  const { authCodeData: scrambleState } = await chrome.storage.local.get(
    "authCodeData"
  );

  socket.addEventListener("open", () => {
    console.log("ws connection established.");
  });

  socket.addEventListener("message", async (event) => {
    const wsIncomingMessage = JSON.parse(event.data);
    wsEventData = event;
    console.log("wsIncomingMessage,", wsIncomingMessage);

    switch (wsIncomingMessage.op) {
      case "TYPECODE_LOGIN_NOT_DONE":
        const authCodeData = await getQidOrDid();

        await chrome.runtime.sendMessage({
          action: "firstTimeLoginShowTypeCode",
          wsEvent: wsIncomingMessage,
        });

        const uqId = JSON.parse(wsIncomingMessage.value).uqId;

        const tempWsUrl = `wss://wsp.${appEnv}.scrambleid.com/v1?action=PORTAL&qid=${authCodeData?.qid}&did=${uqId}&org=${authCodeData?.code}&epoch=${epochTime}`;

        await establishWsConnection(tempWsUrl);

        break;
      case "WaitForConfirm":
        await chrome.runtime.sendMessage({
          action: "waitingForConfirmationFromMob",
          wsEvent: wsIncomingMessage,
        });
        break;
      case "PORTAL":
        initialFetchUser(wsEventData, updateIconBasedOnCookie);
        break;
      case "QID":
        await updateAuthCodeData({ qid: wsIncomingMessage.value });
        await chrome.runtime.sendMessage({
          action: "restartQrTimer",
          newQid: wsIncomingMessage.value,
          newCodeData: { ...scrambleState, qid: wsIncomingMessage.value },
        });
        break;
      case "DID":
        await updateAuthCodeData({ did: wsIncomingMessage.value });
        await chrome.runtime.sendMessage({
          action: "restartTypeCodeTimer",
          newDid: wsIncomingMessage.value,
          newCodeData: { ...scrambleState, did: wsIncomingMessage.value },
        });
        break;
      case "validationCode":
        await updateAuthCodeData({
          did: JSON.stringify(wsIncomingMessage.value),
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
        await chrome.runtime.sendMessage({ action: "refreshCodeNoConsent" });
        break;
      case "refreshError":
        await chrome.runtime.sendMessage({ action: "error" });
        break;
      default:
        break;
    }
  });

  socket.addEventListener("error", (error) => {
    chrome.runtime.sendMessage({
      action: "websocketError",
      message: "WebSocket  connection error, Please retry!",
    });
  });

  socket.addEventListener("close", (event) => {
    console.warn(
      `WebSocket connection closed: Code=${event.code}, Reason=${event}`
    );
  });
}

async function updateAuthCodeData(newData) {
  const { authCodeData: scrambleState } = await chrome.storage.local.get(
    "authCodeData"
  );
  await chrome.storage.local.set({
    authCodeData: { ...scrambleState, ...newData },
  });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "timerAlarm") {
    console.log("Timer finished!");
    const creds = await fetchCredentials(lastActiveTab?.url);

    // set the password to refreshPassword and send it to the popup.
    // await chrome.runtime.sendMessage({
    //   action: "hideLoaderShowCredentials",
    //   user: creds.user || { userName: null, password: null },
    // });
  }
});

function isCookieValueExpired(cookieValue) {
  const expDate = cookieValue.expirationDate;
  return Date(expDate) < Date();
}
