import { autoPopupCheckUrls } from "./constants";

export const checkUrlToOpenPopup = (tab) => {
    return autoPopupCheckUrls.some((url) => tab.url === url);
  };
  