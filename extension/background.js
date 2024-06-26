
// function ok(_tabId, changeInfo, _tab) {
//     if (changeInfo.url && changeInfo.url.toLowerCase().includes("scrambleid.com")) {
//         console.log("scrambleid.com");
//         chrome.runtime.sendMessage({ activatePopup: true });
//     }
// }
// function sendMessage(tabId, changeInfo, tab) {
//     debugger
//     if (changeInfo.status === 'complete') {
//         console.log("background.js running...");
//         if (tab.url && tab.url.includes("login")) {
//             console.log("scrambleid.com");
//             chrome.runtime.sendMessage({ activatePopup: true });
//         }
//     }

// }
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.activatePopup) {
//         console.log("Popup activated!");
//         document.getElementById("message").innerText = "Google search detected!";
//     }
// });

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        console.log("background.js running...");
        if (tab.url && tab.url.includes("login")) {
            chrome.windows.create({
                url: "popup.html",
                type: "popup",
                width: 400,
                height: 300
            });
        }
    }

});

