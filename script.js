const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const logContainer = document.getElementById("log");
const gazeDot = document.getElementById("gazeDot");

let lastSpot = null;
let running = false;
let gazeListener = null;

const formatTime = () => new Date().toLocaleTimeString();

function writeLog(spot) {
  if (!spot) return;

  if (logContainer.querySelector(".placeholder")) {
    logContainer.innerHTML = "";
  }

  const entry = document.createElement("div");
  entry.className = "log-entry";

  const label = document.createElement("span");
  label.className = "label";
  label.textContent = spot;

  const time = document.createElement("span");
  time.className = "time";
  time.textContent = formatTime();

  entry.append(label, time);
  logContainer.prepend(entry);

  const entries = [...logContainer.children];
  entries.slice(8).forEach((el) => el.remove());
}

function findSpotAtPoint(x, y) {
  const ignored = new Set([gazeDot]);
  let el = document.elementFromPoint(x, y);

  while (el) {
    if (ignored.has(el)) {
      el = el.parentElement;
      continue;
    }
    if (el.dataset?.spot) return el.dataset.spot;
    el = el.parentElement;
  }
  return null;
}

function updateGazeIndicator(x, y) {
  gazeDot.style.left = `${x}px`;
  gazeDot.style.top = `${y}px`;
  gazeDot.style.opacity = "1";
}

function startTracking() {
  if (running) return;
  running = true;
  startButton.disabled = true;
  stopButton.disabled = false;

  webgazer
    .setRegression("ridge")
    .setTracker("clmtrackr")
    .showVideo(false)
    .showFaceOverlay(false)
    .showFaceFeedbackBox(false)
    .showPredictionPoints(false)
    .begin();

  webgazer.params.storingPoints = false;

  gazeListener = (data, timestamp) => {
    if (!running || !data) return;

    const x = data.x;
    const y = data.y;

    if (Number.isFinite(x) && Number.isFinite(y)) {
      updateGazeIndicator(x, y);

      const spot = findSpotAtPoint(x, y);
      if (spot && spot !== lastSpot) {
        writeLog(spot);
        lastSpot = spot;
      }
    }
  };

  webgazer.setGazeListener(gazeListener);
}

function stopTracking() {
  if (!running) return;
  running = false;
  startButton.disabled = false;
  stopButton.disabled = true;
  gazeDot.style.opacity = "0";
  lastSpot = null;

  webgazer.pause();
  webgazer.removeGazeListener(gazeListener);
}

startButton.addEventListener("click", startTracking);
stopButton.addEventListener("click", stopTracking);
