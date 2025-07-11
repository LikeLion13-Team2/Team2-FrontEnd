const API_BASE_URL = "https://focuscoach.click/api";
const TOKEN =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjYXBzdG9uZXJ1ZG9scGgxQGdtYWlsLmNvbSIsInJvbGUiOiJST0xFX1VTRVIiLCJpYXQiOjE3NTIyNjU0NjgsImV4cCI6MTc1MjI4NzA2OH0.LOvj4g-VnnLJVWbCrjmizOVvBP0DOP87qBebZ68SiEg";

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

// 집중 피크 타임 계산 함수
function calculatePeakTime(reportData) {
  // 최장 집중 시간을 기반으로 피크 타임 추정
  const longestFocusMinutes = formatMinutes(
    reportData.longestFocusSeconds
  );
  const avgScore = Math.round(reportData.avgFocusScore * 100);

  // 집중 점수와 최장 집중 시간을 기반으로 시간대 추정
  let peakHour;

  if (avgScore >= 80) {
    // 높은 점수 - 오전 집중형
    peakHour = Math.floor(Math.random() * 3) + 9; // 9-11시
  } else if (avgScore >= 60) {
    // 중간 점수 - 오후 집중형
    peakHour = Math.floor(Math.random() * 3) + 13; // 13-15시
  } else {
    // 낮은 점수 - 저녁 집중형
    peakHour = Math.floor(Math.random() * 3) + 19; // 19-21시
  }

  // 최장 집중 시간이 긴 경우 시간대 조정
  if (longestFocusMinutes >= 60) {
    peakHour = Math.max(10, Math.min(peakHour, 14)); // 10-14시로 제한
  }

  const endHour = peakHour + 1;
  return `${peakHour.toString().padStart(2, "0")}:00 - ${endHour
    .toString()
    .padStart(2, "0")}:00`;
}

// 점수에 따른 뱃지 계산 함수
function calculateScoreBadge(score) {
  if (score >= 0 && score <= 33) {
    return {
      text: "Bad",
      class: "score-badge-bad",
    };
  } else if (score >= 34 && score <= 66) {
    return {
      text: "Normal",
      class: "score-badge-normal",
    };
  } else if (score >= 67 && score <= 100) {
    return {
      text: "Good!",
      class: "score-badge-good",
    };
  } else {
    return {
      text: "Good!",
      class: "score-badge-good",
    };
  }
}

// UI 업데이트 함수
function updateUI(reportData) {
  console.log("업데이트할 리포트 데이터:", reportData);

  // 나의 평균 집중 점수
  const avgScoreElement = document.querySelector(
    ".score-section h2"
  );
  const scoreBadgeElement =
    document.querySelector(".score-badge");

  if (avgScoreElement) {
    const score = Math.round(reportData.avgFocusScore * 3);
    avgScoreElement.textContent = `${score}점`;

    // 점수에 따른 뱃지 업데이트
    if (scoreBadgeElement) {
      const badge = calculateScoreBadge(score);
      scoreBadgeElement.textContent = badge.text;
      scoreBadgeElement.classList.remove(
        "score-badge-bad",
        "score-badge-normal",
        "score-badge-good"
      );
      scoreBadgeElement.classList.add(badge.class);
    }
  }

  // 나의 공부시간
  const studyTimeElement = document.querySelector(
    ".study-time-section h2"
  );
  if (studyTimeElement) {
    studyTimeElement.textContent = formatTime(
      reportData.totalSessionSeconds
    );
  }

  // 상세 통계 업데이트
  const statValues = document.querySelectorAll(
    ".stat-value span"
  );
  if (statValues.length >= 4) {
    statValues[0].textContent = `${formatMinutes(
      reportData.totalFocusSeconds
    )}분`;
    statValues[1].textContent = `${formatMinutes(
      reportData.totalBreakSeconds
    )}분`;
    statValues[2].textContent = `${formatMinutes(
      reportData.totalDistractionSeconds
    )}분`;
    statValues[3].textContent = `${formatMinutes(
      reportData.longestFocusSeconds
    )}분`;
  }

  // 집중 피크 타임 업데이트
  const peakTime = calculatePeakTime(reportData);
  const peakTimeElement = document.querySelector(
    'h3 span[style*="color: #4f9aff"]'
  );
  if (peakTimeElement) {
    peakTimeElement.textContent = peakTime;
  }

  // 백엔드 comment 처리 - 백엔드 데이터만 사용!
  if (reportData.comment) {
    console.log("백엔드에서 받은 comment:", reportData.comment);

    try {
      const commentData = JSON.parse(reportData.comment);
      console.log("파싱된 comment 데이터:", commentData);

      // 1. 집중 유형 - 백엔드 데이터에 이모지 추가
      const focusTypeElement = document.querySelector(
        ".focus-type-value"
      );
      if (focusTypeElement && commentData["학습 유형"]) {
        let focusType = commentData["학습 유형"];

        // 이모지가 없는 경우 추가
        focusType = addEmojiToFocusType(focusType);

        focusTypeElement.textContent = focusType;
        console.log("집중 유형 업데이트:", focusType);
      }

      // 2. 특징 설명 - 백엔드 데이터만 사용
      const descriptionElement = document.querySelector(
        ".focus-type-description"
      );
      if (descriptionElement && commentData["특징 설명"]) {
        descriptionElement.textContent =
          commentData["특징 설명"];
        console.log(
          "특징 설명 업데이트:",
          commentData["특징 설명"]
        );
      }

      // 3. 한줄 총평 - 백엔드 데이터만 사용
      const commentElement =
        document.querySelector(".comment-text");
      if (
        commentElement &&
        commentData["한줄 총평 및 추천 전략"]
      ) {
        commentElement.textContent =
          commentData["한줄 총평 및 추천 전략"];
        console.log(
          "한줄 총평 업데이트:",
          commentData["한줄 총평 및 추천 전략"]
        );
      }
    } catch (e) {
      console.error("Comment JSON parsing failed:", e);
      console.log("원본 comment:", reportData.comment);
    }
  } else {
    console.log("백엔드에서 comment 데이터가 없습니다.");
  }
}

// 집중 유형에 이모지 추가하는 함수
function addEmojiToFocusType(focusType) {
  // 이미 이모지가 있는 경우 그대로 반환
  if (
    /[\u{1F000}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(
      focusType
    )
  ) {
    return focusType;
  }

  // 이모지가 없는 경우 추가
  const emojiMap = {
    반짝형: "🐣 반짝형 (병아리)",
    완벽주의형: "🎯 완벽주의형 (독수리)",
    마라톤형: "🏃‍♂️ 마라톤형 (치타)",
    롤러코스터형: "🎢 롤러코스터형 (원숭이)",
    균형잡힌형: "⚖️ 균형잡힌형 (고양이)",
    적응중형: "🌱 적응중형 (새싹)",
    루틴형: "🐢 루틴형 (거북이)",
    몰입형: "🐿️ 몰입형 (다람쥐)",
  };

  // 타입 이름으로 매칭
  for (const [key, value] of Object.entries(emojiMap)) {
    if (focusType.includes(key)) {
      return value;
    }
  }

  // 매칭되지 않으면 원본 반환
  return focusType;
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
