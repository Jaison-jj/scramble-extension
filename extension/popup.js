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
      console.log("No scrambled cookie found!!");
    }
  }
);

document.addEventListener("DOMContentLoaded", () => {
  const openButton = document.getElementById("openNewTabBtn");
  if (!openButton) return;
  openButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "openWebsite" });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  chrome.runtime.sendMessage({ action: "popupOpened" });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "show_loader") {
    document.getElementById("loader").style.display = "block";
  } else if (request.action === "hide_loader_and_close_popup") {
    document.getElementById("loader").style.display = "none";
    window.close();
  } else if (request.action === "show_error") {
    document.getElementById("error-message").textContent = request.message;
    document.getElementById("loader").style.display = "none";
  }else if (request.action === "hide_loader") {
    document.getElementById("error-message").textContent = request.message;
    document.getElementById("loader").style.display = "none";
  }
});
