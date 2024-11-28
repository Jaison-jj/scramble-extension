/* eslint-disable no-undef */
console.log("hello from sw!!");

const SCR_ONLINE = "assets/images/online48.png";
const SCR_OFFLINE = "assets/images/offline48.png";

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

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
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
      console.error("WebSocket is not connected or is in a wrong state.");
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

    console.log("wsIncomingMessage,", wsIncomingMessage);

    if (wsIncomingMessage.op === "WaitForConfirm") {
      await chrome.runtime.sendMessage({
        action: "waitingForConfirmationFromMob",
        wsEvent: wsIncomingMessage,
      });
    }

    if (wsIncomingMessage.op === "PORTAL") {
      try {
        await chrome.runtime.sendMessage({
          action: "callingCredentialsApi",
        });

        const cookie = JSON.parse(wsIncomingMessage.value).cookie;
        const cookieExpireAt = JSON.parse(wsIncomingMessage.value).expiresAt;

        chrome.cookies.set(
          {
            url: import.meta.env.VITE_CRED_BASE_URL,
            name: import.meta.env.VITE_COOKIE_NAME,
            value: cookie,
            expirationDate: cookieExpireAt,
          },
          async (cookie) => {
            if (cookie) {
              console.log("Cookie set successfully:");
              await fetch(
                `${
                  import.meta.env.VITE_CRED_BASE_URL
                }/api/v1/lid/start-session/ZGVtfHxsZGFwYXBwMQ`,
                {
                  method: "post",
                  credentials: "include",
                }
              )
                .then((response) => response.json())
                .then(async (data) => {
                  // if (!data?.user) {
                  //   await chrome.runtime.sendMessage({
                  //     action: "error",
                  //   });
                  //   return;
                  // }

                  await chrome.runtime.sendMessage({
                    action: "hideLoaderShowCredentials",
                    user: data.user || "test",
                  });

                  await chrome.storage.local.set({
                    User: data?.user || null,
                  });

                  updateIconBasedOnCookie();
                });
            } else {
              console.error("Error setting cookie");
            }
          }
        );
      } catch (err) {
        console.log(err);
      }
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
