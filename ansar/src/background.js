import { fetchUserCredentials, getQidOrDid } from "./backgroundUtils/api";

console.log("hello from sw!!");

const SCR_ONLINE = "assets/images/online48.png";
const SCR_OFFLINE = "assets/images/offline48.png";

let socket = null;
let wsEventData = null;

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

async function getAuthDataSetWsCon() {
  const authCodeData = await getQidOrDid();

  chrome.storage.local.set({
    authCodeData,
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
  //auto popup
  if (request.action === "saveUserSettingForAutoPopup") {
    chrome.storage.local.set({ isAutoPopup: request.enableAuto });
    return;
  }

  if (request.action === "open_popup") {
    chrome.cookies.get(
      {
        url: import.meta.env.VITE_CRED_BASE_URL,
        name: import.meta.env.VITE_COOKIE_NAME,
      },
      async (cookie) => {
        if (cookie && isCookieValueExpired(cookie)) {
          await chrome.storage.local.set({
            User: null,
          });
          return;
        } else if (cookie && !isCookieValueExpired(cookie)) {
          //get user from local storage and show
          return;
        } else {
          getAuthDataSetWsCon();
          return;
        }
      }
    );
  }

  const { authCodeData: scrambleState } = await chrome.storage.local.get(
    "authCodeData"
  );

  if (
    request.action === "restart_qr_timer" &&
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
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
      await chrome.runtime.sendMessage({
        action: "error",
      });
      return;
    }
  }

  if (
    request.action === "restart_type_code_timer" &&
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
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
      await chrome.runtime.sendMessage({
        action: "error",
      });
    }
  }

  if (
    request.action === "switchCodeType" &&
    socket.readyState === WebSocket.OPEN
  ) {
    try {
      const message = {
        op: request.codeType,
        value: scrambleState.qid,
        org: scrambleState.code,
        source: "PORTAL",
        action: "PORTAL",
        amznReqId: scrambleState.amznReqId,
      };
      socket.send(JSON.stringify(message));
    } catch (error) {
      console.error("ws error", error);

      await chrome.runtime.sendMessage({
        action: "error",
      });
    }
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
});

async function establishWsConnection(url) {
  socket = new WebSocket(url);

  const authCodeData = await chrome.storage.local.get("Auth");

  socket.addEventListener("open", () => {
    console.log("ws connection established.");
  });

  socket.addEventListener("message", async (event) => {
    const wsIncomingMessage = JSON.parse(event.data);
    wsEventData = event;

    console.log("wsIncomingMessage,", wsIncomingMessage);

    if (wsIncomingMessage.op === "TYPECODE_LOGIN_NOT_DONE") {
      await chrome.runtime.sendMessage({
        action: "firstTimeLoginShowTypeCode",
        wsEvent: wsIncomingMessage,
      });
    }

    if (wsIncomingMessage.op === "WaitForConfirm") {
      await chrome.runtime.sendMessage({
        action: "waitingForConfirmationFromMob",
        wsEvent: wsIncomingMessage,
      });
    }

    if (wsIncomingMessage.op === "PORTAL") {
      fetchUserCredentials(
        wsEventData,
        updateIconBasedOnCookie,
        startTimerAlarm
      );
    }

    if (wsIncomingMessage.op === "QID") {
      await chrome.storage.local.set({
        authCodeData: { ...authCodeData, qid: wsIncomingMessage.value },
      });

      await chrome.runtime.sendMessage({
        action: "restartQrTimer",
        newQid: wsIncomingMessage.value,
        newCodeData: { ...authCodeData, qid: wsIncomingMessage.value },
      });
    }

    //this can cause message port disconnected error
    if (wsIncomingMessage.op === "DID") {
      //user has chosen typeCode
      await chrome.storage.local.set({
        authCodeData: { ...authCodeData, did: wsIncomingMessage.value },
      });

      await chrome.runtime.sendMessage({
        action: "restartTypeCodeTimer",
        newDid: wsIncomingMessage.value,
        newCodeData: { ...authCodeData, did: wsIncomingMessage.value },
      });
    }

    if (wsIncomingMessage.op === "validationCode") {
      await chrome.storage.local.set({
        authCodeData: {
          ...authCodeData,
          did: JSON.stringify(wsIncomingMessage.value),
        },
      });

      await chrome.runtime.sendMessage({
        action: "validationCodeReceived",
        newDid: wsIncomingMessage.value,
        newCodeData: {
          ...authCodeData,
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
      `WebSocket connection closed: Code=${event.code}, Reason=${event}`
    );
  });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "timerAlarm") {
    console.log("Timer finished!");
    //refetch user
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
  // const epochTime = Math.floor(Date.now() / 1000) * 1000;
  return Date(expDate) < Date();
}
