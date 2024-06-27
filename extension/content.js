window.addEventListener("load", () => {
  console.log('contentJs called')
  setTimeout(() => {
    let usernameField = document.querySelector(
      'input[name="scramble_username"]'
    );
    let passwordField = document.querySelector(
      'input[name="scramble_password"]'
    );
    if (usernameField && passwordField) {
      usernameField.value = "xxxxzzz";
      passwordField.value = "yyyy";
      chrome.runtime.sendMessage({ message: "fieldsFilled" });
    }
  }, 2000);
});
