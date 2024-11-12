// window.addEventListener("load", () => {
//   setTimeout(() => {
//     let usernameField = document.querySelector('input[id="username"]');
//     let passwordField = document.querySelector('input[id="password"]');
//     if (usernameField && passwordField) {
//       usernameField.value = "john.doe@yahoo.com";
//       passwordField.value = "ue8ovmfVP3ODRF4";
//       chrome.runtime.sendMessage({ message: "fieldsFilled" });
//       console.log("Close popup message passed from contentJs");
//     }
//   }, 1000);
// });

//inject anything to the webpage
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   let usernameField = document.querySelector('input[id="username"]');
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "retrieve-user") {
    let usernameField = document.querySelector('input[id="username"]');
    let passwordField = document.querySelector('input[id="password"]');

    if (!request.user) {
      return alert(
        `There is no user!! errorCode:${request.errorCode}, resultCode:${request.resultCode}`
      );
    }
    usernameField.value = request.user.userName;
    passwordField.value = request.user.password;
  }
  if (request.action === "no-cookie") {
  }
});
