window.addEventListener("load", () => {
  setTimeout(() => {
    let usernameField = document.querySelector('input[name="username"]');
    let passwordField = document.querySelector('input[name="password"]');
    if (usernameField && passwordField) {
      usernameField.value = "xxxxzzz";
      passwordField.value = "yyyy";
      console.log("fields are filled");
      const allWindows = chrome.windows.getAll();
      console.log(allWindows)
    }
  }, 1500);
});
