console.log("hello from service worker!!!!!")

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'your_action_name') {
      // Handle the message and perform necessary actions
      console.log('Received message:', request.data);
      // ...
    }
  });