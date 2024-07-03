window.addEventListener("load", () => {
  setTimeout(() => {
    let usernameField = document.querySelector(
      'input[name="scramble_username"]'
    );
    let passwordField = document.querySelector(
      'input[name="scramble_password"]'
    );
    if (usernameField && passwordField) {
      usernameField.value = "filled by extension";
      passwordField.value = "filledByExtension";
      chrome.runtime.sendMessage({ message: "fieldsFilled" });
      console.log("message passed from contentJs");
    }
  }, 4000);
});
