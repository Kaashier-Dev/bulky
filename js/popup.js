document.addEventListener("DOMContentLoaded", () => {
  const generalSection = document.getElementById("blky-sites-section");

  const redditOptions = document.getElementById("blky-rdt-options");

  // Query the current active tab
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    const activeTab = tabs[0];
    if (activeTab.url.includes("old.reddit.com")) {
      // Show Reddit-specific tools
      redditOptions.classList.remove("hidden");
      generalSection.classList.add("hidden");
    }
  });

  document
    .getElementById("blky-rdt-delete-comments")
    .addEventListener("click", () => {
      // Get the active tab
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then((tabs) => {
          // Send a message to the content script in the active tab
          browser.tabs.sendMessage(tabs[0].id, { action: "deleteComments" });
        })
        .catch((error) => {
          console.error("Error sending message to content script:", error);
        });
    });
  document
    .getElementById("blky-rdt-toggle-comments")
    .addEventListener("click", () => {
      // Get the active tab
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then((tabs) => {
          // Send a message to the content script in the active tab
          browser.tabs.sendMessage(tabs[0].id, { action: "toggleComments" });
        })
        .catch((error) => {
          console.error("Error sending message to content script:", error);
        });
    });

  document
    .getElementById("blky-rdt-toggle-posts")
    .addEventListener("click", () => {
      // Get the active tab
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then((tabs) => {
          // Send a message to the content script in the active tab
          browser.tabs.sendMessage(tabs[0].id, { action: "togglePosts" });
        })
        .catch((error) => {
          console.error("Error sending message to content script:", error);
        });
    });
  document
    .getElementById("blky-rdt-delete-posts")
    .addEventListener("click", () => {
      // Get the active tab
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then((tabs) => {
          // Send a message to the content script in the active tab
          browser.tabs.sendMessage(tabs[0].id, { action: "deletePosts" });
        })
        .catch((error) => {
          console.error("Error sending message to content script:", error);
        });
    });

  document
    .getElementById("blky-rdt-delete-all-comments")
    .addEventListener("click", () => {
      // Get the active tab
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then((tabs) => {
          // Send a message to the content script in the active tab
          browser.tabs.sendMessage(tabs[0].id, { action: "deleteAllComments" });
        })
        .catch((error) => {
          console.error("Error sending message to content script:", error);
        });
    });
});
