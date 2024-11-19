document.addEventListener("DOMContentLoaded", () => {
  const openButton = document.getElementById("openNewTabBtn");
  if (openButton) {
    openButton.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "openWebsite" });
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  chrome.runtime.sendMessage({ action: "popupOpened" });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "show_loader") {
    document.getElementById("loader").style.display = "flex";
    document.getElementById("creds-container").style.display = "none";
  } else if (request.action === "hide_loader_fill_fields") {
    document.getElementById("loader").style.display = "none";
    document.getElementById("creds-container").style.display = "flex";
    const usernameField = document.getElementById("username");
    const passwordField = document.getElementById("password");
    usernameField.value = request?.user?.userName || "expired";
    passwordField.value = request?.user?.password || "expired";
    // window.close();
  } else if (request.action === "show_error") {
    document.getElementById("error-message").textContent = request.message;
    document.getElementById("loader").style.display = "none";
  } else if (request.action === "hide_loader") {
    document.getElementById("error-message").textContent = request.message;
    document.getElementById("loader").style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const copyUsernameBtn = document.getElementById("copyUsernameBtn");
  const copyPasswordBtn = document.getElementById("copyPasswordBtn");

  const copyToClipboard = (dataType) => {
    chrome.storage.local.get("scrambleUser", (data) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error retrieving scrambleUser data:",
          chrome.runtime.lastError
        );
      } else {
        const { userName, password } = data.scrambleUser;
        let textToCopy;
        switch (dataType) {
          case "username":
            textToCopy = userName;
            console.log("Retrieved username:", textToCopy);
            break;
          case "password":
            textToCopy = password;
            console.log("Retrieved password:", textToCopy);
            break;
          default:
            console.error("Invalid data type:", dataType);
            return;
        }

        navigator.clipboard
          .writeText(textToCopy)
          .then(() => {
            console.log(`${dataType} copied to clipboard:`, textToCopy);
          })
          .catch((err) => {
            console.error(`Error copying ${dataType}:`, err);
          });
      }
    });
  };

  copyUsernameBtn?.addEventListener("click", () => copyToClipboard("username"));
  copyPasswordBtn?.addEventListener("click", () => copyToClipboard("password"));
});

document.addEventListener("DOMContentLoaded", () => {
  const isLightLightMode = window.matchMedia(
    "(prefers-color-scheme: light)"
  ).matches;
  if (isLightLightMode) {
    const headerImage = document.querySelector("header img");
    headerImage.src = "assets/images/headerLogoBlack.png";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  chrome.cookies.get(
    {
      url: "https://portal.qa.scrambleid.com",
      name: "scramble-session-dem",
    },
    (cookie) => {
      if (cookie) {
        document.getElementById("openNewTabBtn").style.display = "none";
        document.getElementById("creds-container").style.display = "none";
      } else {
        chrome.storage.local.remove("scrambleUser", () => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error removing scrambleUser data:",
              chrome.runtime.lastError
            );
            document.getElementById("creds-container").style.display = "none";
          } else {
            document.getElementById("creds-container").style.display = "none";
          }
        });
      }
    }
  );
});
