const minusBtn = document.getElementById("minus");
const plusBtn = document.getElementById("plus");
const minutesInput = document.getElementById("minutes");
const timeTextEl = document.getElementById("time-text");
const startBtn = document.querySelector(".start-btn");
const resetBtn = document.querySelector(".reset-btn");
const progressCircle = document.querySelector(".ring-progress");

let minutes = parseInt(minutesInput.value);
let timerInterval = null;
let totalSeconds = 0;
let remainingSeconds = 0;
let isPaused = false;

let startedAt = null;
let endedAt = null;
let breakLogs = [];
let distractionLogs = [];
let currentBreak = null;
let currentDistraction = null;

updateTimeDisplay();

// ➕➖ 입력
minusBtn.addEventListener("click", () => {
  if (minutes > 1 && !timerInterval) {
    minutes--;
    updateTimeDisplay();
  }
});
plusBtn.addEventListener("click", () => {
  if (!timerInterval) {
    minutes++;
    updateTimeDisplay();
  }
});
minutesInput.addEventListener("input", () => {
  const newVal = parseInt(minutesInput.value);
  if (!isNaN(newVal) && newVal >= 1 && !timerInterval) {
    minutes = newVal;
    updateTimeDisplay();
  }
});

// ⏱ 원형 퍼센트
function updateCircleProgressByRatio(ratio) {
  const circleLength = 2 * Math.PI * 50;
  const offset = circleLength * (1 - ratio);
  progressCircle.style.strokeDashoffset = offset;
}

// ⏱ 포맷
function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2, "0")}분 ${String(
    sec
  ).padStart(2, "0")}초`;
}

// ⏱ 텍스트 동기화
function updateTimeDisplay() {
  minutesInput.value = minutes;
  timeTextEl.textContent = formatTime(minutes * 60);
  updateCircleProgressByRatio(minutes / 60);
}

const startingControls = document.querySelector(
  ".starting-controls"
);

// ▶⏸ 일시정지/재시작
startBtn.addEventListener("click", () => {
  if (!timerInterval && !isPaused) {
    // ▶ 시작
    startedAt = Date.now();
    totalSeconds = minutes * 60;
    remainingSeconds = totalSeconds;
    startCountdown();
    startBtn.textContent = "⏸ 일시정지";

    document.querySelector(".note").style.display = "none";
    document.querySelector(".focus-info").style.display =
      "block";
    document.querySelector(".focus-text").style.display =
      "block";
    startWebGazer();
    startingControls.style.display = "none";
  } else if (timerInterval && !isPaused) {
    // ⏸ 일시정지
    clearInterval(timerInterval);
    timerInterval = null;
    isPaused = true;
    startBtn.textContent = "▶ 재시작";
    currentBreak = { start: Date.now() };
    stopWebGazer();
  } else if (!timerInterval && isPaused) {
    // ▶ 재시작
    if (currentBreak) {
      currentBreak.end = Date.now();
      breakLogs.push(currentBreak);
      currentBreak = null;
    }
    startCountdown();
    isPaused = false;
    startBtn.textContent = "⏸ 일시정지";
    startWebGazer();
  }
});

// ⏹ 초기화
resetBtn.addEventListener("click", () => {
  endedAt = Date.now();

  if (currentBreak) {
    currentBreak.end = endedAt;
    breakLogs.push(currentBreak);
    currentBreak = null;
  }

  if (currentDistraction) {
    currentDistraction.end = endedAt;
    distractionLogs.push(currentDistraction);
    currentDistraction = null;
  }

  sendStudySession(); // ✅ 백엔드 전송

  clearInterval(timerInterval);
  timerInterval = null;
  isPaused = false;
  minutes = 20;
  remainingSeconds = 0;
  focusSeconds = 0;
  scoreHistory.length = 0;
  updateTimeDisplay();
  startBtn.textContent = "▶ 시작";
  stopWebGazer();

  document.querySelector(".focus-info").style.display = "none";
  document.querySelector(".focus-text").style.display = "none";
  document.querySelector(".note").style.display = "block";
  startingControls.style.display = "block";
});

// 카운트다운
function startCountdown() {
  timerInterval = setInterval(() => {
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      endedAt = Date.now();
      timeTextEl.textContent = "완료!";
      startBtn.textContent = "✅ 완료!";
      updateCircleProgressByRatio(0);
      sendStudySession(); // ✅ 타이머 자연 종료 시에도 전송
      stopWebGazer();
      return;
    }

    remainingSeconds--;
    const ratio = remainingSeconds / totalSeconds;
    timeTextEl.textContent = formatTime(remainingSeconds);
    updateCircleProgressByRatio(ratio);
  }, 1000);
}

////////////////////////////////////////////////////////////////////////////////
// 📦 WebGazer
let webgazerStarted = false;
let gazeInterval = null;
let scoreInterval = null;

const canvas = document.getElementById("canvas");
const ctx = canvas?.getContext("2d") || {};
const gazeEl = document.getElementById("gaze");
const drowsyEl = document.getElementById("drowsy");
const scoreEl = document.getElementById("score");
const scoreBar = document.getElementById("scoreBar");
const focusTimeEl = document.getElementById("focusTime");

let eyesOpen = true;
let isGazeFocused = false;
let lastGazeTime = Date.now();
let latestGaze = null;
let drowsyStartTime = null;
let focusSeconds = 0;

const postureGood = true;
const aoiW = 400;
const aoiH = 250;
const aoiX = (canvas?.width - aoiW) / 2 || 0;
const aoiY = (canvas?.height - aoiH) / 2 || 0;

const scoreHistory = [];
const maxPoints = 60;

// 차트
let scoreChart;
if (document.getElementById("scoreChart")) {
  const chartCtx = document
    .getElementById("scoreChart")
    .getContext("2d");
  scoreChart = new Chart(chartCtx, {
    type: "line",
    data: {
      labels: Array(maxPoints).fill(""),
      datasets: [
        {
          label: "집중도(0~1)",
          data: scoreHistory,
          borderColor: "#00c853",
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
          tension: 0.2,
        },
      ],
    },
    options: {
      responsive: false,
      scales: {
        y: { min: 0, max: 1 },
        x: { display: false },
      },
    },
  });
}

// WebGazer 시작
function startWebGazer() {
  if (webgazerStarted || !window.webgazer) return;
  webgazerStarted = true;

  webgazer
    .setGazeListener((data) => {
      if (
        data &&
        typeof data.x === "number" &&
        typeof data.y === "number"
      ) {
        latestGaze = data;
        lastGazeTime = Date.now();
        eyesOpen = true;

        isGazeFocused =
          latestGaze.x >= aoiX &&
          latestGaze.x <= aoiX + aoiW &&
          latestGaze.y >= aoiY &&
          latestGaze.y <= aoiY + aoiH;
      }
    })
    .showVideoPreview(false)
    .showPredictionPoints(false)
    .begin()
    .catch((err) => {
      alert(
        "카메라 접근이 거부되었습니다.\n카메라 권한을 허용해 주세요."
      );
      stopWebGazer();
    });

  gazeInterval = setInterval(() => {
    const now = Date.now();
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(aoiX, aoiY, aoiW, aoiH);

    if (latestGaze) {
      gazeEl.textContent = `(${Math.round(
        latestGaze.x
      )}, ${Math.round(latestGaze.y)})`;
      drowsyEl.textContent = "정상";
      drowsyEl.classList.remove("alert");

      ctx.beginPath();
      ctx.arc(latestGaze.x, latestGaze.y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = isGazeFocused ? "green" : "red";
      ctx.fill();
    }

    if (now - lastGazeTime > 1000) {
      if (!drowsyStartTime) drowsyStartTime = now;
      if (now - drowsyStartTime > 2000 && !currentDistraction) {
        eyesOpen = false;
        currentDistraction = { start: now };
        drowsyEl.textContent = "졸음 감지!";
        drowsyEl.classList.add("alert");
        gazeEl.textContent = "-";
      }
    } else {
      drowsyStartTime = null;
      if (currentDistraction) {
        currentDistraction.end = Date.now();
        distractionLogs.push(currentDistraction);
        currentDistraction = null;
      }
    }
  }, 500);

  scoreInterval = setInterval(() => {
    let score = 0;
    if (eyesOpen) score += 0.3;
    if (postureGood) score += 0.3;
    score += isGazeFocused ? 0.4 : 0.1;

    if (score >= 0.6) focusSeconds++;

    const min = String(Math.floor(focusSeconds / 60)).padStart(
      2,
      "0"
    );
    const sec = String(focusSeconds % 60).padStart(2, "0");
    focusTimeEl.textContent = `${min}:${sec}`;
    scoreEl.textContent = score.toFixed(2);
    scoreBar.style.width = `${score * 100}%`;

    if (scoreHistory.length >= maxPoints) scoreHistory.shift();
    scoreHistory.push(score);
    scoreChart?.update();
  }, 1000);
}

// WebGazer 중단
function stopWebGazer() {
  if (!webgazerStarted) return;
  webgazerStarted = false;
  clearInterval(gazeInterval);
  clearInterval(scoreInterval);
  if (window.webgazer?.end) {
    try {
      window.webgazer.end();
    } catch (_) {}
  }
}

// ✅ 백엔드 전송
function sendStudySession() {
  const toISO = (logs) =>
    logs.map((log) => ({
      start: new Date(log.start).toISOString(),
      end: new Date(log.end).toISOString(),
    }));

  const payload = {
    title: "공부 세션",
    startedAt: new Date(startedAt).toISOString(),
    endedAt: new Date(endedAt).toISOString(),
    distractionLogs: toISO(distractionLogs),
    breakLogs: toISO(breakLogs),
    focusScore:
      scoreHistory.length > 0
        ? parseFloat(
            (
              scoreHistory.reduce((a, b) => a + b, 0) /
              scoreHistory.length
            ).toFixed(2)
          )
        : 0,
  };

  const token =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJoYW5taW4yNzQ3QGdtYWlsLmNvbSIsInJvbGUiOiJST0xFX1VTRVIiLCJpYXQiOjE3NTIyMzg4NDMsImV4cCI6MTc1MjI2MDQ0M30.sGGx2udgqM6Beloa8-ZznmI6nGaPnlX2f7PYUJGxBkk";

  fetch("https://focuscoach.click/api/v1/study-sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      console.log("응답 상태 코드:", res.status);
      return res.text(); // JSON 대신 텍스트로 확인
    })
    .then((data) => {
      console.log("응답 데이터:", data);
    })
    .catch((err) => {
      console.error("❌ 세션 저장 실패:", err);
    });
}
