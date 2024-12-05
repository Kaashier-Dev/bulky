const deleteDelay = 500; // Delay between delete actions
const cmntsQuery = 'div[data-type="comment"]:not(.hidden)';
const checkboxQuery = 'input.blky-row-checkbox[type="checkbox"]';
const dltBtnQuery = 'a[data-event-action="delete"]';
const dltCnfBtnQuery =
  'span.option.error.active > a.yes[href="javascript:void(0)"]';
const checkBoxClass = "blky-row-checkbox";

let cmnts = document.querySelectorAll(cmntsQuery);
let isAllChecked = false;

function createCheckboxes() {
  console.log("creating checkbox");

  cmnts.forEach((div, index) => {
    const existingCheckbox = div.querySelector(checkboxQuery);

    if (!existingCheckbox) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = checkBoxClass; // Optional, for styling or tracking
      // Insert the checkbox at the beginning of the div
      div.prepend(checkbox);
    }
  });
}

function pressDelete(query, delayed = false) {
  cmnts = document.querySelectorAll(cmntsQuery);
  if (!cmnts || cmnts.length === 0) {
    console.log("No comments found.");
    return;
  }

  cmnts.forEach((div, index) => {
    // console.log(div.innerHTML);
    const checkbox = div.querySelector(checkboxQuery);
    if (checkbox && checkbox.checked) {
      const deleteBtn = div.querySelector(query);
      if (deleteBtn) {
        console.log(deleteBtn);
        let clickDelay = delayed ? (deleteDelay / 2) * index : 0;
        console.log(clickDelay);
        setTimeout(() => deleteBtn.click(), clickDelay * index); // Add delay for sequential clicks
        if (delayed) checkbox.checked = false;
      } else {
        console.log(`Button doesn't exist. ${query}`);
      }
    }
  });
}

function toggleAllCheckboxes() {
  console.log(isAllChecked);
  isAllChecked = !isAllChecked;
  console.log(isAllChecked);

  const checkboxes = document.querySelectorAll(checkboxQuery);

  if (checkboxes) {
    checkboxes.forEach((checkbox, index) => {
      checkbox.checked = isAllChecked;
    });
  }
}

// Initialize checkboxes
createCheckboxes();

// Listen for messages from the popup script
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "pressDelete") {
    let cLength = 0;
    let cCheckboxes = document.querySelectorAll(`${checkboxQuery}:checked`);
    if (cCheckboxes) {
      cLength = cCheckboxes.length;
    }

    if (cLength == 0) {
      alert("No comments selected.");
    } else {
      // First call: Click delete buttons
      pressDelete(dltBtnQuery);

      // Second call: After a delay, click confirmation buttons
      setTimeout(() => {
        if (confirm(`Delete ${cLength} comments?`)) {
          cmnts = document.querySelectorAll(cmntsQuery);

          pressDelete(dltCnfBtnQuery, true);
        } else {
          window.location.reload();
        }
      }, deleteDelay); // Delay based on the number of comments to delete
      createCheckboxes();
    }
  }

  if (message.action === "toggleComments") {
    toggleAllCheckboxes();
  }
});
