import { autoPopupCheckUrls } from "./constants";

const devUrls = [
  "https://demoguest.com/vdi/radius",
  "https://demoguest.com/vdi/ldap",
];

export const isNotValidUrl = (tab, env) => {
  const urlsToCheck = env === "dev" ? devUrls : autoPopupCheckUrls;

  return !urlsToCheck.some((url) => tab?.url === url);
};

