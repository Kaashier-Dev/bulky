// Constants for the delay and selectors used in the script
const deleteDelay = 500; // Delay between delete actions in milliseconds
const cmntsQuery = 'div[data-type="comment"]:not(.hidden)'; // Selector to find visible comments
const checkboxQuery = 'input.blky-row-checkbox[type="checkbox"]'; // Selector for checkboxes inside comments
const dltBtnQuery = 'a[data-event-action="delete"]'; // Selector for delete buttons
const dltCnfBtnQuery =
  'span.option.error.active > a.yes[href="javascript:void(0)"]'; // Selector for confirmation delete buttons
const checkBoxClass = "blky-row-checkbox"; // Class name for checkboxes, for styling or tracking

let cmnts = document.querySelectorAll(cmntsQuery); // Initialize comments node list
let isAllChecked = false; // Flag to track whether all checkboxes are selected

/**
 * Creates checkboxes for each visible comment.
 * If a comment doesn't already have a checkbox, one will be created and inserted at the beginning of the div.
 */
function createCheckboxes() {
  console.log("Creating checkboxes for visible comments.");

  cmnts.forEach((div, index) => {
    const existingCheckbox = div.querySelector(checkboxQuery);

    // If no checkbox exists for the comment, create one
    if (!existingCheckbox) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = checkBoxClass; // Assign class for styling or tracking
      div.prepend(checkbox); // Insert checkbox at the beginning of the comment div
    }
  });
}

/**
 * Presses the delete button for each selected comment, with an optional delay.
 * If delayed, the deletions happen sequentially with a delay between each.
 *
 * @param {string} query - The selector for the delete button.
 * @param {boolean} delayed - Flag to indicate whether the delete actions should be delayed.
 */
function pressDelete(query, delayed = false) {
  cmnts = document.querySelectorAll(cmntsQuery); // Update the comments list

  // Handle case where no comments are found
  if (!cmnts || cmnts.length === 0) {
    console.error("No comments found for deletion.");
    return;
  }

  cmnts.forEach((div, index) => {
    const checkbox = div.querySelector(checkboxQuery);

    // If the comment is checked, find and click the delete button
    if (checkbox && checkbox.checked) {
      const deleteBtn = div.querySelector(query);
      if (deleteBtn) {
        let clickDelay = delayed ? (deleteDelay / 2) * index : 0; // Calculate delay if needed

        // Delay the button click to simulate sequential deletions
        setTimeout(() => {
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

/**
 * Toggles the selection of all comment checkboxes.
 * If all are selected, it will uncheck them; if none are selected, it will check all.
 */
function toggleAllCheckboxes() {
  isAllChecked = !isAllChecked; // Invert the selection state
  console.log(`All checkboxes will be set to: ${isAllChecked}`);

  const checkboxes = document.querySelectorAll(checkboxQuery);

  // Check if checkboxes exist before attempting to toggle them
  if (checkboxes) {
    checkboxes.forEach((checkbox) => {
      checkbox.checked = isAllChecked; // Set each checkbox to the new selection state
    });
  } else {
    console.error("No checkboxes found to toggle.");
  }
}

// Initialize checkboxes on page load
createCheckboxes();

// Listen for messages from the popup script
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "pressDelete") {
    let cLength = 0;
    let cCheckboxes = document.querySelectorAll(`${checkboxQuery}:checked`);

    // Check if any comments are selected
    if (cCheckboxes) {
      cLength = cCheckboxes.length;
    }

    // If no comments are selected, alert the user and do nothing
    if (cLength === 0) {
      alert("No comments selected for deletion.");
    } else {
      // First call: Click delete buttons for each selected comment
      pressDelete(dltBtnQuery);

      // Second call: After a delay, click confirmation buttons to confirm deletion
      setTimeout(() => {
        if (confirm(`Are you sure you want to delete ${cLength} comments?`)) {
          cmnts = document.querySelectorAll(cmntsQuery); // Update the comments list

          // Perform the second deletion phase: confirmation button click
          pressDelete(dltCnfBtnQuery, true);
        } else {
          // If user cancels, reload the page
          window.location.reload();
        }
      }, deleteDelay); // Delay based on the delete delay for one comment to let UI update
      createCheckboxes(); // Ensure checkboxes are re-created after deletion
    }
  }

  // Toggle the selection of all comments when the corresponding action is triggered
  if (message.action === "toggleComments") {
    toggleAllCheckboxes();
  }
});
