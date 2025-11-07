function $(selector) {
  return document.querySelector(selector);
} // Selects the first element matching the selector
function $$(selector) {
  return document.querySelectorAll(selector);
} // Selects all elements matching the selector
// Every comments are written at the end of the statement

let tasks = JSON.parse(localStorage.getItem("tasks")) || {}; // Initialize tasks from local storage. If no tasks are found, initialize with an empty object
let timeEnd; // interval reference for ticking tasks
let audioCtx; // for beep sound on notifications
let wakeLock = null; // Wake lock to prevent sleep during class hours
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
const settingsButton = $("#settingsButton"); // Get the settings button
const settingsPopup = $("#settingsPopup"); // Get the settings popup

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
      const ok = window.confirm("Delete this task?");
      if (ok) {
        deleteTask(index); // Delete the task when the delete button is clicked
        console.log("delete");
      }
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
window.onload = async () => {
  try {
    initializeTabs(); // Initialize the tabs with days of the week
    resetTasksIfDateChanged(); // Ensure tasks are reset if the date has changed
    countClass(); // Update the task count
    tickTheClassByTheTime(); // Call the function to mark tasks as completed based on the time
    timeEnd = setInterval(tickTheClassByTheTime, 10000); // Check every 10 seconds
    await requestNotificationPermission(); // Ask for notification permission (wait for it)
    setupServiceWorkerMessaging(); // Listen for SW messages
    await requestWakeLock(); // Request wake lock for active class periods (wait for it)
    scheduleUpcomingNotifications(); // Pre-schedule notifications
  } catch (err) {
    console.error("Initialization error", err);
  } finally {
    const loader = $("#loading");
    if (loader) loader.style.display = "none"; // Ensure loader hides even if errors occur
  }
}; // Initialization block

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
  const todayKey = new Date().toLocaleString("en-us", { weekday: "short" });

  const dayTasks = retrieveTasks[todayKey] || [];
  let hasUpdates = false;

  dayTasks.forEach((task) => {
    if (task.time) {
      // Parse task time as minutes since midnight
      const [taskHour, taskMinute] = task.time.split(":").map(Number);
      const taskTotalMinutes = taskHour * 60 + taskMinute;
      if (taskTotalMinutes <= currentTotalMinutes) {
        task.completed = true;
        if (!task.notified && !task.addaBreak) {
          // fire a notification once when time is reached/passed
          sendTaskNotification(task);
          task.notified = true;
          hasUpdates = true;
        }
        if (currentTotalMinutes > 960) {
          task.completed = false; // Reset tasks after 4 PM (960 minutes)
        }
      }
    }
  });

  // Save and display updated tasks
  if (hasUpdates) {
    retrieveTasks[todayKey] = dayTasks;
    localStorage.setItem("tasks", JSON.stringify(retrieveTasks));
  }
  displayTasks();
  
  // Also send to service worker for background checks
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "TASKS_DATA",
      tasks: retrieveTasks,
      todayKey,
    });
  }

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
  const retrieveTasks = JSON.parse(localStorage.getItem("tasks")) || {}; // safe fallback
  for (const key in retrieveTasks) {
    (retrieveTasks[key] || []).forEach((e) => {
      if (e.addaBreak === true) {
        count++; // Count the number of break tasks
      }
    });
  }

  let count2 = 0;
  for (let i in tasks) {
    count2 += (tasks[i] || []).length; // Count all tasks
  }
  classCounter.innerHTML = `Total Classes: ${count2 - count}`; // Update the task count excluding breaks
}

// -------------------------------------------------------------------

// ------------------------ Notifications -----------------------------
async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported");
    return false;
  }
  
  if (Notification.permission === "granted") {
    console.log("Notification permission already granted");
    return true;
  }
  
  if (Notification.permission === "default") {
    try {
      // Request permission explicitly
      const permission = await Notification.requestPermission();
      console.log("Notification permission:", permission);
      if (permission === "granted") {
        // Show a test notification on Android to confirm it works
        if (navigator.serviceWorker && navigator.serviceWorker.ready) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification("Class Routine", {
            body: "Notifications are enabled! You'll get alerts when tasks are due.",
            icon: "icon-192x192.png",
            vibrate: [200],
            tag: "permission-granted",
          });
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("Notification permission error:", err);
      return false;
    }
  }
  
  return Notification.permission === "granted";
}

function sendTaskNotification(task) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const title = "Class Routine";
  const body = `${task.name} - time reached${task.time ? ` (${task.time})` : ""}`;
  try {
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.showNotification) {
          reg.showNotification(title, {
            body,
            badge: undefined,
            icon: undefined,
            vibrate: [100, 50, 100],
            tag: `task-${task.id}`,
          });
          playBeep();
        } else {
          new Notification(title, { body });
          playBeep();
        }
      });
    } else {
      new Notification(title, { body });
      playBeep();
    }
  } catch (e) {
    console.warn("Notification failed", e);
  }
}

// ------------------------ Beep sound -----------------------------
function setupAudioUnlock() {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
    }
    const unlock = () => {
      if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("touchstart", unlock);
    };
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true });
  } catch (_) {}
}

function playBeep(duration = 200, frequency = 880, volume = 0.2) {
  try {
    setupAudioUnlock();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.connect(gain).connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    osc.start(now);
    osc.stop(now + duration / 1000);
  } catch (e) {
    console.warn("Beep failed", e);
  }
}

// ------------------------ Service Worker Communication -----------------------------
function setupServiceWorkerMessaging() {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data && event.data.type === "GET_TASKS") {
      const tasks = JSON.parse(localStorage.getItem("tasks")) || {};
      const todayKey = event.data.todayKey;
      navigator.serviceWorker.controller.postMessage({
        type: "TASKS_DATA",
        tasks,
        todayKey,
      });
    } else if (event.data && event.data.type === "MARK_NOTIFIED") {
      // Mark task as notified when SW sends notification
      const { taskId, todayKey } = event.data;
      const tasks = JSON.parse(localStorage.getItem("tasks")) || {};
      const dayTasks = tasks[todayKey] || [];
      const task = dayTasks.find((t) => t.id === taskId);
      if (task) {
        task.notified = true;
        localStorage.setItem("tasks", JSON.stringify(tasks));
        displayTasks();
      }
    } else if (event.data && event.data.type === "MARK_COMPLETED") {
      // Mark task as completed when user clicks "Done" in notification
      const { taskId } = event.data;
      const tasks = JSON.parse(localStorage.getItem("tasks")) || {};
      const todayKey = new Date().toLocaleString("en-us", { weekday: "short" });
      const dayTasks = tasks[todayKey] || [];
      const taskIndex = dayTasks.findIndex((t) => t.id == taskId);
      if (taskIndex !== -1) {
        dayTasks[taskIndex].completed = true;
        localStorage.setItem("tasks", JSON.stringify(tasks));
        displayTasks();
      }
    }
  });
}

// ------------------------ Wake Lock API -----------------------------
let visibilityListener = null; // Store listener to avoid duplicates

async function requestWakeLock() {
  if (!("wakeLock" in navigator)) {
    console.log("Wake Lock API not supported");
    return false;
  }

  try {
    // Only request wake lock during active class hours (7 AM - 4 PM)
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 7 && hour < 16) {
      wakeLock = await navigator.wakeLock.request("screen");
      console.log("Wake Lock active - screen will stay awake during classes");

      wakeLock.addEventListener("release", () => {
        console.log("Wake Lock released");
        wakeLock = null;
      });

      // Remove old listener if exists
      if (visibilityListener) {
        document.removeEventListener("visibilitychange", visibilityListener);
      }

      // Re-request if page becomes visible again
      visibilityListener = async () => {
        if (document.visibilityState === "visible" && !wakeLock) {
          const nowCheck = new Date();
          const hourCheck = nowCheck.getHours();
          if (hourCheck >= 7 && hourCheck < 16) {
            try {
              wakeLock = await navigator.wakeLock.request("screen");
              console.log("Wake Lock re-acquired");
            } catch (e) {
              console.error("Wake Lock re-acquire error:", e);
            }
          }
        }
      };
      document.addEventListener("visibilitychange", visibilityListener);
      return true;
    } else {
      console.log("Wake Lock not requested (outside class hours)");
      return false;
    }
  } catch (err) {
    console.error("Wake Lock error:", err);
    return false;
  }
}

// Release wake lock when not needed
function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release().then(() => {
      wakeLock = null;
    });
  }
}

// ------------------------ Notification Scheduling -----------------------------
function scheduleUpcomingNotifications() {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const enableReminders = localStorage.getItem("enableReminders") !== "false";
  if (!enableReminders) return;

  const tasks = JSON.parse(localStorage.getItem("tasks")) || {};
  const todayKey = new Date().toLocaleString("en-us", { weekday: "short" });
  const dayTasks = tasks[todayKey] || [];
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  dayTasks.forEach((task) => {
    if (task.time && !task.addaBreak && !task.notified && !task.completed) {
      const [hour, minute] = task.time.split(":").map(Number);
      const taskMinutes = hour * 60 + minute;
      const minutesUntil = taskMinutes - currentMinutes;

      // Schedule notification 5 minutes before task time
      if (minutesUntil > 5 && minutesUntil <= 60) {
        const reminderDelay = (minutesUntil - 5) * 60 * 1000;
        setTimeout(() => {
          if (navigator.serviceWorker && navigator.serviceWorker.ready) {
            navigator.serviceWorker.ready.then((reg) => {
              const enableVibration = localStorage.getItem("enableVibration") !== "false";
              reg.showNotification("Class Routine - Reminder", {
                body: `${task.name} starts in 5 minutes (${task.time})`,
                icon: "icon-192x192.png",
                badge: "icon-192x192.png",
                vibrate: enableVibration ? [200] : [],
                tag: `reminder-${task.id}`,
                requireInteraction: false,
              });
            });
          }
        }, reminderDelay);
        console.log(`Scheduled reminder for ${task.name} in ${minutesUntil - 5} minutes`);
      }
    }
  });
}

// ------------------------ Settings Panel -----------------------------
settingsButton.addEventListener("click", () => {
  settingsPopup.style.display = "flex";
  shadowPopup.style.display = "block";
  // Update UI after a brief delay to ensure DOM is ready
  setTimeout(() => {
    updateSettingsUI();
  }, 50);
});

$("#settingsClose").addEventListener("click", () => {
  settingsPopup.style.display = "none";
  shadowPopup.style.display = "none";
});

$("#testNotification").addEventListener("click", async () => {
  if (navigator.serviceWorker && navigator.serviceWorker.ready) {
    try {
      const reg = await navigator.serviceWorker.ready;
      const enableVibration = localStorage.getItem("enableVibration") !== "false";
      await reg.showNotification("Test Notification 🔔", {
        body: "This is a test notification from Class Routine!",
        icon: "icon-192x192.png",
        badge: "icon-192x192.png",
        vibrate: enableVibration ? [200, 100, 200] : [],
        tag: "test-notification",
        requireInteraction: true,
        actions: [
          { action: "done", title: "✓ Got it!" },
          { action: "snooze", title: "⏰ Snooze" },
        ],
      });
      console.log("Test notification sent");
    } catch (e) {
      console.error("Test notification error:", e);
      alert("Notification failed: " + e.message);
    }
  } else {
    alert("Service Worker not ready. Please reload the page.");
  }
});

$("#requestPermissionBtn").addEventListener("click", async () => {
  await requestNotificationPermission();
  setTimeout(() => {
    updateSettingsUI();
  }, 500);
});

$("#enableReminders").addEventListener("change", (e) => {
  localStorage.setItem("enableReminders", e.target.checked);
  if (e.target.checked) {
    scheduleUpcomingNotifications();
  }
});

$("#enableVibration").addEventListener("change", (e) => {
  localStorage.setItem("enableVibration", e.target.checked);
});

function updateSettingsUI() {
  const permissionStatus = $("#permissionStatus");
  const wakeLockStatus = $("#wakeLockStatus");
  const enableReminders = $("#enableReminders");
  const enableVibration = $("#enableVibration");

  // Check if elements exist (important for Android)
  if (!permissionStatus || !wakeLockStatus) {
    console.warn("Settings UI elements not found");
    return;
  }

  // Update notification permission status
  if ("Notification" in window) {
    const permission = Notification.permission;
    if (permission === "granted") {
      permissionStatus.textContent = "✓ Granted";
      permissionStatus.style.color = "#36f0a2";
    } else if (permission === "denied") {
      permissionStatus.textContent = "✗ Denied";
      permissionStatus.style.color = "#f05236";
    } else {
      permissionStatus.textContent = "⚠ Not requested";
      permissionStatus.style.color = "#f0a236";
    }
  } else {
    permissionStatus.textContent = "Not supported";
    permissionStatus.style.color = "#888";
  }

  // Update wake lock status
  if ("wakeLock" in navigator) {
    if (wakeLock && !wakeLock.released) {
      wakeLockStatus.textContent = "✓ Active";
      wakeLockStatus.style.color = "#36f0a2";
    } else {
      const now = new Date();
      const hour = now.getHours();
      if (hour >= 7 && hour < 16) {
        wakeLockStatus.textContent = "⚠ Available (tap to activate)";
        wakeLockStatus.style.color = "#f0a236";
        wakeLockStatus.style.cursor = "pointer";
        wakeLockStatus.onclick = async () => {
          const success = await requestWakeLock();
          if (success) {
            updateSettingsUI();
          }
        };
      } else {
        wakeLockStatus.textContent = "Outside class hours (7AM-4PM)";
        wakeLockStatus.style.color = "#888";
      }
    }
  } else {
    wakeLockStatus.textContent = "Not supported";
    wakeLockStatus.style.color = "#888";
  }

  // Update checkboxes
  if (enableReminders) {
    enableReminders.checked = localStorage.getItem("enableReminders") !== "false";
  }
  if (enableVibration) {
    enableVibration.checked = localStorage.getItem("enableVibration") !== "false";
  }
  
  console.log("Settings UI updated - Permission:", Notification.permission, "WakeLock:", wakeLock ? "active" : "inactive");
}



