// load the service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").then(
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

let colorSample = null; // the color sample element
let answers = []; // array of answer elements
let correctColorCode = null; // color code of actual color sample
let score = sessionStorage.getItem("score") || 0; // number of correct answers
let total = sessionStorage.getItem("total") || 0; // total number of questions
let numberOfQuestions = 10; // the number of questions in total
let numberOfLevels = 3; // the number of questions in total
let level = sessionStorage.getItem("level") || 1; // the current level
let gameMode = sessionStorage.getItem("gameMode") || "guessCodeByColor"; // mode of game: guessCodeByColor (default), guessColorByCode

// initailize page
window.onload = function () {
  let currentPage = window.location.pathname;

  if (currentPage.includes("index.html") || currentPage.endsWith("/")) {
    // show the level number
    document.getElementById("level").innerHTML = "You are in level " + level;

    // show the question
    if (gameMode == "guessCodeByColor")
      document.getElementById("question").innerHTML =
        "What is the color code for this color?";
    else if (gameMode == "guessColorByCode")
      document.getElementById("question").innerHTML =
        "What is the color for this color code?";

    // initialize color sample
    colorSample = document.getElementById("colorSample");
    // initialize answers to the page base on the level number
    let numberOfChoices = Math.pow(2, level);
    let answerContent = "";

    // generate answer list one
    answerContent += '<ul class="list-one">';
    for (let i = 0; i < numberOfChoices / 2; i++) {
      answerContent +=
        '<li class="answer" id="' +
        String.fromCharCode(97 + i) +
        '">' +
        String.fromCharCode(65 + i) +
        "</li>";
    }
    answerContent += "</ul>";

    // generate answer list two
    answerContent += '<ul class="list-two">';
    for (let i = numberOfChoices / 2; i < numberOfChoices; i++) {
      answerContent +=
        '<li class="answer" id="' +
        String.fromCharCode(97 + i) +
        '">' +
        String.fromCharCode(65 + i) +
        "</li>";
    }
    answerContent += "</ul>";

    document.getElementById("answerContainer").innerHTML = answerContent;

    // initialize array of elements with all possible answers
    for (let i = 0; i < numberOfChoices; i++) {
      answers.push(document.getElementById(String.fromCharCode(97 + i)));
    }

    // add onclick events to all possible answers
    for (let i = 0; i < answers.length; i++) {
      answers[i].addEventListener("click", function () {
        markIt(this);
      });
    }

    // load a new question
    loadNewQuestion();
  } else if (currentPage.includes("result.html")) {
    /* result page */

    // show the level number
    document.getElementById("level").innerHTML =
      "You are in level " + sessionStorage.getItem("level");

    // get score and total from sessionStorage
    score = sessionStorage.getItem("score") || 0;
    total = sessionStorage.getItem("total") || 0;
    document.getElementById("score").innerHTML = score + " / " + total;

    // back button
    document.getElementById("back").addEventListener("click", function () {
      // update level; reset score and total
      level++;
      if (level > numberOfLevels) level = 1;
      sessionStorage.setItem("level", level);
      sessionStorage.setItem("score", 0);
      sessionStorage.setItem("total", 0);

      goToPage("index");
    });

    // switch game mode button
    document
      .getElementById("switchGameMode")
      .addEventListener("click", function () {
        // switch game mode
        if (gameMode == "guessCodeByColor")
          sessionStorage.setItem("gameMode", "guessColorByCode");
        else if (gameMode == "guessColorByCode")
          sessionStorage.setItem("gameMode", "guessCodeByColor");

        // reset lever, score, total
        sessionStorage.setItem("level", 1);
        sessionStorage.setItem("score", 0);
        sessionStorage.setItem("total", 0);

        goToPage("index");
      });
  } // else if
};

// go to a specific page
function goToPage(pageName) {
  window.location.href = pageName + ".html";
} // goToPage

// load a new question
function loadNewQuestion() {
  // set color of colorSample
  let colorCode = getRandomHexCode();
  if (gameMode == "guessCodeByColor") {
    colorSample.innerHTML = "";
    colorSample.style.backgroundColor = colorCode;
  } else if (gameMode == "guessColorByCode") {
    colorSample.innerHTML = colorCode;
    colorSample.style.backgroundColor = "#fff";
  }

  // store correct answer to this question globally
  correctColorCode = colorCode;

  // pick a random location for correct answer
  let solution = Math.floor(Math.random() * answers.length);
  let incorrectColorCode = null;

  for (let i = 0; i < answers.length; i++) {
    if (i == solution) {
      if (gameMode == "guessCodeByColor") {
        answers[i].innerHTML = colorCode;
      } else if (gameMode == "guessColorByCode") {
        answers[i].style.backgroundColor = colorCode;
      } // inner if
    } else {
      // avoid multiple correct answers
      do {
        incorrectColorCode = getRandomHexCode();
      } while (incorrectColorCode == correctColorCode);

      if (gameMode == "guessCodeByColor") {
        answers[i].innerHTML = incorrectColorCode;
      } else if (gameMode == "guessColorByCode") {
        answers[i].style.backgroundColor = incorrectColorCode;
      } // inner if
    } // if
  } // for i
} // loadNewQuestion

// mark current question
function markIt(elem) {
  let gotItRight = false;
  let answerPicked = null;
  total++;

  // start the full screen animation
  if (gameMode == "guessColorByCode") {
    colorSample.style.backgroundColor = correctColorCode;

    let rgbCode = window
      .getComputedStyle(elem)
      .getPropertyValue("background-color");
    answerPicked = convertToHexCode(rgbCode);
  } else if ((gameMode = "guessCodeByColor")) {
    answerPicked = elem.innerHTML;
  }

  colorSample.classList.add("full-screen");

  // record if it is correct
  console.log("Comparing " + answerPicked + " to " + correctColorCode);
  if (answerPicked == correctColorCode) {
    score++;
    gotItRight = true;
  }

  document.getElementById("score").innerHTML = score + " / " + total;

  window.setTimeout(function () {
    if (gotItRight) {
      colorSample.innerHTML = "Correct!";
    } else {
      colorSample.innerHTML = "Incorrect...";
    }

    // save the result to sessionStorage
    sessionStorage.setItem("score", score);
    sessionStorage.setItem("total", total);
  }, 100);

  window.setTimeout(function () {
    // go to result page if all questions are done
    if (total >= numberOfQuestions) {
      goToPage("result");
    } else {
      // end the full screen animation
      colorSample.classList.remove("full-screen");

      loadNewQuestion();
    }
  }, 1300);
} // markIt

// create random hex code
function getRandomHexCode() {
  let result = []; // final code
  let hexRef = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
  ];
  result.push("#");

  for (let n = 0; n < 6; n++) {
    result.push(hexRef[Math.floor(Math.random() * 16)]);
  }

  return result.join(""); // #rrggbb
} // getRandomHexCode

// convert rgb color code to hexadecimal color code
function convertToHexCode(rgbColor) {
  let parts = rgbColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  delete parts[0];
  for (let i = 1; i <= 3; i++) {
    parts[i] = parseInt(parts[i]).toString(16);
    if (parts[i].length == 1) parts[i] = "0" + parts[i];
  }
  return "#" + parts.join("");
} // convertToHexCode
