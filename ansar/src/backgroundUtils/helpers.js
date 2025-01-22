import { autoPopupCheckUrls } from "./constants";

const devUrls = [
  "https://demoguest.com/vdi/radius",
  "https://demoguest.com/vdi/ldap",
];

export const isNotValidUrl =  (tab, env) => {
  // debugger
  
  if (!tab?.url || !env) {
    return true;
  }

  let urlsToCheck;

  if (env === "dev") {
    urlsToCheck = devUrls;
  } else {
    urlsToCheck = autoPopupCheckUrls.filter((url) => url.includes(`/${env}/`));
  }

  return !urlsToCheck.some((url) => tab.url === url);
};
