import { autoPopupCheckUrls } from "./constants";

const devUrls = [
  "https://demoguest.com/vdi/radius",
  "https://demoguest.com/vdi/ldap",
];

const demUrls = [
  "https://demoguest.com/qa/vdi/ldap",
  "https://demoguest.com/qa/vdi/radius",
  "https://demoguest.com/demo/vdi/ldap",
  "https://demoguest.com/demo/vdi/radius",
  "https://demoguest.com/uat/vdi/ldap",
  "https://demoguest.com/uat/vdi/radius",
  "https://demoguest.com/prod/vdi/ldap",
  "https://demoguest.com/prod/vdi/radius",
];

export const isNotValidUrl = (tab, env, org) => {
  console.log({ url: tab?.url, env, org });

  if (!tab?.url || !env) {
    return true;
  }

  let urlsToCheck;

  if (env === "dev") {
    urlsToCheck = devUrls;
  } else if (env !== "dev" && org === "ukg") {
    urlsToCheck = autoPopupCheckUrls.filter(
      (url) => url.includes(`/${env}/`) && url.includes(`/${org}/`)
    );
  } else if (org === "dem" && env !== "dev") {
    urlsToCheck = demUrls;
  } else {
    urlsToCheck = autoPopupCheckUrls.filter((url) => url.includes(`/${env}/`));
  }

  return !urlsToCheck.some((url) => tab.url === url);
};
