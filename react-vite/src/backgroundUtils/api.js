import { establishWsConnection } from "../background";
import { checkUrlAndGetB64Org } from "./helpers";

const epochTime = Math.floor(Date.now() / 1000) * 1000;

const codes = {
  org_app_not_exist: 38,
  no_cookie: 86,
  cookie_expired: 87,
};

export async function getQidOrDid() {
  const { selectedEnv } = await chrome.storage.local.get("selectedEnv");

  const { lastActiveTab } = await chrome.storage.local.get("lastActiveTab");

  const b64org = checkUrlAndGetB64Org(lastActiveTab?.url).replace(/=*$/, "");
  const url = `https://wsp2.${selectedEnv}.scrambleid.com/login/lid/${b64org}?format=json`;
  // const url = `https://${selectedEnv}.scrambleid.com/api/v1/login/lid/${b64org}?format=json`;

  const res = await fetch(url);
  const data = await res.json();
  return data;
}

export const fetchCredentials = async (appUrl) => {
  const { selectedEnv } = await chrome.storage.local.get("selectedEnv");

  const response = await fetch(
    `https://${selectedEnv}.scrambleid.com/api/v1/lid/start-session`,
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

  const responseData = await response.json();
  const newAuthCodeData = { ...responseData?.loginData };

  if (responseData.resultCode === codes.cookie_expired) {
    await handleCookieExpiration(newAuthCodeData, selectedEnv);
    return;
  }

  if (responseData.resultCode === codes.no_cookie) {
    //
  }

  await chrome.runtime.sendMessage({
    action: "hideLoaderShowCredentials",
    user: responseData.user || { userName: null, password: null },
  });

  return responseData;
};

export const initialFetchUser = async (
  wsEventData,
  updateIconBasedOnCookie
) => {
  const wsIncomingMessage = JSON.parse(wsEventData.data);
  const { lastActiveTab } = await chrome.storage.local.get("lastActiveTab");
  const { selectedEnv } = await chrome.storage.local.get("selectedEnv");
  const { selectedOrg } = await chrome.storage.local.get("selectedOrg");

  try {
    await chrome.runtime.sendMessage({
      action: "callingCredentialsApi",
    });

    const cookie = JSON.parse(wsIncomingMessage.value).cookie;
    // const cookieExpireAt = JSON.parse(wsIncomingMessage.value).expiresAt;

    const oneYearInSeconds = 365 * 24 * 60 * 60 * 1000;

    chrome.cookies.set(
      {
        url: `https://${selectedEnv}.scrambleid.com`,
        name: `scramble-session-${selectedOrg}`,
        value: cookie,
        expirationDate: oneYearInSeconds,
        domain: `.${selectedEnv}.scrambleid.com`,
      },
      async (cookie) => {
        if (cookie) {
          console.log("Cookie set successfully:");
          try {
            const data = await fetchCredentials(lastActiveTab?.url);
            await chrome.runtime.sendMessage({
              action: "hideLoaderShowCredentials",
              user: data.user || { userName: "test", password: "test" },
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

export async function startTimerAlarm(duration) {
  console.log("Timer started");
  const now = Date.now();
  const twoMinutesFromNow = now + 2 * 60 * 1000;

  await chrome.storage.local.set({
    startTime: now,
    endTime: twoMinutesFromNow,
  });

  chrome.alarms.create("timerAlarm", { delayInMinutes: duration });
}

async function handleCookieExpiration(newAuthCodeData, selectedEnv) {
  await chrome.storage.local.set({
    authCodeData: newAuthCodeData,
  });

  await chrome.storage.local.remove(["User"], async () => {
    if (chrome.runtime.lastError) {
      console.error("error removing+", chrome.runtime.lastError);
    } else {
      console.log("removed successfully");

      const newWsUrl = `wss://wsp.${selectedEnv}.scrambleid.com/v1?action=LID&qid=${newAuthCodeData?.qid}&did=${newAuthCodeData?.did}&org=${newAuthCodeData?.code}&epoch=${epochTime}&amznReqId=${newAuthCodeData?.amznReqId}`;

      await establishWsConnection(newWsUrl);

      await chrome.runtime.sendMessage({
        action: "transfer_auth_code",
        authCodeData: newAuthCodeData,
      });
    }
  });
}
