// load the service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("service-worker.js").then(
      function (registration) {
        console.log(
          "Service Worker registered with scope:",
          registration.scope,
        );
      },
      function (error) {
        console.log("Service Worker registration failed:", error);
      },
    );
  });
} // if

let counter = "";
let timerStatus = "init";
let lastTimerStatus = "init";
let warmupTime = 10;
let workTime = 10;
let restTime = 10;
let coolDownTime = 10;
let numberOfRounds = 3;
let currentTime = 0;
let currentRound = 0;
let statusDisplay = document.getElementById("status-display");
let roundDisplay = document.getElementById("round-display");
let timeDisplay = document.getElementById("time-display");
let startButton = document.getElementById("start-button");
const settingsForm = document.getElementById('settings-form');
const errorMessages = document.getElementById('error-messages');

// initialize page
window.onload = function () {

  // start button
  startButton.addEventListener("click", function () {
    if (timerStatus == "init") {

      // start the timer
      startTraining();
    } else if (timerStatus == "pause") {

      // recover the timer
      timerStatus = lastTimerStatus;
      startButton.innerHTML = "PAUSE";
    } else {
      lastTimerStatus = timerStatus;
      timerStatus = "pause"

      startButton.innerHTML = "RESTART";
    }

    updateStatusDisplay();

  });

  // settings form
  settingsForm.addEventListener('submit', function (event) {

    // Stop the form from submitting in the traditional way
    event.preventDefault();

    // Handle the form data here
    handleFormData(settingsForm);

  });



} // window.onload

function startTraining() {

  // init currentTime
  timerStatus = "warmup";
  currentTime = warmupTime;

  // update displays
  startButton.innerHTML = "PAUSE";
  timeDisplay.innerHTML = warmupTime + "s";
  updateRoundDisplay();
  updateStatusDisplay();

  counter = window.setInterval(timingHelper, 1000);
} // startTraining

function endTraining() {

  // end counter
  window.clearInterval(counter);

  // reset time, round, status
  currentTime = 0;
  currentRound = 0;
  timerStatus = "init";

  // update displays
  startButton.innerHTML = "START";
  timeDisplay.innerHTML = warmupTime + "s";
  updateRoundDisplay();
  updateStatusDisplay();

} // endTraining

function timingHelper() {

  // skip the count down if timer is paused
  if (timerStatus == "init" || timerStatus == "pause") return;

  // check for timerStatus of timer; count down if the timer is not paused
  let timeDisplayNumber = timeDisplay.innerHTML.slice(0, timeDisplay.innerHTML.length - 1);

  currentTime--;
  console.log("log: " + timerStatus + " " + currentRound + " " + currentTime)

  if (currentTime <= 0) {

    if (timerStatus == "warmup") {
      timerStatus = "work";
      currentTime = workTime;
      currentRound++;
      updateRoundDisplay();

    } else if (timerStatus == "work") {
      timerStatus = "rest";
      currentTime = restTime;

    } else if (timerStatus == "rest") {

      currentRound++;

      // check for coolDown
      if (currentRound > numberOfRounds) {
        timerStatus = "coolDown";
        currentTime = coolDownTime;
      } else {
        timerStatus = "work";
        currentTime = workTime;
        updateRoundDisplay();
      }

    } else if (timerStatus == "coolDown") {
      endTraining();
    }

    updateStatusDisplay();
  } // if

  // update timeDisplay
  timeDisplayNumber = currentTime;
  timeDisplay.innerHTML = timeDisplayNumber + "s";

} // timingHelper

function updateStatusDisplay() {
  statusDisplay.innerHTML = "Status: " + timerStatus + (timerStatus == "pause" ? " (" + lastTimerStatus + ") " : "");
} // updateStatusDisplay

function updateRoundDisplay() {
  roundDisplay.innerHTML = "Round " + currentRound + " / " + numberOfRounds;
} // updateRoundDisplay

function handleFormData(form) {
  const data = new FormData(form);
  const numberOfRoundsFromSettings = data.get('number-of-rounds');
  const workTimeFromSettings = data.get('work-time');
  const restTimeFromSettings = data.get('rest-time');
  const warmupTimeFromSettings = data.get('warmup-time');
  const coolDownTimeFromSettings = data.get('cool-down-time');

  console.log("rounds: " + numberOfRoundsFromSettings + " workTime: " + workTimeFromSettings);

  numberOfRounds = numberOfRoundsFromSettings;
  workTime = workTimeFromSettings;
  restTime = restTimeFromSettings;
  warmupTime = warmupTimeFromSettings;
  coolDownTime = coolDownTimeFromSettings;
} // handleFormData
