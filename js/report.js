const API_BASE_URL = "https://focuscoach.click/api";
const TOKEN =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjYXBzdG9uZXJ1ZG9scGgxQGdtYWlsLmNvbSIsInJvbGUiOiJST0xFX1VTRVIiLCJpYXQiOjE3NTIyNDI4MjYsImV4cCI6MTc1MjI2NDQyNn0.BR0_UWtQUqMsrO0VMDuUf7Hw-tNMw2oak35olCgg8_g";

// 현재 선택된 기간 타입
let currentPeriodType = "DAY_1";

// API 호출 함수
async function fetchReportData(periodType, baseDate) {
  try {
    const url = `${API_BASE_URL}/reports?periodType=${periodType}&baseDate=${baseDate}`;

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

    if (data.isSuccess) {
      return data.result;
    } else {
      throw new Error(
        data.message || "데이터를 불러오는데 실패했습니다."
      );
    }
  } catch (error) {
    console.error("API 호출 오류:", error);
    throw error;
  }
}

// 시간을 시:분 형식으로 변환
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}시간 ${minutes}분`;
}

// 분 단위로 변환
function formatMinutes(seconds) {
  return Math.floor(seconds / 60);
}

// UI 업데이트 함수
function updateUI(reportData) {
  // 평균 집중 점수 업데이트
  const avgScoreElement = document.querySelector(".card h2");
  if (
    avgScoreElement &&
    avgScoreElement.textContent.includes("점")
  ) {
    avgScoreElement.textContent = `${reportData.avgFocusScore}점`;
  }

  // 공부시간 업데이트
  const studyTimeElements =
    document.querySelectorAll(".card h2");
  if (studyTimeElements[1]) {
    studyTimeElements[1].textContent = formatTime(
      reportData.totalSessionSeconds
    );
  }

  // 누적 집중 시간
  const focusTimeSpan = document.querySelector(
    '.card span[style*="color: #4f9aff"]'
  );
  if (focusTimeSpan) {
    focusTimeSpan.textContent = `${formatMinutes(
      reportData.totalFocusSeconds
    )}분`;
  }

  // 쉬는 시간
  const breakTimeSpans = document.querySelectorAll(
    '.card span[style*="color: #4f9aff"]'
  );
  if (breakTimeSpans[1]) {
    breakTimeSpans[1].textContent = `${formatMinutes(
      reportData.totalBreakSeconds
    )}분`;
  }

  // 딴짓 누적 시간
  const distractionTimeSpan = document.querySelector(
    '.card span[style*="color: red"]'
  );
  if (distractionTimeSpan) {
    distractionTimeSpan.textContent = `${formatMinutes(
      reportData.totalDistractionSeconds
    )}분`;
  }

  // 최장 집중 시간
  const longestFocusSpans = document.querySelectorAll(
    '.card span[style*="color: #4f9aff"]'
  );
  if (longestFocusSpans[2]) {
    longestFocusSpans[2].textContent = `${formatMinutes(
      reportData.longestFocusSeconds
    )}분`;
  }

  // 포코의 한줄 총평 업데이트
  const commentElement = document.querySelector(".right small");
  if (commentElement && reportData.comment) {
    commentElement.textContent = reportData.comment;
  }
}

// 탭 클릭 이벤트 핸들러
function handleTabClick(event) {
  // 모든 탭에서 active 클래스 제거
  document.querySelectorAll(".tabs button").forEach((btn) => {
    btn.classList.remove("active");
  });

  // 클릭된 탭에 active 클래스 추가
  event.target.classList.add("active");

  // 기간 타입 설정
  const tabText = event.target.textContent;
  switch (tabText) {
    case "1일":
      currentPeriodType = "DAY_1";
      break;
    case "3일":
      currentPeriodType = "DAY_3";
      break;
    case "7일":
      currentPeriodType = "DAY_7";
      break;
  }

  // 데이터 다시 로드
  loadReportData();
}

// 리포트 데이터 로드
async function loadReportData() {
  try {
    // 현재 날짜를 기준으로 설정 (YYYY-MM-DD 형식)
    const today = new Date();
    const baseDate = today.toISOString().split("T")[0];

    const reportData = await fetchReportData(
      currentPeriodType,
      baseDate
    );
    updateUI(reportData);

    console.log("리포트 데이터 로드 완료:", reportData);
  } catch (error) {
    console.error("리포트 데이터 로드 실패:", error);
    alert(
      "데이터를 불러오는데 실패했습니다. 다시 시도해주세요."
    );
  }
}

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", function () {
  // 탭 클릭 이벤트 리스너 추가
  document.querySelectorAll(".tabs button").forEach((button) => {
    button.addEventListener("click", handleTabClick);
  });

  // 초기 데이터 로드
  loadReportData();
});
