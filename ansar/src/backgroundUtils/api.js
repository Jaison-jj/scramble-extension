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

export const fetchCredentials = async (appUrl) => {
  const response = await fetch(
    `${import.meta.env.VITE_CRED_BASE_URL}/api/v1/lid/start-session`,
    {
      method: "post",
      credentials: "include",
      body: JSON.stringify({
        appUrl: appUrl || null,
      }),
    }
  );

  if (!response.ok) {
    await chrome.runtime.sendMessage({
      action: "unsupportedSite",
    });
    throw new Error(
      `HTTP error! Status: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};

export const initialFetchUser = async (
  wsEventData,
  updateIconBasedOnCookie,
  startTimerAlarm
) => {
  const wsIncomingMessage = JSON.parse(wsEventData.data);
  const { lastActiveTab } = await chrome.storage.local.get("lastActiveTab");

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
          try {
            const data = await fetchCredentials(lastActiveTab?.url);
            await chrome.runtime.sendMessage({
              action: "hideLoaderShowCredentials",
              user: data.user || { userName: "hello", password: "123" },
            });

            await chrome.storage.local.set({
              User: data?.user || { userName: null, password: null },
            });

            updateIconBasedOnCookie();
            startTimerAlarm(2);
          } catch (err) {
            console.log("fetchUserCredentials", err);
          }
        } else {
          console.error("Error setting cookie");
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
};