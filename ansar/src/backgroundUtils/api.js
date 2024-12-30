export async function getQidOrDid() {
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

export const fetchUserCredentials = async (
  wsEventData,
  // popupOpenedSiteTab,
  updateIconBasedOnCookie,
  startTimerAlarm
) => {
  const wsIncomingMessage = JSON.parse(wsEventData.data);
  let popupOpenedSiteTab = null

  chrome.storage.local.get('lastActiveTab', (result) => {
    if (result.lastActiveTab) {
      popupOpenedSiteTab = result.lastActiveTab;
    }
  })

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
        ///api/v1/lid/start-session/ZGVtfHxsZGFwYXBwMQ
        if (cookie) {
          console.log("Cookie set successfully:");
          await fetch(
            `${import.meta.env.VITE_CRED_BASE_URL}/api/v1/lid/start-session`,
            {
              method: "post",
              credentials: "include",
              body: JSON.stringify({
                appUrl: popupOpenedSiteTab?.url || null,
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
                //instead of throwing error show api failed ui,remove the cookie as well
              }
              return response.json();
            })
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
              startTimerAlarm(2);
            })
            .catch((err) => {
              console.log("fetchUserCredentials", err);
              //go to some error page
            });
        } else {
          console.error("Error setting cookie");
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
};
