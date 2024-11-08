window.addEventListener("load", () => {
  setTimeout(() => {
    
    let usernameField = document.querySelector(
      'input[id="email"]'
    );
    let passwordField = document.querySelector(
      'input[id="password"]'
    );
    if (usernameField && passwordField) {
      usernameField.value = "john.doe@yahoo.com";
      passwordField.value = "ue8ovmfVP3ODRF4";
      chrome.runtime.sendMessage({ message: "fieldsFilled" });
      console.log("Close popup message passed from contentJs");
    }
  }, 4000);
});