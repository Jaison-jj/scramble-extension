// var port = chrome.runtime.connect({ name: "knockknock" });
// port.postMessage({ joke: "Knock knock" });
// port.onMessage.addListener(function (msg) {
//     if (msg.question === "Who's there?")
//         port.postMessage({ answer: "Madame" });
//     else if (msg.question === "Madame who?")
//         port.postMessage({ answer: "Madame... Bovary" });
// });

// chrome.runtime.onConnect.addListener(function (port) {
//     console.assert(port.name === "knockknock");
//     port.onMessage.addListener(function (msg) {
//         if (msg.joke === "Knock knock")
//             port.postMessage({ question: "Who's there?" });
//         else if (msg.answer === "Madame")
//             port.postMessage({ question: "Madame who?" });
//         else if (msg.answer === "Madame... Bovary")
//             port.postMessage({ question: "I don't get it." });
//     });
// });

window.addEventListener('load', () => {
    setTimeout(() => {
      let usernameField = document.querySelector('input[name="username"]');
      let passwordField = document.querySelector('input[name="password"]');
      if (usernameField && passwordField) {
        usernameField.value = 'xxxxzzz';
        passwordField.value = 'yyyy';
        console.log('fields are filled')
      }
    }, 1000); // Wait for the popup to close
  });
  