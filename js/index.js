const API_BASE_URL = "https://focuscoach.click/api";
const TOKEN =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjYXBzdG9uZXJ1ZG9scGgxQGdtYWlsLmNvbSIsInJvbGUiOiJST0xFX1VTRVIiLCJpYXQiOjE3NTIyMzk4NDYsImV4cCI6MTc1MjI2MTQ0Nn0.BHXn1uxPnEjvUMcCoPGpU9Nn_je6v85C1gwm3Ut9Egg";

// API 호출 함수들
async function fetchReportData() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const url = `${API_BASE_URL}/reports?periodType=DAY_1&baseDate=${today}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.isSuccess ? data.result : null;
  } catch (error) {
    console.error("리포트 데이터 로드 실패:", error);
    return null;
  }
}

async function fetchSessionData() {
  try {
    const url = `${API_BASE_URL}/sessions`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.isSuccess ? data.result : [];
  } catch (error) {
    console.error("세션 데이터 로드 실패:", error);
    return [];
  }
}

// 시간 포맷팅 함수
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
}

// 집중도 상태 텍스트 생성
function getFocusStatusText(avgScore) {
  const score = Math.round(avgScore * 100);

  if (score >= 90) {
    return "시선 안정적, 졸음 없음, 자세 완벽 유지 중";
  } else if (score >= 80) {
    return "시선 안정적, 졸음 없음, 자세 93% 유지 중";
  } else if (score >= 70) {
    return "집중 상태 양호, 가끔 딴짓 감지됨";
  } else if (score >= 60) {
    return "보통 집중력, 휴식이 필요할 수 있음";
  } else {
    return "집중력 부족, 환경 개선 필요";
  }
}

// 집중도 이모지 생성
function getFocusEmoji(avgScore) {
  const score = Math.round(avgScore * 100);

  if (score >= 90) return "🔥";
  if (score >= 80) return "⭐";
  if (score >= 70) return "👍";
  if (score >= 60) return "😊";
  return "💪";
}

// 최근 세션 정보 포맷팅
function formatRecentSession(sessions) {
  if (!sessions || sessions.length === 0) {
    return {
      platform: "아직 학습 기록이 없습니다",
      title: "첫 번째 학습을 시작해보세요!",
      time: "",
      duration: "",
    };
  }

  const recentSession = sessions[0]; // 가장 최근 세션
  const startTime = new Date(recentSession.sessionStartTime);
  const endTime = new Date(recentSession.sessionEndTime);

  const timeStr = `${startTime
    .getHours()
    .toString()
    .padStart(2, "0")}:${startTime
    .getMinutes()
    .toString()
    .padStart(2, "0")} ~ ${endTime
    .getHours()
    .toString()
    .padStart(2, "0")}:${endTime
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  const totalMinutes = Math.floor(
    recentSession.totalSessionSeconds / 60
  );
  const focusMinutes = Math.floor(
    recentSession.totalFocusSeconds / 60
  );

  return {
    platform: recentSession.platform || "학습 플랫폼",
    title: recentSession.title || "학습 세션",
    time: timeStr,
    duration: `${focusMinutes}분 / ${totalMinutes}분`,
  };
}

// UI 업데이트 함수
function updateUI(reportData, sessionData) {
  console.log("UI 업데이트 시작:", { reportData, sessionData });

  // 헤더 정보 업데이트
  if (reportData) {
    const score = Math.round(reportData.avgFocusScore * 3);
    const scoreElement = document.querySelector(".highlight");
    const statusElement = document.querySelector(".header p");
    const emojiElement = document.querySelector(".header div");

    if (scoreElement) {
      scoreElement.textContent = `${score}점`;
    }

    if (statusElement) {
      statusElement.textContent = getFocusStatusText(
        reportData.avgFocusScore
      );
    }

    if (emojiElement) {
      const emoji = getFocusEmoji(reportData.avgFocusScore);
      const text =
        score >= 90
          ? "집중력 최고"
          : score >= 80
          ? "집중력 우수"
          : score >= 70
          ? "집중력 양호"
          : "집중력 보통";
      emojiElement.innerHTML = `<span class="highlight">${score}점</span> ${text}${emoji}`;
    }

    // 오늘 공부 시간 업데이트
    const studyTimeElement =
      document.querySelector(".circle-chart");
    if (studyTimeElement) {
      const totalTime = formatTime(
        reportData.totalSessionSeconds
      );
      const focusTime = formatTime(reportData.totalFocusSeconds);
      studyTimeElement.innerHTML = `
        📚 총 학습: ${totalTime}<br>
        🎯 집중: ${focusTime}<br>
        📊 집중률: ${
          Math.round(
            (reportData.totalFocusSeconds /
              reportData.totalSessionSeconds) *
              100
          ) || 0
        }%
      `;
    }

    // 연간 학습 현황 업데이트 (누적 데이터로 표시)
    const studyStatsElement =
      document.querySelector(".study-time");
    if (studyStatsElement) {
      const totalHours = Math.floor(
        reportData.totalSessionSeconds / 3600
      );
      const totalMinutes = Math.floor(
        (reportData.totalSessionSeconds % 3600) / 60
      );
      studyStatsElement.innerHTML = `
        📚 오늘 학습: ${totalHours}시간 ${totalMinutes}분 |
        ⏰ 집중 시간: ${formatTime(
          reportData.totalFocusSeconds
        )} |
        📝 집중률: ${
          Math.round(
            (reportData.totalFocusSeconds /
              reportData.totalSessionSeconds) *
              100
          ) || 0
        }% |
        🏆 평균 점수: ${Math.round(
          reportData.avgFocusScore * 100
        )}점
      `;
    }
  }

  // 최근 학습 강의 정보 업데이트
  const recentSession = formatRecentSession(sessionData);
  const cardElements = document.querySelectorAll(".card p");

  if (cardElements.length >= 4) {
    cardElements[0].innerHTML = `<strong>${recentSession.platform}</strong>`;
    cardElements[1].textContent = `▶ ${recentSession.title}`;
    cardElements[2].textContent = `📅 ${recentSession.time}`;
    cardElements[3].textContent = `⏱️ ${recentSession.duration}`;
  }
}

// 에러 상태 UI 표시
async function initializeDashboard() {
  console.log("대시보드 초기화 시작");

  showLoadingState();

  try {
    const sessionIds = [1, 2, 3, 4, 5]; // 실제 세션 ID 목록
    const heatmapData = await fetchHeatmapDataFromAPI(
      sessionIds
    );

    console.log("히트맵 데이터 로드 완료:", heatmapData);

    generateHeatmap(heatmapData);
  } catch (error) {
    console.error("대시보드 초기화 실패:", error);
    showErrorState();
  }
}

// 로딩 상태 UI 표시
function showLoadingState() {
  const scoreElement = document.querySelector(".highlight");
  const statusElement = document.querySelector(".header p");

  if (scoreElement) {
    scoreElement.textContent = "...";
  }

  if (statusElement) {
    statusElement.textContent = "데이터를 불러오는 중...";
  }

  const studyTimeElement =
    document.querySelector(".circle-chart");
  if (studyTimeElement) {
    studyTimeElement.innerHTML = `
      로딩 중...<br>
      잠시만 기다려주세요
    `;
  }
}

// 학습 시작 버튼 이벤트
function initializeEventListeners() {
  const startButton = document.querySelector(".footer-button");
  if (startButton) {
    startButton.addEventListener("click", () => {
      // 학습 페이지로 이동하거나 세션 시작 API 호출
      window.location.href = "/pages/study.html"; // 학습 페이지가 있다면
      // 또는 alert("학습을 시작합니다!");
    });
  }
}

// 데이터 로드 및 초기화
async function initializeDashboard() {
  console.log("대시보드 초기화 시작");

  showLoadingState();

  try {
    const sessionIds = [1, 2, 3, 4, 5]; // 실제 세션 ID 목록
    const heatmapData = await fetchHeatmapDataFromAPI(
      sessionIds
    );

    console.log("히트맵 데이터 로드 완료:", heatmapData);

    generateHeatmap(heatmapData);
  } catch (error) {
    console.error("대시보드 초기화 실패:", error);
    showErrorState();
  }
}

// 자동 새로고침 (5분마다)
function setupAutoRefresh() {
  setInterval(() => {
    console.log("자동 새로고침 시작");
    initializeDashboard();
  }, 5 * 60 * 1000); // 5분마다
}

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM 로드 완료, 초기화 시작");

  // 이벤트 리스너 설정
  initializeEventListeners();

  // 대시보드 초기화
  initializeDashboard();

  // 자동 새로고침 설정
  setupAutoRefresh();
});

// 페이지 포커스 시 데이터 갱신
document.addEventListener("visibilitychange", function () {
  if (!document.hidden) {
    console.log("페이지 포커스, 데이터 갱신");
    initializeDashboard();
  }
});

// 히트맵 생성 함수
function generateHeatmap(studyData = {}) {
  const heatmapGrid = document.getElementById("heatmap-grid");
  if (!heatmapGrid) return;

  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const startDate = new Date(oneYearAgo);
  while (startDate.getDay() !== 0) {
    startDate.setDate(startDate.getDate() - 1);
  }

  const currentDate = new Date(startDate);
  for (let week = 0; week < 53; week++) {
    for (let day = 0; day < 7; day++) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const studyMinutes = studyData[dateStr] || 0;

      let level = 0;
      if (studyMinutes > 0) {
        if (studyMinutes >= 240) level = 4; // 4시간 이상
        else if (studyMinutes >= 120) level = 3; // 2시간 이상
        else if (studyMinutes >= 60) level = 2; // 1시간 이상
        else level = 1; // 1시간 미만
      }

      const cell = document.createElement("div");
      cell.className = "heatmap-cell";
      cell.setAttribute("data-level", level);
      cell.setAttribute("data-date", dateStr);
      cell.setAttribute("data-minutes", studyMinutes);

      heatmapGrid.appendChild(cell);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
}

// 툴팁 표시 함수
function showTooltip(event) {
  const cell = event.target;
  const date = cell.getAttribute("data-date");
  const minutes = parseInt(cell.getAttribute("data-minutes"));

  const tooltip = document.createElement("div");
  tooltip.className = "heatmap-tooltip show";

  const dateObj = new Date(date);
  const dateStr = dateObj.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  if (minutes > 0) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    let timeStr = "";
    if (hours > 0) timeStr += `${hours}시간 `;
    if (mins > 0) timeStr += `${mins}분`;
    tooltip.textContent = `${dateStr}: ${timeStr} 학습`;
  } else {
    tooltip.textContent = `${dateStr}: 학습 기록 없음`;
  }

  cell.appendChild(tooltip);
}

// 툴팁 숨김 함수
function hideTooltip(event) {
  const tooltip = event.target.querySelector(".heatmap-tooltip");
  if (tooltip) {
    tooltip.remove();
  }
}

// 모의 학습 데이터 생성 (실제로는 API에서 받아올 데이터)
function generateMockStudyData() {
  const data = {};
  const today = new Date();

  // 지난 1년간 랜덤한 학습 데이터 생성
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // 70% 확률로 학습 데이터 있음
    if (Math.random() > 0.3) {
      // 0-300분 사이의 랜덤한 학습 시간
      data[dateStr] = Math.floor(Math.random() * 300);
    }
  }

  return data;
}

// API에서 히트맵 데이터 가져오기 (향후 구현)
async function fetchHeatmapDataFromAPI(sessionIds) {
  const heatmapData = {};

  for (const sessionId of sessionIds) {
    const url = `${API_BASE_URL}/v1/study-sessions/${sessionId}`;
    console.log("API 호출 URL:", url); // 디버깅 로그 추가
    console.log("사용 중인 토큰:", TOKEN); // 디버깅 로그 추가

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("API 응답 상태 코드:", response.status); // 응답 상태 코드 확인

    if (response.ok) {
      const data = await response.json();
      if (data.isSuccess && data.result.startedAt) {
        const sessionDate = new Date(data.result.startedAt);
        const dateStr = sessionDate.toISOString().split("T")[0];
        const sessionMinutes = Math.floor(
          data.result.sessionSeconds / 60
        );

        // 날짜별 학습 시간 누적
        heatmapData[dateStr] =
          (heatmapData[dateStr] || 0) + sessionMinutes;
      }
    } else {
      console.error(`API 호출 실패: ${response.status}`);
    }
  }

  return heatmapData;
}

// 기존 initializeDashboard 함수 수정
async function initializeDashboard() {
  console.log("대시보드 초기화 시작");

  showLoadingState();

  try {
    const sessionIds = [1, 2, 3, 4, 5]; // 실제 세션 ID 목록
    const heatmapData = await fetchHeatmapDataFromAPI(
      sessionIds
    );

    console.log("히트맵 데이터 로드 완료:", heatmapData);

    generateHeatmap(heatmapData);
  } catch (error) {
    console.error("대시보드 초기화 실패:", error);
    showErrorState();
  }
}

// 세션 데이터에서 학습 날짜 확인
function debugSessionDates(sessionData) {
  if (!sessionData || sessionData.length === 0) {
    console.log("학습 기록이 없습니다.");
    return;
  }

  console.log("학습 기록이 있는 날짜:");
  sessionData.forEach((session, index) => {
    if (session.sessionStartTime) {
      const date = new Date(session.sessionStartTime);
      console.log(
        `세션 ${index + 1}: ${
          date.toISOString().split("T")[0]
        } (${date.toLocaleDateString("ko-KR")})`
      );
    }
  });
}

// 기존 fetchSessionData 함수 수정
async function fetchSessionData() {
  try {
    const url = `${API_BASE_URL}/sessions`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const sessions = data.isSuccess ? data.result : [];

    // 학습 날짜 디버깅
    debugSessionDates(sessions);

    return sessions;
  } catch (error) {
    console.error("세션 데이터 로드 실패:", error);
    return [];
  }
}

const QUOTE_API_URL = "https://example.com/api/v1/quotes"; // API URL을 여기에 입력하세요

async function fetchQuote() {
  try {
    const response = await fetch(QUOTE_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.comment; // API 응답에서 명언 추출
  } catch (error) {
    console.error("명언 데이터 로드 실패:", error);
    return "명언을 불러오는 데 실패했습니다.";
  }
}

async function updateQuote() {
  const quoteElement = document.getElementById("quote-comment");
  if (quoteElement) {
    const quote = await fetchQuote();
    quoteElement.textContent = quote;
  }
}

// 페이지 로드 시 명언 업데이트
document.addEventListener("DOMContentLoaded", function () {
  updateQuote();
});
