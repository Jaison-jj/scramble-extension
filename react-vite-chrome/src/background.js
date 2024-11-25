/* eslint-disable no-undef */
console.log("hello from sw now!!");

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

const Step = {
  INIT: 1,
  GET_QID_DID: 2,
  WS_CONNECT: 3,
};

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "open_popup") {
    chrome.storage.local.set({
      Auth: {
        step: Step.INIT,
      },
    });

    const authCodeData = await getQidOrDid();

    chrome.storage.local.set({
      Auth: {
        data: authCodeData,
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
    console.log(wsUrl);

    await establishWsConnection(wsUrl);

    const scrambleState = await chrome.storage.local.get("Auth");

    await chrome.runtime.sendMessage({
      action: "transfer_auth_code",
      scrambleState,
    });
  }
});

async function establishWsConnection(url) {
  const wsTestUrl = "wss://echo.websocket.events";
  const socket = new WebSocket(url);

  socket.addEventListener("open", () => {
    socket.send("Hello! how are you");
  });

  socket.addEventListener("message", async (event) => {
    await chrome.runtime.sendMessage({
      action: "received_ws_message",
      wsEvent: event.data,
    });
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
