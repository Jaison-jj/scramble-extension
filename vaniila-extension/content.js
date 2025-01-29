chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "retrieve-user") {
    let usernameField = document.querySelector('input[id="username"]');
    let passwordField = document.querySelector('input[id="password"]');

    if (!request.user) {
      return alert(
        `There is no user!! errorCode:${request.errorCode}, resultCode:${request.resultCode}`
      );
    }
    // usernameField.value = request.user.userName;
    // passwordField.value = request.user.password;
  }
  if (request.action === "no-cookie") {
  }
});
