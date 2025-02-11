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
let popupWindowId = null;
let autoPopupEnabled = false;

async function updateIconBasedOnCookie() {
  const { selectedOrg } = await chrome.storage.local.get("selectedOrg");
  const { selectedEnv } = await chrome.storage.local.get("selectedEnv");

  if (!selectedOrg) return;

  await chrome.cookies.get(
    {
      url: `https://${selectedEnv}.scrambleid.com`,
      name: `scramble-session-${selectedOrg}`,
    },
    (cookie) => {
      const iconPath = cookie ? SCR_ONLINE : SCR_OFFLINE;
      chrome.action.setIcon({ path: iconPath });
    }
  );
}
updateIconBasedOnCookie();

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url) {
      lastActiveTab = tab;
      chrome.storage.local.set({ lastActiveTab });
    }
  });
});

chrome.runtime.onInstalled.addListener(async function (details) {
  await chrome.storage.local.set({
    selectedEnv: "demo",
    selectedOrg: "dem",
    isAutoPopup: false,
  });
  await updateIconBasedOnCookie();
});

async function closeExistingPopup() {
  if (!popupWindowId) return;

  return new Promise((resolve) => {
    chrome.windows.get(popupWindowId, {}, (window) => {
      if (chrome.runtime.lastError) {
        console.warn("Popup window not found, clearing popupWindowId.");
        popupWindowId = null;
        return resolve();
      }

      if (window && popupWindowId) {
        chrome.windows.remove(popupWindowId, () => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error removing popup window:",
              chrome.runtime.lastError
            );
          }
          popupWindowId = null;
          resolve();
        });
      } else {
        popupWindowId = null;
        resolve();
      }
    });
  });
}

async function startNewWindowAutoPopup(tab) {
  try {
    const { selectedEnv } = await chrome.storage.local.get("selectedEnv");
    const { selectedOrg } = await chrome.storage.local.get("selectedOrg");

    if (
      !tab?.url ||
      isNotValidUrl(tab, selectedEnv, selectedOrg) ||
      !autoPopupEnabled
    ) {
      return;
    }

    chrome.windows.getCurrent({ populate: true }, (currentWindow) => {
      if (!currentWindow) return;

      const windowWidth = 1016;
      const windowHeight = 539;

      const left =
        currentWindow.left +
        Math.floor((currentWindow.width - windowWidth) / 2);
      const top =
        currentWindow.top +
        Math.floor((currentWindow.height - windowHeight) / 2);

      chrome.windows.create(
        {
          url: "index.html?context=autoPopup",
          type: "popup",
          width: windowWidth,
          height: windowHeight,
          left,
          top,
        },
        async (window) => {
          if (window) {
            popupWindowId = window.id;
            await chrome.storage.local.set({ autoPopupEnabledUrl: tab.url });
          }
        }
      );
    });
  } catch (error) {
    console.error("Error in startNewWindowAutoPopup:", error);
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (
    changeInfo.status !== "complete" ||
    !tab?.url ||
    tab.url.startsWith("chrome")
  ) {
    return;
  }

  try {
    lastActiveTab = tab;
    await chrome.storage.local.set({ lastActiveTab });
    await closeExistingPopup();
    await startNewWindowAutoPopup(tab);
  } catch (error) {
    console.error("Error in onUpdated listener:", error);
  }
});

async function getAuthDataSetWsCon() {
  const { selectedEnv } = await chrome.storage.local.get("selectedEnv");

  const authCodeData = await getQidOrDid();
  chrome.storage.local.set({ authCodeData });

  const wsUrl = `wss://wsp.${selectedEnv}.scrambleid.com/v1?action=LID&qid=${authCodeData?.qid}&did=${authCodeData.did}&org=${authCodeData?.code}&epoch=${epochTime}&amznReqId=${authCodeData?.amznReqId}`;

  await establishWsConnection(wsUrl);

  await chrome.runtime.sendMessage({
    action: "transfer_auth_code",
    authCodeData,
  });
}

async function handlePageReload() {
  console.log("popupWindowId", popupWindowId);
  if (!popupWindowId) return;
  await closeExistingPopup();
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  const { selectedEnv } = await chrome.storage.local.get("selectedEnv");

  switch (request.action) {
    case "appPageReloaded":
      await handlePageReload();
      break;

    case "popupWindowClosed":
      popupWindowId = null;
      break;
    case "saveUserSettings":
      await chrome.storage.local.set({
        isAutoPopup: request.enableAuto,
        selectedEnv: request.selectedEnv,
        selectedOrg: request.selectedOrg,
      });
      autoPopupEnabled = request.enableAuto;
      updateIconBasedOnCookie();
      break;
    case "open_popup":
      await handleOpenPopup();
      await chrome.runtime.sendMessage({
        action: "appEnvToPopup",
        selectedEnv: selectedEnv,
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
  const { selectedEnv } = await chrome.storage.local.get("selectedEnv");
  const { selectedOrg } = await chrome.storage.local.get("selectedOrg");

  console.log("isNotValidUrl", isNotValidUrl(lastActiveTab, selectedEnv));

  if (isNotValidUrl(lastActiveTab, selectedEnv, selectedOrg)) {
    chrome.runtime.sendMessage({
      action: "unsupportedSite",
    });
    return;
  }

  chrome.cookies.get(
    {
      url: `https://${selectedEnv}.scrambleid.com`,
      name: `scramble-session-${selectedOrg}`,
    },
    async (cookie) => {
      if (cookie) {
        await fetchCredentials(lastActiveTab?.url);
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
        source: "LID",
        action: "LID",
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
        source: "LID",
        action: "LID",
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
        source: "LID",
        action: "LID",
        amznReqId: scrambleState.amznReqId,
      };
      socket.send(JSON.stringify(message));
    } catch (error) {
      console.error("ws error", error);
      await chrome.runtime.sendMessage({ action: "error" });
    }
  }
}

export async function establishWsConnection(url) {
  socket = new WebSocket(url);
  const { selectedEnv } = await chrome.storage.local.get("selectedEnv");
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

        const tempWsUrl = `wss://wsp.${selectedEnv}.scrambleid.com/v1?action=LID&qid=${authCodeData?.qid}&did=${uqId}&org=${authCodeData?.code}&epoch=${epochTime}`;

        await establishWsConnection(tempWsUrl);

        break;
      case "WaitForConfirm":
        await chrome.runtime.sendMessage({
          action: "waitingForConfirmationFromMob",
          wsEvent: wsIncomingMessage,
        });
        break;
      case "LID":
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
    // const creds = await fetchCredentials(lastActiveTab?.url);
    // await chrome.runtime.sendMessage({
    //   action: "hideLoaderShowCredentials",
    //   user: creds.user || { userName: null, password: null },
    // });
  }

  if (alarm.name === "myAlarm") {
    console.log("Alarm triggered! Time's up!");
    // await chrome.notifications.create({
    //   type: "basic",
    //   iconUrl: "assets/images/online48.png",
    //   title: "Alarm",
    //   message: "1 minute has passed!",
    // });
    await chrome.alarms.clear("myAlarm");
  }
});

function hasCookieExpired(cookieValue) {
  const expDate = cookieValue.expirationDate;
  return Date(expDate) < Date();
}

export async function handleDropUserCreds() {
  const { selectedOrg } = await chrome.storage.local.get("selectedOrg");
  const { selectedEnv } = await chrome.storage.local.get("selectedEnv");

  await chrome.storage.local.remove(
    ["authCodeData", "isAutoPopup ", "User"],
    (result) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error removing keys from storage:",
          chrome.runtime.lastError
        );
      } else {
        console.log("storage local removed successfully.");
      }
    }
  );

  chrome.cookies.remove(
    {
      url: `https://${selectedEnv}.scrambleid.com`,
      name: `scramble-session-${selectedOrg}`,
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

  await chrome.storage.local.set({
    isAutoPopup: false,
    selectedEnv: selectedEnv || "demo",
    selectedOrg: selectedOrg || "dem",
  });
}
