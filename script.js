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
let timerStatus = "pause";
let warmupTime = 10;
let workTime = 10;
let restTime = 10;
let cooldownTime = 10;
let numberOfRounds = 3;
let currentTime = 0;
let currentRound = 0;
let roundDisplay = document.getElementById("round-display");
let timeDisplay = document.getElementById("time-display");
let startButton = document.getElementById("start-button");

// initailize page
window.onload = function () {
  
  startButton.addEventListener("click", function () {
    startTraining();
  });
}

function startTraining () {
  updateRoundDisplay();
  timeDisplay.innerHTML = warmupTime + "s";
  
  // init currentTime
  timerStatus = "warmup";
  currentTime = warmupTime;
  counter = window.setInterval(timmingHelper, 1000);
}

function endTraining () {

  // end counter
  window.clearInterval(counter);

  // reset time
  currentTime = 0;
  currentRound = 0;
}

function timmingHelper () {

  

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

      // check for cooldown
      if (currentRound > numberOfRounds) {
        timerStatus = "cooldown";
        currentTime = cooldownTime;
      } else {
        timerStatus = "work";
        currentTime = workTime;
        updateRoundDisplay();
      }

    } else if (timerStatus == "cooldown") {
      endTraining();
    }

    
  } // if

  timeDisplayNumber = currentTime;
  timeDisplay.innerHTML = timeDisplayNumber + "s";
  
} // timmingHelper

function updateRoundDisplay(){
  roundDisplay.innerHTML = "Round " + currentRound + " / " + numberOfRounds;
}
 
