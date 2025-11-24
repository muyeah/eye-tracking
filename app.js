const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const overlay = document.getElementById('overlay');
const pointer = document.getElementById('gazePointer');
const markersLayer = document.getElementById('markers');
const logList = document.getElementById('logList');

let isTracking = false;
let lastMarkerTimestamp = 0;
let overlayRect = overlay.getBoundingClientRect();

function updateStatus(message, tone = 'muted') {
  statusEl.textContent = message;
  statusEl.className = `status status--${tone}`;
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-TW', { hour12: false }) + `.${date.getMilliseconds().toString().padStart(3, '0')}`;
}

function placePointer(x, y) {
  const clampedX = Math.min(Math.max(x, overlayRect.left), overlayRect.right);
  const clampedY = Math.min(Math.max(y, overlayRect.top), overlayRect.bottom);

  const offsetX = clampedX - overlayRect.left;
  const offsetY = clampedY - overlayRect.top;

  pointer.style.left = `${offsetX}px`;
  pointer.style.top = `${offsetY}px`;
  pointer.style.opacity = '1';
}

function addMarker(x, y, timestamp) {
  const marker = document.createElement('div');
  marker.className = 'marker';
  marker.style.left = `${x}px`;
  marker.style.top = `${y}px`;

  marker.innerHTML = `<strong>${formatTime(timestamp)}</strong><br />X: ${Math.round(x)}px | Y: ${Math.round(y)}px`;
  markersLayer.appendChild(marker);

  setTimeout(() => marker.remove(), 5500);
}

function addLogEntry(x, y, timestamp) {
  const item = document.createElement('li');
  item.className = 'log__item';
  item.innerHTML = `<strong>${formatTime(timestamp)}</strong><br />位置：(${Math.round(x)}, ${Math.round(y)})`;

  logList.prepend(item);

  while (logList.children.length > 20) {
    logList.lastElementChild.remove();
  }
}

function handleGaze(data, timestamp) {
  if (!isTracking || !data) return;

  const relativeX = data.x - overlayRect.left;
  const relativeY = data.y - overlayRect.top;
  placePointer(data.x, data.y);

  if (timestamp - lastMarkerTimestamp > 950) {
    lastMarkerTimestamp = timestamp;
    addMarker(relativeX, relativeY, timestamp);
    addLogEntry(relativeX, relativeY, timestamp);
  }
}

async function startTracking() {
  if (isTracking) return;

  try {
    updateStatus('初始化中，請稍候…', 'active');
    overlayRect = overlay.getBoundingClientRect();

    webgazer.setGazeListener(handleGaze);
    webgazer.showVideoPreview(false);
    webgazer.showFaceOverlay(false);
    webgazer.showFaceFeedbackBox(false);

    await webgazer.begin();
    isTracking = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    overlay.focus();
    updateStatus('追蹤中，請保持臉部在鏡頭範圍內。', 'active');
  } catch (error) {
    console.error(error);
    updateStatus('啟動失敗，請確認鏡頭權限或瀏覽器支援情況。', 'error');
  }
}

async function stopTracking() {
  if (!isTracking) return;

  await webgazer.stop();
  isTracking = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  pointer.style.opacity = '0';
  updateStatus('已停止。按「開始追蹤」以重新啟動。');
}

function handleResize() {
  overlayRect = overlay.getBoundingClientRect();
}

startBtn.addEventListener('click', startTracking);
stopBtn.addEventListener('click', stopTracking);
window.addEventListener('resize', handleResize);

updateStatus('等待開始…');
