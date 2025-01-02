import {
  initialFetchUser,
  getQidOrDid,
  fetchCredentials,
} from "./backgroundUtils/api";

console.log("hello from sw!!");

const SCR_ONLINE = "assets/images/online48.png";
const SCR_OFFLINE = "assets/images/offline48.png";

let socket = null;
let wsEventData = null;
let lastActiveTab = null;

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url) {
      lastActiveTab = tab;
      chrome.storage.local.set({ lastActiveTab });
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
  switch (request.action) {
    case "saveUserSettingForAutoPopup":
      chrome.storage.local.set({ isAutoPopup: request.enableAuto });
      break;
    case "open_popup":
      handleOpenPopup();
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
  chrome.cookies.get(
    {
      url: import.meta.env.VITE_CRED_BASE_URL,
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
        await chrome.runtime.sendMessage({
          action: "firstTimeLoginShowTypeCode",
          wsEvent: wsIncomingMessage,
        });
        break;
      case "WaitForConfirm":
        await chrome.runtime.sendMessage({
          action: "waitingForConfirmationFromMob",
          wsEvent: wsIncomingMessage,
        });
        break;
      case "PORTAL":
        initialFetchUser(wsEventData, updateIconBasedOnCookie, startTimerAlarm);
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
    console.error("WebSocket error:", error);
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
    // check if cookie is expired, if yes, refetch the user credentials
  }
});

async function startTimerAlarm(duration) {
  console.log("Timer started");
  const now = Date.now();
  const twoMinutesFromNow = now + 2 * 60 * 1000;

  await chrome.storage.local.set({
    startTime: now,
    endTime: twoMinutesFromNow,
  });

  chrome.alarms.create("timerAlarm", { delayInMinutes: duration });
}

function isCookieValueExpired(cookieValue) {
  const expDate = cookieValue.expirationDate;
  return Date(expDate) < Date();
}
