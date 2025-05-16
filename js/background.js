chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openThankYouPage") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("thankyou.html"),
    });
  }
});
