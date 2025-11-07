function $(selector) {
  return document.querySelector(selector);
} // Selects the first element matching the selector
function $$(selector) {
  return document.querySelectorAll(selector);
} // Selects all elements matching the selector
// Every comments are written at the end of the statement

let tasks = JSON.parse(localStorage.getItem("tasks")) || {}; // Initialize tasks from local storage. If no tasks are found, initialize with an empty object
const currentDay = new Date().toLocaleString("en-us", {
  weekday: "short",
}); // Get the current day in short format (e.g., "Mon", "Tue", etc.)
const tabsContainer = $(".tabs"); // Get the container for the tabs
const taskList = $("#taskList"); // Get the task list element
let activeTab = currentDay; // Set the active tab to the current day

const addTaskButton = $("#addTaskButton"); // Get the button to add a new task
const addTaskPopup = $("#addTaskPopup"); // Get the popup for adding a new task
const taskNameInput = $("#taskName"); // Get the input field for the task name
const closePopupButton = $("#closePopup"); // Get the button to close the popup

const editPopup = $("#editPopup"); // Get the popup for editing a task
const editTaskNameInput = $("#editTaskName"); // Get the input field for editing the task name
const editSave = $("#editSave"); // Get the button to save the edited task
const editClosePopup = $("#editClosePopup"); // Get the button to close the edit popup
const editPriority = $$(".editImportance input"); // Get the radio buttons for task priority
const classCounter = $(".classCounter"); // Get the element to display the task count

const plusBtn = $(".fa-circle-xmark"); // Get the plus button for adding a new task
const dragArea = $(".drag-area"); // Get the area for dragging and dropping tasks
const shadowPopup = $(".shadow-popup"); // Get the shadow popup element
const addaBreakButton = $(".addaBreak"); // Get the button to add a break
const taskTime = $("#taskTime"); // Get the element to display the task time
const taskTime2 = $("#taskTime2"); // Get the element to display the task time

function initializeTabs() {
  tabsContainer.innerHTML = ""; // Clear existing tabs to avoid duplicates
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((day) => {
    const button = document.createElement("button"); // Create a new button for each day of the week
    button.textContent = day; // Set the button text to the day of the week
    button.className = `tab-button ${day === currentDay ? "active" : ""}`; // Set the button text and class
    button.onclick = () => switchTab(day); // Set the onclick event to switch tabs
    tabsContainer.appendChild(button); // Append the button to the tabs container
  }); // Create buttons for each day of the week
  displayTasks(); // Display tasks for the current day
} // Initialize the tabs with the days of the week

function switchTab(day) {
  activeTab = day; // Set the active tab to the selected day
  $$(".tab-button").forEach((btn) => {
    btn.classList.toggle("active", btn.textContent === day); // Toggle the active class based on the selected day
  }); // Switch the active class to the selected tab
  displayTasks(); // Display tasks for the selected day
} // Switch to the selected tab and display tasks for that day
//--------------------------------------------------------------------------------

function displayTasks() {
  taskList.innerHTML = ""; // Clear the task list before displaying new tasks
  tasks = JSON.parse(localStorage.getItem("tasks")) || {}; // Update tasks from local storage
  const dayTasks = tasks[activeTab] || []; // Get tasks for the active tab or an empty array if none exist
  dayTasks.forEach((task, index) => {
    const taskItem = document.createElement("li"); // Create a new list item for each task
    taskItem.setAttribute("data-id", task.id); // Set a data attribute for the task ID
    taskItem.className = "task-item"; // Set the class for the task item
    taskItem.className += ` ${task.priority}`; // Add the priority class to the task item
    taskItem.innerHTML = `
            <span class="checkbox">${
              task.completed
                ? "<i class='fa-solid fa-circle-check'></i>"
                : "<i class='fa-regular fa-circle-check'></i>"
            }</span>
            <span class="time">${task.time}</span>
            <div class="task-name ${task.completed ? "completed" : ""}">${
      task.name
    }</div>
            <button class="edit"><i class="fa-regular fa-pen-to-square"></i></button>
            <button class="delete"><i class="fa-regular fa-trash-can"></i></button>
          `; // Create the inner HTML for the task item
    // -------------------------------------------------------------------------------
    const checkbox = taskItem.querySelector(".checkbox"); // Get the checkbox for the task
    const editButton = taskItem.querySelector(".edit"); // Get the edit button
    const deleteButton = taskItem.querySelector(".delete"); // Get the delete button
    if (task.addaBreak) {
      editButton.style.visibility = "hidden"; // Hide the edit button if the task is a break
    }

    checkbox.addEventListener("pointerdown", (e) => {
      e.stopPropagation(); // Prevent event bubbling
      toggleCompletion(index); // Toggle the completion status of the task
      console.log("checkbox");
    });
    editButton.addEventListener("pointerdown", (e) => {
      e.stopPropagation(); // Prevent event bubbling
      editTask(index); // Edit the task when the edit button is clicked
      console.log("edit");
    });
    deleteButton.addEventListener("pointerdown", (e) => {
      e.stopPropagation(); // Prevent event bubbling
      deleteTask(index); // Delete the task when the delete button is clicked
      console.log("delete");
    });
    // -------------------------------------------------------------------------------

    taskList.appendChild(taskItem); // Append the task item to the task list
    countClass(); // Update the task count
  }); // Append each task to the task list
} // Display tasks for the active tab
//--------------------------------------------------------------------------------

function toggleCompletion(index) {
  tasks[activeTab][index].completed = !tasks[activeTab][index].completed;
  saveTasks();
  displayTasks();
} // Toggle the completion status of a task

//--------------------------------------------------------------------------------
let indexPreserve = 0; // Variable to preserve the index of the task being edited
function editTask(index) {
  editPopup.style.display = "flex"; // Show the edit popup
  editTaskNameInput.value = tasks[activeTab][index].name; // Set the input field to the current task name
  editPriority.forEach((radio) => {
    radio.checked = false; // Uncheck all radio buttons
    if (radio.value === tasks[activeTab][index].priority) {
      radio.checked = true; // Check the radio button that matches the task's priority
    }
  }); // Set the radio button for the task's priority

  indexPreserve = index; // Preserve the index of the task being edited
  editClosePopup.addEventListener("click", () => {
    shadowPopup.style.display = "none"; // Show the shadow popup
    editPopup.style.display = "none"; // Hide the edit popup when the close button is clicked
    editTaskNameInput.value = ""; // Clear the input field
  }); // Close the edit popup when the close button is clicked
}

editSave.addEventListener("click", () => {
  const newTaskName = editTaskNameInput.value.trim(); // Get the new task name from the input field
  const selectedPriority = $(".editImportance input:checked")?.value; // Get the selected priority from the radio buttons
  const taskTimeValue = taskTime2.value; // Get the task time from the input field
  if (newTaskName && selectedPriority) {
    tasks[activeTab][indexPreserve].priority = selectedPriority; // Update the task priority
    tasks[activeTab][indexPreserve].name = newTaskName; // Update the task name
    tasks[activeTab][indexPreserve].time = taskTimeValue; // Update the task time
    saveTasks();
    displayTasks();
    editPopup.style.display = "none"; // Hide the edit popup
    shadowPopup.style.display = "none"; // Show the shadow popup
    editTaskNameInput.value = ""; // Clear the input field
  }
}); // Save the edited task when the save button is clicked

//--------------------------------------------------------------------------------

function deleteTask(index) {
  tasks[activeTab].splice(index, 1); // Remove the task from the list
  saveTasks();
  displayTasks();
} // Delete a task from the list
//--------------------------------------------------------------------------------

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks)); // Save tasks to local storage
} // Save tasks to local storage
//--------------------------------------------------------------------------------

function saveTask() {
  const taskName = taskNameInput.value.trim();
  const selectedDays = Array.from($$(".weekdays-container input:checked")).map(
    (checkbox) => checkbox.value
  ); // Get selected days from checkboxes
  const selectedPriority = $(".importance input:checked")?.value; // Get selected priority from checkboxes

  if (taskName && selectedDays.length && selectedPriority) {
    selectedDays.forEach((day) => {
      tasks[day] = tasks[day] || []; // Initialize the day if it doesn't exist
      tasks[day].push({
        id: Date.now() + Math.random(), // Unique id
        name: taskName,
        completed: false,
        priority: selectedPriority,
        time: taskTime.value, // Get the task time from the input field
      }); // Add the new task to the selected days
    });
    saveTasks();
    shadowPopup.style.display = "none"; // Hide the shadow popup when clicking outside
    taskNameInput.value = ""; // Clear input field
    $$(".weekdays-container input:checked").forEach(
      (checkbox) => (checkbox.checked = false)
    ); // Clear checkboxes
    addTaskPopup.style.display = "none"; // Hide the popup
    plusBtn.classList.remove("rotatePlus"); // Rotate the button back to its original position
    displayTasks(); // Show the updated tasks
  }
} // Save a new task to the list
//--------------------------------------------------------------------------------

function rotatePlus() {
  plusBtn.classList.toggle("rotatePlus"); // Rotate the button when clicked
} // Rotate the add task button

addTaskButton.addEventListener("click", () => {
  if (!plusBtn.classList.contains("rotatePlus")) {
    rotatePlus(); // Rotate the button when clicked
    addTaskPopup.style.display = "flex"; // Show the popup to add a new task
    shadowPopup.style.display = "block"; // Show the shadow popup
  } else {
    addTaskPopup.style.display = "none"; // Hide the popup when the close button is clicked
    shadowPopup.style.display = "none"; // Hide the popup when the close button is clicked
    rotatePlus(); // Rotate the button back to its original position
  }
}); // Show the popup to add a new task
//--------------------------------------------------------------------------------

function resetTasksIfDateChanged() {
  const lastResetDate = localStorage.getItem("lastResetDate");
  const today = new Date().toLocaleDateString(); // Get current date in 'MM/DD/YYYY' format

  // If there's no last reset date or the date has changed
  if (lastResetDate !== today) {
    // Reset task completion statuses
    for (const key in tasks) {
      tasks[key].forEach((e) => (e.completed = false));
    }
    // Update the tasks in local storage
    localStorage.setItem("tasks", JSON.stringify(tasks)); // Save the updated tasks

    // Save the new reset date
    localStorage.setItem("lastResetDate", today); // Update the last reset date
  }
} // Reset tasks if the date has changed
//--------------------------------------------------------------------------------

// Call this function on page load
window.onload = () => {
  initializeTabs(); // Initialize the tabs with days of the week
  resetTasksIfDateChanged(); // Ensure tasks are reset if the date has changed
  countClass(); // Update the task count
  tickTheClassByTheTime(); // Call the function to mark tasks as completed based on the time
  const timeEnd = setInterval(tickTheClassByTheTime, 10000); // Check every 10 seconds
  $("#loading").style.display = "none"; // Hide the loading screen
}; // Call the function to reset tasks if the date has changed

//--------------------------------------------------------------------------------

function saveSorted() {
  const items = JSON.parse(localStorage.getItem("tasks"));
  const dudu = Array.from(dragArea.children).map((task) => {
    return task.getAttribute("data-id"); // Use the unique id
  });

  let arr = [];

  dudu.forEach((id) => {
    const found = items[activeTab].find((f) => f.id == id); // Find the task by id
    if (found) arr.push(found); // Find the task by id and push it to the array
  }); // Find the task by id and push it to the array

  items[activeTab] = arr; // Update the tasks for the active tab

  localStorage.setItem("tasks", JSON.stringify(items));
  displayTasks();
}

// Initialize SortableJS
new Sortable(dragArea, {
  animation: 300,
  onEnd: saveSorted, // Save tasks after sorting
});
//--------------------------------------------------------------------------------

initializeTabs();

// Shadow popup when click + sign

shadowPopup.addEventListener("click", (e) => {
  if (e.target === shadowPopup) {
    shadowPopup.style.display = "none"; // Hide the shadow popup when clicking outside
    addTaskButton.click(); // Close the popup
  }
}); // Hide the shadow popup when clicking outside of it

//--------------------------------------------------------------------------------
// Mark tasks as completed based on the time
// This function checks the current time and marks tasks as completed if the time has passed

function tickTheClassByTheTime() {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  const retrieveTasks = JSON.parse(localStorage.getItem("tasks")) || {};

  const dayTasks = retrieveTasks[activeTab] || [];
  dayTasks.forEach((task) => {
    if (task.time) {
      // Parse task time as minutes since midnight
      const [taskHour, taskMinute] = task.time.split(":").map(Number);
      const taskTotalMinutes = taskHour * 60 + taskMinute;
      if (taskTotalMinutes <= currentTotalMinutes) {
        task.completed = true;
        if (currentTotalMinutes > 960) {
          task.completed = false; // Reset tasks after 4 PM (960 minutes)
        }
      }
    }
  });

  // Save and display updated tasks
  retrieveTasks[activeTab] = dayTasks;
  localStorage.setItem("tasks", JSON.stringify(retrieveTasks));
  displayTasks();
  if (currentTotalMinutes > 960) {
    clearInterval(timeEnd); // Stop checking after 4 PM
  }
  console.log("This is ticking the class by the time function");
}

//---------------------------------------------------------------------
// Add a break task
function addaBreak() {
  const aBreak = "xxxxxxxxxx"; // Define a break task
  taskNameInput.value = aBreak; // Set the input field to the break task
  const taskName = taskNameInput.value.trim();
  tasks[activeTab] = tasks[activeTab] || []; // Initialize the day if it doesn't exist
  tasks[activeTab].push({
    id: Date.now() + Math.random(), // Unique id
    name: taskName,
    completed: false,
    priority: "low",
    addaBreak: true,
    time: taskTime.value, // Get the task time from the input field
  }); // Add the new task to the selected days

  saveTasks();
  shadowPopup.style.display = "none"; // Hide the shadow popup when clicking outside
  taskNameInput.value = ""; // Clear input field
  $$(".weekdays-container input:checked").forEach(
    (checkbox) => (checkbox.checked = false)
  ); // Clear checkboxes
  $$(".importance input:checked").forEach(
    (checkbox) => (checkbox.checked = false)
  ); // Clear radio buttons
  addTaskPopup.style.display = "none"; // Hide the popup
  plusBtn.classList.remove("rotatePlus"); // Rotate the button back to its original position
  displayTasks(); // Show the updated tasks
}

// -------------------------------------------------
// Count the number of classes
function countClass() {
  let count = 0;
  const retrieveTasks = JSON.parse(localStorage.getItem("tasks"));
  for (const key in retrieveTasks) {
    retrieveTasks[key].forEach((e) => {
      if (e.addaBreak === true) {
        count++; // Count the number of tasks for the active tab
      }
    });
  }

  let count2 = 0;
  for (i in tasks) {
    count2 += tasks[i].length; // Count the number of tasks for the active tab
  } // Count the number of tasks for the active tab
  classCounter.innerHTML = `Total Classes: ${count2 - count}`; // Update the task count
}

// -------------------------------------------------------------------
