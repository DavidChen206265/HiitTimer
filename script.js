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

// handle install prompt
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const installButton = document.getElementById("installButton");
  installButton.style.display = "block";

  installButton.addEventListener("click", () => {
    installButton.style.display = "none";
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }
      deferredPrompt = null;
    });
  });
});

// settings limits and defaults
let maxNumberOfRounds = 100;
let minNumberOfRounds = 1;
let defaultNumberOfRounds = 5;
let maxTime = 180;
let minTime = 3;
let defaultTime = 15;

// timer variables
let counter = "";
let timerStatus = "init";
let lastTimerStatus = "init";
let currentTime = 0;
let currentRound = 0;
let warmupTime = defaultTime;
let workTime = defaultTime;
let restTime = defaultTime;
let coolDownTime = defaultTime;
let numberOfRounds = defaultNumberOfRounds;

// display elements
let statusDisplay = document.getElementById("status-display");
let roundDisplay = document.getElementById("round-display");
let timeDisplay = document.getElementById("time-display");
let startButton = document.getElementById("start-button");
let restartButton = document.getElementById("restart-button");

// settings form elements
const settingsForm = document.getElementById("settings-form");
const settings = document.querySelectorAll(".settings");
const resetButtons = document.querySelectorAll(".btn-reset");
const resetAllBtn = document.getElementById("reset-all-btn");

// config section elements
const configSelect = document.getElementById("config-select");
const loadConfigBtn = document.getElementById("load-config-btn");
const updateConfigBtn = document.getElementById("update-config-btn");
const deleteConfigBtn = document.getElementById("delete-config-btn");
const setDefaultBtn = document.getElementById("set-default-btn");
const saveNewConfigBtn = document.getElementById("save-new-config-btn");
const newConfigNameInput = document.getElementById("new-config-name");

// init input values
document.getElementById("number-of-rounds").value = defaultNumberOfRounds;
document.getElementById("work-time").value = defaultTime;
document.getElementById("rest-time").value = defaultTime;
document.getElementById("warmup-time").value = defaultTime;
document.getElementById("cool-down-time").value = defaultTime;

// init auido beep
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// initialize local storage
const defaultFactoryConfig = new TimerConfig(
  "Factory Default",
  defaultNumberOfRounds,
  defaultTime,
  defaultTime,
  defaultTime,
  defaultTime,
);

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
      startButton.style.backgroundColor = "#F26C52";
    } else {
      lastTimerStatus = timerStatus;
      timerStatus = "pause";

      startButton.innerHTML = "CONTINUE";
      startButton.style.backgroundColor = "#4CAF50";
    }

    updateStatusDisplay();
  });

  // settings form
  settingsForm.addEventListener("submit", function (event) {
    playBeep(800, 300);

    event.preventDefault();
    handleFormData(settingsForm);
  });

  // restart button
  restartButton.addEventListener("click", function () {
    playBeep(800, 300);
    // Only restart if the timer has actually started
    if (timerStatus !== "init") {
      endTraining(); // This function already resets your timer perfectly!
    }
  });

  // settings form
  for (let i = 0; i < settings.length; i++) {
    const timeInput = settings[i];
    const adjustButtons = document.querySelectorAll(".btn-for-setting-" + i);

    adjustButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const change = parseInt(button.getAttribute("data-change"));
        let currentValue = parseInt(timeInput.value) || 0;
        let newValue = currentValue + change;

        if (change > 0) {
          playBeep(600, 100);
        } else {
          playBeep(400, 100);
        }

        // determine which limits to use based on the input id
        let minLimit, maxLimit;

        if (timeInput.id === "number-of-rounds") {
          minLimit = minNumberOfRounds;
          maxLimit = maxNumberOfRounds;
        } else {
          minLimit = minTime;
          maxLimit = maxTime;
        } // if

        // only update the value if it stays within the boundaries
        if (newValue >= minLimit && newValue <= maxLimit) {
          timeInput.value = newValue;
        } else if (newValue < minLimit) {
          timeInput.value = minLimit;
        } else if (newValue > maxLimit) {
          timeInput.value = maxLimit;
        } // if
      });
    });
  } // for

  // reset buttons
  resetButtons.forEach((btn) => {
    // reset all button
    if (btn.id === "reset-all-btn") {
      btn.addEventListener("click", () => {
        document.getElementById("number-of-rounds").value =
          defaultNumberOfRounds;
        document.getElementById("work-time").value = defaultTime;
        document.getElementById("rest-time").value = defaultTime;
        document.getElementById("warmup-time").value = defaultTime;
        document.getElementById("cool-down-time").value = defaultTime;
        playBeep(500, 300);
        applyConfigToForm(getUserDefaultConfig());
      });

      return;
    } // if

    btn.addEventListener("click", () => {
      // find the closest input relative to this button
      const parentGroup = btn.closest(".button-group").previousElementSibling;
      const input = parentGroup.querySelector("input");

      if (input) {
        // turn id into variable name
        const idToVarName = {
          "number-of-rounds": "numberOfRounds",
          "work-time": "workTime",
          "rest-time": "restTime",
          "warmup-time": "warmupTime",
          "cool-down-time": "coolDownTime",
        };

        const currentDefault = getUserDefaultConfig();
        const varName = idToVarName[input.id];
        input.value = currentDefault[varName];
      } // if

      playBeep(500, 300);
    });
  });

  // config buttons
  saveNewConfigBtn.addEventListener("click", () => {
    playBeep(800, 300);
    const name = newConfigNameInput.value.trim();
    if (!name) return alert("Please enter a name for the new preset.");

    const configs = getConfigs();
    if (configs.some((c) => c.name === name))
      return alert("A preset with this name already exists.");

    const newConfig = getCurrentInputsAsConfig(name);
    configs.push(newConfig);
    saveConfigs(configs);

    newConfigNameInput.value = "";
    updateConfigDropdown();
    configSelect.value = configs.length - 1; // select the newly created one
    alert(`Saved preset: ${name}`);
  });

  loadConfigBtn.addEventListener("click", () => {
    playBeep(800, 300);
    const configs = getConfigs();
    const selectedConfig = configs[configSelect.value];
    if (selectedConfig) applyConfigToForm(selectedConfig);
  });

  updateConfigBtn.addEventListener("click", () => {
    playBeep(800, 300);
    const configs = getConfigs();
    const selectedIndex = configSelect.value;
    if (configs[selectedIndex].name === "Factory Default")
      return alert("Cannot overwrite Factory Default.");

    const updatedConfig = getCurrentInputsAsConfig(configs[selectedIndex].name);
    configs[selectedIndex] = updatedConfig;
    saveConfigs(configs);

    // update the default storage too
    if (getUserDefaultConfig().name === updatedConfig.name) {
      saveUserDefaultConfig(updatedConfig);
    }

    alert(`Updated preset: ${updatedConfig.name}`);
  });

  deleteConfigBtn.addEventListener("click", () => {
    playBeep(200, 300);
    let configs = getConfigs();
    const selectedIndex = configSelect.value;

    if (configs[selectedIndex].name === "Factory Default")
      return alert("Cannot delete Factory Default.");
    if (!confirm("Are you sure you want to delete this preset?")) return;

    configs.splice(selectedIndex, 1);
    saveConfigs(configs);
    updateConfigDropdown();
  });

  setDefaultBtn.addEventListener("click", () => {
    playBeep(800, 300);
    const configs = getConfigs();
    const selectedConfig = configs[configSelect.value];
    saveUserDefaultConfig(selectedConfig);
    updateConfigDropdown();
    alert(`${selectedConfig.name} is now your default preset.`);
  });

  // initialize form with user default config and render dropdown
  applyConfigToForm(getUserDefaultConfig());
  updateConfigDropdown();
}; // window.onload

// timer functions
function startTraining() {
  // init currentTime
  timerStatus = "warmup";
  currentTime = warmupTime;

  // update displays
  startButton.innerHTML = "PAUSE";
  startButton.style.backgroundColor = "#F26C52";
  timeDisplay.innerHTML = warmupTime + "s";
  updateRoundDisplay();
  updateStatusDisplay();
  timeDisplay.style.color = "#EBE349";
  statusDisplay.style.color = "#EBE349";

  counter = window.setInterval(timingHelper, 1000);
} // startTraining

function endTraining() {
  // end counter
  window.clearInterval(counter);

  // reset time, round, status
  currentTime = 0;
  currentRound = 0;
  timerStatus = "init";
  timeDisplay.style.color = "#eee";
  statusDisplay.style.color = "#eee";

  // update displays
  startButton.innerHTML = "START";
  startButton.style.backgroundColor = "#4CAF50";
  timeDisplay.innerHTML = warmupTime + "s";
  updateRoundDisplay();
  updateStatusDisplay();
} // endTraining

// this function is called every second when the timer is active
// check the timerStatus and counts down the time accordingly, and updates the display
// handle the transitions between warmup, work, rest, and cooldown
function timingHelper() {
  // skip the count down if timer is paused
  if (timerStatus == "init" || timerStatus == "pause") return;

  // check for timerStatus of timer; count down if the timer is not paused
  // get the number from the timeDisplay (cut down the "s" at the end)
  let timeDisplayNumber = timeDisplay.innerHTML.slice(
    0,
    timeDisplay.innerHTML.length - 1,
  );

  currentTime--;
  console.log("log: " + timerStatus + " " + currentRound + " " + currentTime);

  // check for status change
  if (currentTime <= 0) {
    // play a higher beep for status changes
    playBeep(800, 400);

    // change status and time according to the current status
    if (timerStatus == "warmup") {
      timerStatus = "work";
      currentTime = workTime;
      currentRound++;
      updateRoundDisplay();

      timeDisplay.style.color = "#dd644c";
      statusDisplay.style.color = "#dd644c";
    } else if (timerStatus == "work") {
      timerStatus = "rest";
      currentTime = restTime;

      timeDisplay.style.color = "#2196F3";
      statusDisplay.style.color = "#2196F3";
    } else if (timerStatus == "rest") {
      currentRound++;

      // check for coolDown
      if (currentRound > numberOfRounds) {
        timerStatus = "coolDown";
        currentTime = coolDownTime;

        timeDisplay.style.color = "#4CAF50";
        statusDisplay.style.color = "#4CAF50";
      } else {
        timerStatus = "work";
        currentTime = workTime;
        updateRoundDisplay();

        timeDisplay.style.color = "#F26C52";
        statusDisplay.style.color = "#F26C52";
      }
    } else if (timerStatus == "coolDown") {
      endTraining();
    }

    updateStatusDisplay();
  } else if (currentTime <= 3) {
    // play lower beep for last 3 seconds
    playBeep(400, 200);
  } else {
    // play a soft beep for every second
    playBeep(600, 100);
  } // if

  // update timeDisplay
  timeDisplayNumber = currentTime;
  timeDisplay.innerHTML = timeDisplayNumber + "s";
} // timingHelper

function updateStatusDisplay() {
  statusDisplay.innerHTML =
    "Status: " +
    timerStatus +
    (timerStatus == "pause" ? " (" + lastTimerStatus + ") " : "");
} // updateStatusDisplay

function updateRoundDisplay() {
  roundDisplay.innerHTML = "Round " + currentRound + " / " + numberOfRounds;
} // updateRoundDisplay

// save settings
function handleFormData(form) {
  const data = new FormData(form);
  const numberOfRoundsFromSettings = data.get("number-of-rounds");
  const workTimeFromSettings = data.get("work-time");
  const restTimeFromSettings = data.get("rest-time");
  const warmupTimeFromSettings = data.get("warmup-time");
  const coolDownTimeFromSettings = data.get("cool-down-time");

  numberOfRounds = numberOfRoundsFromSettings || defaultNumberOfRounds;
  workTime = workTimeFromSettings || defaultTime;
  restTime = restTimeFromSettings || defaultTime;
  warmupTime = warmupTimeFromSettings || defaultTime;
  coolDownTime = coolDownTimeFromSettings || defaultTime;

  endTraining();
} // handleFormData

// user configs object constructor
function TimerConfig(
  name,
  numberOfRounds,
  workTime,
  restTime,
  warmupTime,
  coolDownTime,
) {
  this.name = name;
  this.numberOfRounds = numberOfRounds;
  this.workTime = workTime;
  this.restTime = restTime;
  this.warmupTime = warmupTime;
  this.coolDownTime = coolDownTime;
}

function getConfigs() {
  const stored = localStorage.getItem("timer-configs");
  return stored ? JSON.parse(stored) : [defaultFactoryConfig];
} // getConfigs

function saveConfigs(configs) {
  localStorage.setItem("timer-configs", JSON.stringify(configs));
} // saveConfigs

function getUserDefaultConfig() {
  const stored = localStorage.getItem("timer-default-config");
  return stored ? JSON.parse(stored) : defaultFactoryConfig;
} // getUserDefaultConfig

function saveUserDefaultConfig(config) {
  localStorage.setItem("timer-default-config", JSON.stringify(config));
} // saveUserDefaultConfig

// get current inputs
function getCurrentInputsAsConfig(name) {
  return new TimerConfig(
    name,
    parseInt(document.getElementById("number-of-rounds").value) ||
      defaultNumberOfRounds,
    parseInt(document.getElementById("work-time").value) || defaultTime,
    parseInt(document.getElementById("rest-time").value) || defaultTime,
    parseInt(document.getElementById("warmup-time").value) || defaultTime,
    parseInt(document.getElementById("cool-down-time").value) || defaultTime,
  );
} // getCurrentInputsAsConfig

// apply a config to the form
function applyConfigToForm(config) {
  document.getElementById("number-of-rounds").value = config.numberOfRounds;
  document.getElementById("work-time").value = config.workTime;
  document.getElementById("rest-time").value = config.restTime;
  document.getElementById("warmup-time").value = config.warmupTime;
  document.getElementById("cool-down-time").value = config.coolDownTime;
} // applyConfigToForm

// dropdown config list
function updateConfigDropdown() {
  const configs = getConfigs();
  const currentDefault = getUserDefaultConfig();
  configSelect.innerHTML = "";

  configs.forEach((config, index) => {
    const option = document.createElement("option");
    option.value = index;

    const isDefault = config.name === currentDefault.name;
    option.text = config.name + (isDefault ? " (Default)" : "");
    configSelect.appendChild(option);
  });
} // updateConfigDropdown

// generate a beep
function playBeep(frequency = 600, durationInMs = 200) {
  // wake audio up
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  // create an oscillator (generates the sound wave)
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain(); // Controls the volume

  oscillator.type = "sine"; // smooth beep
  oscillator.frequency.value = frequency; // pitch of the beep

  // Connect the pieces: Oscillator -> Volume -> Speakers
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  // Start the sound
  oscillator.start();

  // Quickly fade out the volume
  gainNode.gain.exponentialRampToValueAtTime(
    0.00001,
    audioCtx.currentTime + durationInMs / 1000,
  );

  // Stop the sound
  oscillator.stop(audioCtx.currentTime + durationInMs / 1000);
} // playBeep
