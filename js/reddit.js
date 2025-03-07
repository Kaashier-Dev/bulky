// Constants for the delay and selectors used in the script
const deleteDelay = 500; // Delay between delete actions in milliseconds
const cmntsQuery = 'div[data-type="comment"]:not(.hidden)'; // Selector to find visible comments
const postsQuery = 'div[data-type="link"]:not(.hidden)'; // Selector to find visible comments
const cmntChckBoxQuery = 'input.blky-cmnt-checkbox[type="checkbox"]'; // Selector for checkboxes inside comments
const postChckBoxQuery = 'input.blky-post-checkbox[type="checkbox"]'; // Selector for checkboxes inside comments
const dltBtnQuery = 'a[data-event-action="delete"]'; // Selector for delete buttons
const dltCnfBtnQuery =
  'span.option.error.active > a.yes[href="javascript:void(0)"]'; // Selector for confirmation delete buttons
const cmntChckBoxClass = "blky-cmnt-checkbox"; // Class name for checkboxes, for styling or tracking
const postChckBoxClass = "blky-post-checkbox";
const nextBtnQuery = "span.nextprev span.next-button a.nofollow.next";
const prevBtnQuery = "span.nextprev span.next-button a.nofollow.next";

let cmnts = document.querySelectorAll(cmntsQuery); // Initialize comments node list
let posts = document.querySelectorAll(postsQuery); // Initialize comments node list
let isAllChecked = false; // Flag to track whether all checkboxes are selected

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
      console.log(cmnts[index].innerHTML);
      if (deleteBtn) {
        let clickDelay = delayed ? (deleteDelay / 2) * index : 0; // Calculate delay if needed

        // Delay the button click to simulate sequential deletions
        setTimeout(() => {
          console.log("pressing delete button");
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
    deleteAllComments(cmntsQuery);
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
    }, deleteDelay); // Delay based on the delete delay for one comment to let UI update
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
function deleteAllComments(elementQuery) {
  console.log("Delete all comments");
  if (
    confirm(
      `Are you sure you want to delete all comments? This action cannot be reversed.`
    )
  ) {
    let elements = document.querySelectorAll(elementQuery);
    elements.forEach((e, index) => {
      let btn = e.querySelector(dltBtnQuery);
      btn.click();
    });
    elements = document.querySelectorAll(elementQuery);

    elements.forEach((e, index) => {
      let clickDelay = delayed ? (deleteDelay / 2) * index : 0;
      let dltCnfBtn = document.querySelector(dltCnfBtnQuery);
      setTimeout(() => {
        dltCnfBtn.click();
      }, clickDelay * index);
    });
  }
}
