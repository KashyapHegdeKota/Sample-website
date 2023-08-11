let selectedDates = new Map();
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function applyForLeave() {
  console.log("applyForLeave function called");
  const selectedStartDate = document.getElementById("startDate").value;
  const selectedEndDate = document.getElementById("endDate").value;
  let leaveType = document.getElementById("leaveType").value; // Use let instead of const

  console.log("Selected start date:", selectedStartDate);
  console.log("Selected end date:", selectedEndDate);
  console.log("Selected leave type:", leaveType);

  if (selectedStartDate && selectedEndDate && leaveType) {
    console.log("Processing leave application...");
    // Calculate the dates within the selected range
    const dateRange = [];
    const currentDate = new Date(selectedStartDate);
    while (currentDate <= new Date(selectedEndDate)) {
      dateRange.push(formatDate(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    console.log("Date Range:", dateRange);

    // Store the leave information in Local Storage
    dateRange.forEach((date) => {
      const leaveData = {
        leaveType,
        isChecked: true,
        hoursWorked: 0, // You can update this with actual hours worked if needed
      };
      localStorage.setItem(date, JSON.stringify(leaveData));
    });

    // Clear the selection after applying for leave
    selectedDates.clear();
    startDate = null;
    endDate = null;
    leaveType = "";
    console.log("Leave application successful.");
  } else {
    alert("Please select a valid date range and leave type.");
    console.log(
      "Invalid input. Please select a valid date range and leave type."
    );
  }
  generateCalendar(currentYear, currentMonth);
  console.log("applyForLeave function finished");
}

function clearSelection() {
  // Clear the selected dates, date range, and leave type
  selectedDates.clear();
  startDate = null;
  endDate = null;
  leaveType = "";

  generateCalendar(currentYear, currentMonth);
}

function formatDate(date) {
  // Format the date as "YYYY-MM-DD"
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

document
  .getElementById("applyForLeave")
  .addEventListener("click", applyForLeave);
document
  .getElementById("clearSelection")
  .addEventListener("click", clearSelection);

function setDayOption(dayElement, option) {
  // Update the day's text content with the selected option
  if (dayElement) {
    dayElement.textContent = option;
  }
}

function updateSelectedOption(dayElement, option) {
  const date = parseInt(dayElement.textContent, 10);
  const dayOfWeek =
    weekdays[new Date(currentYear, currentMonth, date).getDay()];
  dayElement.textContent = `${date} (${dayOfWeek}) - ${option}`;
  const dayKey = `${currentYear}-${currentMonth + 1}-${date}`;
  localStorage.setItem(dayKey, option);
}

let blockFridays = false;
let blockSundays = false;

function generateCalendar(year, month) {
  console.log("Generating calendar for", months[month], year);
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const numDays = lastDay.getDate();
  const prevMonthLastDay = new Date(year, month, 0).getDate(); // Last day of the previous month

  const calendarDays = document.getElementById("calendarDays");
  calendarDays.innerHTML = "";

  // Calculate the number of previous month's days to display
  const prevMonthDays = (firstDay.getDay() + 6) % 7;

  // Create previous month's days
  for (
    let i = prevMonthLastDay - prevMonthDays + 1;
    i <= prevMonthLastDay;
    i++
  ) {
    const dayElement = document.createElement("div");
    dayElement.classList.add("calendar-day", "prev-month");
    dayElement.textContent = i;
    calendarDays.appendChild(dayElement);
  }

  // Create days for the current month
  for (let i = 1; i <= numDays; i++) {
    const dayElement = document.createElement("div");
    dayElement.classList.add("calendar-day", "current-month-day");
    dayElement.textContent = i;

    // Add the day of the week below the date
    const dayOfWeekElement = document.createElement("div");
    dayOfWeekElement.classList.add("calendar-day-of-week");
    dayOfWeekElement.textContent = weekdays[new Date(year, month, i).getDay()];
    dayElement.appendChild(dayOfWeekElement);

    // Add a dropdown menu below each day
    const dropdownMenu = document.createElement("select");
    dropdownMenu.classList.add("dropdown-menu");
    const options = [
      "Choose your leave option",
      "Present",
      "Annual Leave",
      "Compassionate Leave",
      "Sick Leave",
      "Wellness Leave",
    ];
    options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.textContent = option;
      dropdownMenu.appendChild(optionElement);
    });

    // Disable the dropdown for past days
    const currentDate = new Date();
    if (
      currentYear < currentDate.getFullYear() ||
      (currentYear === currentDate.getFullYear() &&
        month < currentDate.getMonth()) ||
      (currentYear === currentDate.getFullYear() &&
        month === currentDate.getMonth() &&
        i < currentDate.getDate())
    ) {
      dropdownMenu.disabled = true;
    } else if (
      (blockFridays &&
        (weekdays[new Date(year, month, i).getDay()] === "Fri" ||
          weekdays[new Date(year, month, i).getDay()] === "Sat")) ||
      (blockSundays &&
        (weekdays[new Date(year, month, i).getDay()] === "Sun" ||
          weekdays[new Date(year, month, i).getDay()] === "Sat"))
    ) {
      // Disable the dropdown for weekends if blockFridays or blockSundays is true
      dropdownMenu.disabled = true;
    } else {
      // Read the saved selection from localStorage and apply it to the dropdown
      const dayKey = `${year}-${month + 1}-${i}`;
      const savedOption = localStorage.getItem(dayKey);
      if (savedOption) {
        dropdownMenu.value = savedOption;
        updateSelectedOption(dayElement, savedOption);
      } else {
        setDayOption(
          dayElement.querySelector(".dropdown-menu"),
          "Choose your leave option"
        ); // Set default option
      }

      // Add event listener to update selected option and save to localStorage
      dropdownMenu.addEventListener("change", function () {
        updateSelectedOption(dayElement, this.value);
        localStorage.setItem(dayKey, this.value);
      });
    }
    console.log("Created dayElement for", months[month], i);

    dayElement.appendChild(dropdownMenu);
    calendarDays.appendChild(dayElement);
  }
  console.log("Calendar generated for", months[month], year);
}

let currentYear = 2023; // Change to the desired year
let currentMonth = 7; // Change to the desired month (0 for January, 1 for February, etc.)

function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  generateCalendar(currentYear, currentMonth);
  document.getElementById("currentMonth").textContent =
    months[currentMonth] + " " + currentYear;
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  generateCalendar(currentYear, currentMonth);
  document.getElementById("currentMonth").textContent =
    months[currentMonth] + " " + currentYear;
}

generateCalendar(currentYear, currentMonth);
document.getElementById("currentMonth").textContent =
  months[currentMonth] + " " + currentYear;

// Load checkbox states from Local Storage if available
if (localStorage.getItem("blockFridays") !== null) {
  blockFridays = localStorage.getItem("blockFridays") === "true";
  document.getElementById("blockFridays").checked = blockFridays;
}

if (localStorage.getItem("blockSundays") !== null) {
  blockSundays = localStorage.getItem("blockSundays") === "true";
  document.getElementById("blockSundays").checked = blockSundays;
}

// Update the calendar whenever the checkbox states change and save to Local Storage
document.getElementById("blockFridays").addEventListener("change", function () {
  blockFridays = this.checked;
  localStorage.setItem("blockFridays", blockFridays);
  generateCalendar(currentYear, currentMonth);
});

document.getElementById("blockSundays").addEventListener("change", function () {
  blockSundays = this.checked;
  localStorage.setItem("blockSundays", blockSundays);
  generateCalendar(currentYear, currentMonth);
});
/*
// Function to generate the calendar days with attendance data
function generateCalendarDaysWithAttendance() {
  const calendarDays = document.querySelectorAll(".calendar-day");
  calendarDays.forEach((day) => {
    const date = day.textContent;
    const attendanceData = JSON.parse(localStorage.getItem(date));

    if (attendanceData && attendanceData.isChecked) {
      day.classList.add("checked-in");
      day.title = `${attendanceData.hoursWorked} hours worked`;

      // Create a new element to display the hours on the calendar day
      const hoursDisplay = document.createElement("div");
      hoursDisplay.classList.add("hours-display");
      hoursDisplay.textContent = `${attendanceData.hoursWorked}h`;
      day.appendChild(hoursDisplay);

      // Calculate progress for the progress bar
      const maxHours = 8; // Maximum hours per day
      const progress = Math.min(
        (attendanceData.hoursWorked / maxHours) * 100,
        100
      );

      // Create the progress bar container
      const progressBarContainer = document.createElement("div");
      progressBarContainer.classList.add("progress-bar-container");
      day.appendChild(progressBarContainer);

      // Create the progress bar element
      const progressBar = document.createElement("div");
      progressBar.classList.add("progress-bar");
      progressBar.style.width = `${progress}%`;
      progressBarContainer.appendChild(progressBar);

      // Check if the date is in the selected date range and update the leave option
      if (selectedDates.has(date)) {
        day.classList.add("selected-date");
        const leaveOption = selectedDates.get(date);
        day.title = `Leave Type: ${leaveOption}, Hours Worked: ${attendanceData.hoursWorked} hours`;
        setDayOption(day.querySelector(".dropdown-menu"), leaveOption);
      }
    } else {
      day.classList.remove("checked-in");
      day.title = ""; // Remove any tooltip for days without attendance data

      if (selectedDates.has(date)) {
        day.classList.add("selected-date");
        const leaveOption = selectedDates.get(date);
        setDayOption(day.querySelector(".dropdown-menu"), leaveOption);
      }

      // If not checked-in, remove the hours display and progress bar if they exist
      const hoursDisplay = day.querySelector(".hours-display");
      if (hoursDisplay) {
        day.removeChild(hoursDisplay);
      }

      const progressBarContainer = day.querySelector(".progress-bar-container");
      if (progressBarContainer) {
        day.removeChild(progressBarContainer);
      }
    }
  });
}

// Add click event listener to each calendar day to show modal with hours worked
document.querySelectorAll(".calendar-day").forEach((day) => {
  day.addEventListener("click", function () {
    const date = day.textContent;
    const attendanceData = JSON.parse(localStorage.getItem(date));

    if (attendanceData && attendanceData.isChecked) {
      showModal(date, attendanceData.hoursWorked);
    } else {
      showModal(date, "Not Checked-In");
    }
  });
});

// Function to show the modal with hours worked
function showModal(date, hoursWorked) {
  const modal = document.getElementById("myModal");
  const modalDate = document.getElementById("modalDate");
  const modalHours = document.getElementById("modalHours");
  modalDate.textContent = date;
  modalHours.textContent = hoursWorked;
  modal.style.display = "block";

  const closeBtn = document.getElementsByClassName("close")[0];
  closeBtn.onclick = function () {
    modal.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
}

generateCalendarDaysWithAttendance();
*/
