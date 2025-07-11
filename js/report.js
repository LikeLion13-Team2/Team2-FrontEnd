const API_BASE_URL = "https://focuscoach.click/api";
const TOKEN =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjYXBzdG9uZXJ1ZG9scGgxQGdtYWlsLmNvbSIsInJvbGUiOiJST0xFX1VTRVIiLCJpYXQiOjE3NTIyMzk4NDYsImV4cCI6MTc1MjI2MTQ0Nn0.BHXn1uxPnEjvUMcCoPGpU9Nn_je6v85C1gwm3Ut9Egg";

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

// 집중 유형 계산 함수
function calculateFocusType(reportData) {
  const avgScore = Math.round(reportData.avgFocusScore * 100);
  const totalMinutes = formatMinutes(
    reportData.totalSessionSeconds
  );
  const focusMinutes = formatMinutes(
    reportData.totalFocusSeconds
  );
  const distractionMinutes = formatMinutes(
    reportData.totalDistractionSeconds
  );
  const longestFocusMinutes = formatMinutes(
    reportData.longestFocusSeconds
  );

  // 집중률 계산
  const focusRatio =
    totalMinutes > 0 ? (focusMinutes / totalMinutes) * 100 : 0;
  const distractionRatio =
    totalMinutes > 0
      ? (distractionMinutes / totalMinutes) * 100
      : 0;

  let focusType = "";
  let description = "";

  if (avgScore >= 80 && focusRatio >= 70) {
    focusType = "완벽주의형 🎯";
    description = "오늘 정말 집중 잘했어요! 완벽한 하루였네요!";
  } else if (avgScore >= 70 && longestFocusMinutes >= 45) {
    focusType = "마라톤형 🏃‍♂️";
    description = "꾸준히 오래 집중하는 스타일이에요!";
  } else if (distractionRatio > 30) {
    focusType = "롤러코스터형 🎢";
    description = "집중과 딴짓을 반복하는 패턴이에요!";
  } else if (avgScore >= 60) {
    focusType = "균형잡힌형 ⚖️";
    description = "적당한 집중과 휴식의 균형이 좋아요!";
  } else {
    focusType = "아직 적응중형 🌱";
    description = "아직 집중 패턴을 찾고 있는 중이에요!";
  }

  return { focusType, description };
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

    console.log("계산된 점수:", score); // 디버깅용

    // 점수에 따른 뱃지 업데이트
    if (scoreBadgeElement) {
      const badge = calculateScoreBadge(score);
      console.log("적용할 뱃지:", badge); // 디버깅용

      scoreBadgeElement.textContent = badge.text;

      // 기존 뱃지 클래스 제거
      scoreBadgeElement.classList.remove(
        "score-badge-bad",
        "score-badge-normal",
        "score-badge-good"
      );
      // 새로운 뱃지 클래스 추가
      scoreBadgeElement.classList.add(badge.class);

      console.log(
        "뱃지 클래스 적용 완료:",
        scoreBadgeElement.className
      ); // 디버깅용
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
    // 누적 집중 시간
    statValues[0].textContent = `${formatMinutes(
      reportData.totalFocusSeconds
    )}분`;
    // 쉬는 시간
    statValues[1].textContent = `${formatMinutes(
      reportData.totalBreakSeconds
    )}분`;
    // 딴짓 누적 시간
    statValues[2].textContent = `${formatMinutes(
      reportData.totalDistractionSeconds
    )}분`;
    // 최장 집중 시간
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

  // 포코의 한줄 총평 처리 및 분리
  if (reportData.comment) {
    let commentText = reportData.comment;

    // JSON 형태의 comment 처리
    try {
      if (
        typeof commentText === "string" &&
        (commentText.startsWith("{") ||
          commentText.startsWith("["))
      ) {
        const commentObj = JSON.parse(commentText);
        commentText =
          commentObj["한줄 총평"] ||
          commentObj["총평"] ||
          commentObj.comment ||
          commentObj.message ||
          commentText;
      }
    } catch (e) {
      console.log(
        "Comment JSON parsing failed, using original text"
      );
    }

    // 불필요한 문자 제거 및 정리
    commentText = commentText
      .replace(/[{}[\]"]/g, "")
      .replace(/\\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    console.log("처리된 총평 텍스트:", commentText);

    // 학습 유형, 특징 설명, 총평 분리
    let focusType = "";
    let focusDescription = "";
    let pocoComment = "";

    // "학습 유형:" 패턴으로 분리
    if (commentText.includes("학습 유형:")) {
      const parts = commentText.split("학습 유형:");
      if (parts.length > 1) {
        const typeAndRest = parts[1].trim();

        // "특징 설명:" 부분 찾기
        const descriptionMatch = typeAndRest.match(
          /^([^,]+),?\s*특징 설명:\s*(.+?)(?:,\s*한줄 총평|$)/
        );

        if (descriptionMatch) {
          focusType = descriptionMatch[1].trim();
          focusDescription = descriptionMatch[2].trim();

          // 한줄 총평 부분 찾기
          const commentMatch =
            commentText.match(/한줄 총평[:\s]*(.+)$/);
          if (commentMatch) {
            pocoComment = commentMatch[1].trim();
          }
        } else {
          // "특징 설명:" 없이 "당신은"으로 시작하는 패턴
          const generalMatch = typeAndRest.match(
            /^([^,]+),?\s*(당신은.+?)(?:,\s*집중|$)/
          );
          if (generalMatch) {
            focusType = generalMatch[1].trim();
            focusDescription = generalMatch[2].trim();

            // 나머지를 총평으로
            const remainingText = typeAndRest
              .replace(generalMatch[0], "")
              .trim();
            if (remainingText) {
              pocoComment = remainingText.replace(/^[,\s]+/, "");
            }
          } else {
            // 패턴 매칭 실패 시 전체를 유형으로
            focusType = typeAndRest.split(",")[0].trim();
            focusDescription = "집중 패턴을 분석하고 있어요!";
            pocoComment = "오늘도 공부하느라 수고했어요!";
          }
        }
      }
    } else {
      // "학습 유형:" 패턴이 없는 경우 기본 처리
      const { focusType: calculatedType, description } =
        calculateFocusType(reportData);
      focusType = calculatedType;
      focusDescription = description;
      pocoComment =
        commentText.length > 80
          ? commentText.substring(0, 80) + "..."
          : commentText;
    }

    // UI 요소 업데이트
    const focusTypeValueElement = document.querySelector(
      ".focus-type-value"
    );
    const focusTypeDescElement = document.querySelector(
      ".focus-type-description"
    );
    const commentTextElement = document.querySelector(
      ".comment-card .comment-text"
    );

    // 오늘의 집중 유형 업데이트
    if (focusTypeValueElement && focusType) {
      focusTypeValueElement.textContent = focusType;
    } else if (focusTypeValueElement) {
      const { focusType: calculatedType } =
        calculateFocusType(reportData);
      focusTypeValueElement.textContent = calculatedType;
    }

    // 오늘의 집중 유형 설명 (특징 설명)
    if (focusTypeDescElement && focusDescription) {
      // if (focusDescription.length > 80) {
      //   focusDescription =
      //     focusDescription.substring(0, 80) + "...";
      // }
      focusTypeDescElement.textContent = focusDescription;
    } else if (focusTypeDescElement) {
      const { description } = calculateFocusType(reportData);
      focusTypeDescElement.textContent = description;
    }

    // 포코의 한줄 총평 (격려/조언 메시지)
    if (commentTextElement && pocoComment) {
      // "및 추천 전략:" 부분 제거
      pocoComment = pocoComment
        .replace(/^및\s*추천\s*전략\s*:\s*/, "")
        .replace(/^한줄\s*총평\s*:\s*/, "")
        .replace(/^총평\s*:\s*/, "")
        .trim();

      commentTextElement.textContent = pocoComment;
    } else if (commentTextElement) {
      // 기본 격려 메시지
      const encouragementMessages = [
        "오늘도 공부하느라 수고했어요! 계속 화이팅! 💪",
        "집중할 수 있어서 다행이에요! 내일도 파이팅! 🌟",
        "조금씩이라도 발전하고 있어요! 꾸준히 해봐요! ✨",
        "완벽하지 않아도 괜찮아요! 노력하는 모습이 멋져요! 🎯",
      ];
      const randomMessage =
        encouragementMessages[
          Math.floor(
            Math.random() * encouragementMessages.length
          )
        ];
      commentTextElement.textContent = randomMessage;
    }

    console.log("분리 결과:");
    console.log("집중 유형:", focusType);
    console.log("특징 설명:", focusDescription);
    console.log("포코 총평:", pocoComment);
  } else {
    // 백엔드 comment가 없는 경우 계산된 값 사용
    const { focusType, description } =
      calculateFocusType(reportData);

    const focusTypeValueElement = document.querySelector(
      ".focus-type-value"
    );
    const focusTypeDescElement = document.querySelector(
      ".focus-type-description"
    );
    const commentTextElement = document.querySelector(
      ".comment-card .comment-text"
    );

    if (focusTypeValueElement) {
      focusTypeValueElement.textContent = focusType;
    }
    if (focusTypeDescElement) {
      focusTypeDescElement.textContent = description;
    }
    if (commentTextElement) {
      commentTextElement.textContent =
        "오늘도 공부하느라 수고했어요! 계속 화이팅! 💪";
    }
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
