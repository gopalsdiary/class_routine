// JavaScript to display only the date
const dateContainer = document.getElementById("date-container");
const today = new Date();

// Format: DD/MM/YYYY
const formattedDate = `${today.getDate()}/${
  today.getMonth() + 1
}/${today.getFullYear()}`;
dateContainer.textContent = formattedDate;

// JavaScript to display only the time
function updateClock() {
  const timeContainer = document.getElementById("time-container");
  const now = new Date();

  // Get hours, minutes, and seconds
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // Determine AM or PM
  const amPm = hours >= 12 ? "PM" : "AM";

  // Convert to 12-hour format
  hours = hours % 12 || 12;

  // Format the time with leading zeroes
  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")} ${amPm}`;

  // Update the clock element
  timeContainer.innerText = formattedTime;
}

// Update the clock every second
setInterval(updateClock, 1000);
updateClock(); // Initial call to display the time immediately

// Footer year
const yearContainer = document.querySelector(".year-container");
const currentYear = today.getFullYear();
yearContainer.textContent = currentYear;
//--------------------------------------------------------------------------------
