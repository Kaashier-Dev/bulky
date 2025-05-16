// Constants for the delay and selectors used in the script
const deleteDelay = 800; // Delay between delete actions in milliseconds
const cmntsQuery = 'div[data-type="comment"]:not(.hidden)'; // Selector to find visible comments
const postsQuery = 'div[data-type="link"]:not(.hidden)'; // Selector to find visible comments
const cmntChckBoxQuery = 'input.blky-cmnt-checkbox[type="checkbox"]'; // Selector for checkboxes inside comments
const postChckBoxQuery = 'input.blky-post-checkbox[type="checkbox"]'; // Selector for checkboxes inside comments
const dltBtnQuery = 'a[data-event-action="delete"]'; // Selector for delete buttons
const dltCnfBtnQuery =
  'span.option.error.active > a.yes[href="javascript:void(0)"]'; // Selector for confirmation delete buttons
const cmntChckBoxClass = "blky-cmnt-checkbox"; // Class name for checkboxes, for styling or tracking
const postChckBoxClass = "blky-post-checkbox";
const nextBtnQuery = "div.nav-buttons span.nextprev span.next-button a";
const prevBtnQuery = "span.nextprev span.next-button a.nofollow.next";

let cmnts = document.querySelectorAll(cmntsQuery); // Initialize comments node list
let posts = document.querySelectorAll(postsQuery); // Initialize comments node list
let isAllChecked = false; // Flag to track whether all checkboxes are selected

let processStartTime = Date.now(); // store start time in ms

/**
 * Creates checkboxes for each visible comment.
 * If a comment doesn't already have a checkbox, one will be created and inserted at the beginning of the div.
 */
function createCheckboxes() {
  console.log("Creating checkboxes for visible comments.");

  cmnts.forEach((div, index) => {
    const existingCheckbox = div.querySelector(cmntChckBoxQuery);

    // If no checkbox exists for the comment, create one
    if (!existingCheckbox) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = cmntChckBoxClass; // Assign class for styling or tracking
      div.prepend(checkbox); // Insert checkbox at the beginning of the comment div
    }
  });

  posts.forEach((div, index) => {
    const existingCheckbox = div.querySelector(postChckBoxQuery);

    // If no checkbox exists for the comment, create one
    if (!existingCheckbox) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = postChckBoxClass; // Assign class for styling or tracking
      div.prepend(checkbox); // Insert checkbox at the beginning of the comment div
    }
  });
}

/**
 * Presses the delete button for each selected comment, with an optional delay.
 * If delayed, the deletions happen sequentially with a delay between each.
 *
 * @param {string} query - The selector for the delete button.
 * @param {string} elementQuery - The selector for the delete element.
 * @param {string} checkBoxQuery - The selector for the delete element.
 * @param {boolean} delayed - Flag to indicate whether the delete actions should be delayed.
 */
function pressDelete(query, elementQuery, checkBoxQuery, delayed = false) {
  cmnts = document.querySelectorAll(elementQuery); // Update the comments list

  // Handle case where no comments are found
  if (!cmnts || cmnts.length === 0) {
    console.error("No comments found for deletion.");
    return;
  }

  cmnts.forEach((div, index) => {
    const checkbox = div.querySelector(checkBoxQuery);

    // If the comment is checked, find and click the delete button
    if (checkbox && checkbox.checked) {
      const deleteBtn = div.querySelector(query);
      // console.log(cmnts[index].innerHTML);
      if (deleteBtn) {
        let clickDelay = delayed ? (deleteDelay / 2) * index : 0; // Calculate delay if needed

        // Delay the button click to simulate sequential deletions
        setTimeout(() => {
          // console.log("pressing delete button");
          deleteBtn.click();
        }, clickDelay * index);

        // Uncheck the checkbox if delayed
        if (delayed) checkbox.checked = false;
      } else {
        // Log an error if the delete button is not found for a comment
        console.error(`Delete button not found for comment: ${div.innerHTML}`);
      }
    }
  });
}

// Initialize checkboxes on page load
createCheckboxes();

// Listen for messages from the popup script
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "deleteComments") {
    deleteElements(cmntsQuery, cmntChckBoxQuery, "comment");
  } else if (message.action === "deletePosts") {
    deleteElements(postsQuery, postChckBoxQuery, "post");
  }

  // Toggle the selection of all comments when the corresponding action is triggered
  else if (message.action === "toggleComments") {
    toggleElements(cmntChckBoxQuery);
  } else if (message.action === "togglePosts") {
    toggleElements(postChckBoxQuery);
  } else if (message.action === "deleteAllComments") {
    deleteAll(cmntsQuery, "Comments");
  } else if (message.action === "deleteAllPosts") {
    deleteAll(postsQuery, "Posts");
  }
});
function deleteElements(elementQuery, checkBoxQuery, elementType) {
  let cLength = 0;
  let cCheckboxes = document.querySelectorAll(`${checkBoxQuery}:checked`);

  // Check if any comments are selected
  if (cCheckboxes) {
    cLength = cCheckboxes.length;
  }

  // If no comments are selected, alert the user and do nothing
  if (cLength === 0) {
    alert(`No ${elementType}s selected for deletion.`);
  } else {
    // First call: Click delete buttons for each selected comment
    pressDelete(dltBtnQuery, elementQuery, checkBoxQuery);

    // Second call: After a delay, click confirmation buttons to confirm deletion
    setTimeout(() => {
      if (
        confirm(`Are you sure you want to delete ${cLength} ${elementType}s?`)
      ) {
        cmnts = document.querySelectorAll(cmntsQuery); // Update the comments list
        posts = document.querySelectorAll(postsQuery); // Update the posts list

        // Perform the second deletion phase: confirmation button click
        pressDelete(dltCnfBtnQuery, elementQuery, checkBoxQuery, true);
      } else {
        // If user cancels, reload the page
        window.location.reload();
      }
    }, getRandomDelay()); // Delay based on the delete delay for one comment to let UI update
    createCheckboxes(); // Ensure checkboxes are re-created after deletion
  }
}

function toggleElements(checkBoxQuery) {
  isAllChecked = !isAllChecked; // Invert the selection state
  console.log(`All checkboxes will be set to: ${isAllChecked}`);

  const checkboxes = document.querySelectorAll(checkBoxQuery);

  // Check if checkboxes exist before attempting to toggle them
  if (checkboxes) {
    checkboxes.forEach((checkbox) => {
      checkbox.checked = isAllChecked; // Set each checkbox to the new selection state
    });
  } else {
    console.error("No checkboxes found to toggle.");
  }
}

/**
 * Deletes all comments in a profile by repeatedly loading new sets of comments.
 */
function deleteAll(elementQuery, elementType, askConfirmation = true) {
  let isblkyRedditDeletionStarted = sessionStorage.getItem(
    `blkyRedditDeletionStarted${elementType}`
  );
  let nxtBtn = document.querySelector(nextBtnQuery);

  if (
    (!isblkyRedditDeletionStarted || isblkyRedditDeletionStarted === "false") &&
    askConfirmation
  ) {
    setProcessStartTime();
  }

  if (askConfirmation || isblkyRedditDeletionStarted === "true") {
    if (
      !askConfirmation ||
      confirm(
        `Are you sure you want to delete all ${elementType}? This action cannot be reversed.`
      )
    ) {
      showProcessModal(elementType);
      console.log(
        askConfirmation
          ? "Starting"
          : "Resuming" + ` complete deletion of ${elementType}`
      );
      let elements = document.querySelectorAll(elementQuery);
      elements.forEach((e, index) => {
        let btn = e.querySelector(dltBtnQuery);
        btn.click();
      });
      elements = document.querySelectorAll(elementQuery);

      elements.forEach((e, index) => {
        let clickDelay = getRandomDelay() * index;
        let dltCnfBtn = e.querySelector(dltCnfBtnQuery);
        setTimeout(() => {
          dltCnfBtn.click();
          if (index == elements.length - 1) {
            console.log(`All ${elementType} deleted, reloading tab...`);

            setTimeout(() => {
              nxtBtn = document.querySelector(nextBtnQuery);
              if (nxtBtn == null) {
                clearProcessStartTime();
                openThankYouPage();
                sessionStorage.removeItem(
                  `blkyRedditDeletionStarted${elementType}`
                );
              }

              window.location.reload(); // Reload after a short delay
            }, 4000);
          }
        }, clickDelay);
      });
      nxtBtn = document.querySelector(nextBtnQuery);
      if (nxtBtn != null) {
        sessionStorage.setItem(
          `blkyRedditDeletionStarted${elementType}`,
          "true"
        );
      }
    }
  }
}

function getRandomDelay(min = 800, max = 2000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isRateLimitPage() {
  return (
    document.title.includes("429") ||
    document.body.innerText.includes("Too Many Requests") ||
    document.body.innerText.includes("OLD_REDDIT_URL") ||
    document.body.innerText.includes("Error code: 429") ||
    document.body.innerText.includes("you are doing that too much")
  );
}

if (isRateLimitPage()) {
  console.warn("⚠️ Detected 429 rate limit page");
  handle429Error(); // your delay logic here
}

function shouldPauseDueToRateLimit() {
  const startTime = sessionStorage.getItem("bulkyProcessStart");
  if (!startTime) return false;

  const now = Date.now();
  return now - Number(startTime) < PAUSE_DURATION_MS;
}

function setProcessStartTime() {
  const startTime = Date.now();
  console.log(`Setting process start time : ${startTime}`);
  sessionStorage.setItem("bulkyProcessStart", startTime);
}

function getProcessStartTime(resetTime = false) {
  const stored = sessionStorage.getItem("bulkyProcessStart");

  if (!stored) {
    const now = Date.now();
    setProcessStartTime();
    return now;
  } else {
    const startTime = parseInt(stored);
    return startTime;
  }
}

function didProcessExpire(expiryInMinutes = 15) {
  const stored = sessionStorage.getItem("bulkyProcessStart");
  if (!stored) {
    return true;
  } else {
    const now = Date.now();
    const startTime = parseInt(stored);

    const diffMinutes = (now - startTime) / (1000 * 60);

    if (diffMinutes > expiryInMinutes) {
      clearProcessStartTime();
      return true; // expired
    } else {
      return false;
    }
  }
}

function clearProcessStartTime() {
  sessionStorage.removeItem("bulkyProcessStart");
}

function handle429Error() {
  const now = Date.now();
  const TEN_MINUTES = 10 * 60 * 1000;

  let processStartTime = getProcessStartTime();

  const elapsed = now - processStartTime;
  const remaining = TEN_MINUTES - elapsed;

  if (remaining > 0) {
    show429Modal();
    console.log(
      `⏳ Waiting ${Math.ceil(remaining / 1000)} seconds due to 429...`
    );
    setTimeout(() => {
      console.log("🔄 Resuming after 10 minutes total.");
      window.location.reload(); // or resume your process
    }, remaining);
  } else {
    console.log("🔄 10 minutes already passed, resuming immediately.");
    window.location.reload(); // or resume your process
  }
}

deleteAll(cmntsQuery, "Comments", false);
deleteAll(postsQuery, "Posts", false);

function show429Modal() {
  let notificationContainerId = "bulky-429-modal-container"; // Give it an ID
  let notificationContainer = document.getElementById(notificationContainerId);

  if (notificationContainer) {
    // If the container exists, do nothing.
    return;
  }
  notificationContainer = document.createElement("div");
  notificationContainer.id = notificationContainerId; // Set the ID
  notificationContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3); /* Semi-transparent background */
    display: flex;
    justify-content: center; /* Center horizontally */
    align-items: center; /* Center vertically */
    z-index: 1000;
    padding: 20px;
    box-sizing: border-box;
  `;
  document.body.appendChild(notificationContainer);

  // White Modal Container
  const modalContainer = document.createElement("div");
  modalContainer.style.cssText = `
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center; /* Center content within the modal */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Add a shadow for better visibility */
    max-width: 90%; /* Ensure modal doesn't get too wide on large screens */
    width: fit-content; /* Adjust width to content */
  `;
  notificationContainer.appendChild(modalContainer);

  // Top Center Icon
  const icon = document.createElement("img");
  icon.src = browser.runtime.getURL("src/bulky.webp"); // Replace with your actual icon path
  icon.style.cssText = `
    width: 100; /* Adjust size as needed */
    height: 50px;
    margin-top: 20px; /* Adjust top margin as needed */
  `;
  modalContainer.appendChild(icon);

  // Bottom Center Button
  const reloadButton = document.createElement("button");
  reloadButton.textContent = "Reload Page";
  reloadButton.style.cssText = `
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    background-color: #4CAF50; /* Green button */
    color: white;
    border: none;
    border-radius: 5px;
    margin-top: 30px; /* Adjust top margin to position from icon*/
    margin-bottom: 0;
  `;
  reloadButton.addEventListener("click", () => {
    window.location.reload();
  });
  modalContainer.appendChild(reloadButton);

  // Optional: Add a message between the icon and button
  const message = document.createElement("p");
  message.textContent =
    "The page encountered a temporary issue.\nBulky will reload automatically after a few minutes.";
  message.style.cssText = `
    color: #333; /* Use a dark color for text on white background */
    font-size: 18px;
    text-align: center;
    margin-top: 20px;
    margin-bottom: 20px;
    white-space: pre-line; /* Preserve line breaks */
  `;
  modalContainer.insertBefore(message, reloadButton);
}

function showProcessModal(elementType = "content") {
  let notificationContainerId = "bulky-process-modal-container"; // Give it an ID
  let notificationContainer = document.getElementById(notificationContainerId);

  if (notificationContainer) {
    // If the container exists, do nothing.
    return;
  }
  notificationContainer = document.createElement("div");
  notificationContainer.id = notificationContainerId; // Set the ID
  notificationContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3); /* Semi-transparent background */
    display: flex;
    justify-content: center; /* Center horizontally */
    align-items: center; /* Center vertically */
    z-index: 1000;
    padding: 20px;
    box-sizing: border-box;
  `;
  document.body.appendChild(notificationContainer);

  // White Modal Container
  const modalContainer = document.createElement("div");
  modalContainer.style.cssText = `
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center; /* Center content within the modal */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Add a shadow for better visibility */
    max-width: 90%; /* Ensure modal doesn't get too wide on large screens */
    width: fit-content; /* Adjust width to content */
  `;
  notificationContainer.appendChild(modalContainer);

  // Top Center Icon
  const icon = document.createElement("img");
  icon.src = browser.runtime.getURL("src/bulky.webp"); // Replace with your actual icon path
  icon.style.cssText = `
    width: 100; /* Adjust size as needed */
    height: 50px;
    margin-top: 20px; /* Adjust top margin as needed */
  `;
  modalContainer.appendChild(icon);

  // Bottom Center Button
  const reloadButton = document.createElement("button");
  reloadButton.textContent = "STOP";
  reloadButton.style.cssText = `
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    background-color:rgb(211, 62, 62); /* Green button */
    color: white;
    border: none;
    border-radius: 5px;
    margin-top: 30px; /* Adjust top margin to position from icon*/
    margin-bottom: 0;
  `;
  reloadButton.addEventListener("click", () => {
    sessionStorage.removeItem(`blkyRedditDeletionStartedPosts`);
    sessionStorage.removeItem(`blkyRedditDeletionStartedComments`);
    clearProcessStartTime();
    console.log("Deletion cancelled. Session storage updated");
    window.location.reload();
  });
  modalContainer.appendChild(reloadButton);

  // Optional: Add a message between the icon and button
  const message = document.createElement("p");
  message.textContent = `ATTENTION: ALL of your Reddit ${elementType} are being deleted. You can leave this tab open in the background and carry on with your life. If it reaches an error page, Bulky will automatically wait, reload the page and continue. If you want to STOP, then click the button below.`;
  message.style.cssText = `
    color: #333; /* Use a dark color for text on white background */
    font-size: 18px;
    text-align: center;
    margin-top: 20px;
    margin-bottom: 20px;
    white-space: pre-line; /* Preserve line breaks */
  `;
  modalContainer.insertBefore(message, reloadButton);
}

function openThankYouPage() {
  browser.runtime.sendMessage({ action: "openThankYouPage" });
}
