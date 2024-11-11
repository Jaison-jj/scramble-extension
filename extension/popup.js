chrome.cookies.get(
  {
    url: "https://portal.qa.scrambleid.com",
    name: "scramble-session-dem",
  },
  (cookie) => {
    if (cookie) {
      const openButton = document.getElementById("openNewTabBtn");
      openButton.remove();
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        const openButton = document.getElementById("openNewTabBtn");
        openButton.addEventListener("click", () => {
          chrome.runtime.sendMessage({ action: "openWebsite" });
        });
      });
      console.log("No scrambled cookie found!!");
    }
  }
);

document.addEventListener("DOMContentLoaded", () => {
  chrome.runtime.sendMessage({ action: "popupOpened" });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "show_loader") {
    document.getElementById("loader").style.display = "block";
  } else if (request.action === "hide_loader") {
    document.getElementById("loader").style.display = "none";
    window.close();
  } else if (request.action === "show_error") {
    document.getElementById("error-message").textContent = request.message;
    document.getElementById("loader").style.display = "none";
  }
});
