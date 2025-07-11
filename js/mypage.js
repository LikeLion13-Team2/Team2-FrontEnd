// mypage.js (완전한 코드, 복사-붙여넣기 가능)

document.addEventListener("DOMContentLoaded", () => {
  const nicknameInput = document.getElementById("nicknameInput");
  const nicknameEditBtn = document.querySelector(
    ".nickname-edit-btn"
  );
  const goalsEditBtn = document.querySelector(".goals-edit-btn");
  const tagButtons = document.querySelectorAll(".tag-button");

  let isNicknameEditing = false;
  let isGoalsEditing = false;

  // 편집/완료 버튼 텍스트와 아이콘 토글 함수
  const toggleEditButton = (button, isEditingMode) => {
    button.innerHTML = isEditingMode
      ? `<img src="/assets/mypage_icon/done.png" alt="완성" class="icon-img" /> 완료`
      : `<img src="/assets/mypage_icon/edit.png" alt="편집" class="icon-img" /> 편집`;
  };

  // 닉네임 입력 필드 활성화/비활성화 함수
  const toggleNicknameEditMode = (enable) => {
    nicknameInput.disabled = !enable;
    if (enable) nicknameInput.focus();
  };

  // 태그 버튼 활성화/비활성화 함수
  const toggleTagButtons = (enable) => {
    tagButtons.forEach((btn) => (btn.disabled = !enable));
  };

  // --- 초기 사용자 프로필 로딩 함수 ---
  const fetchUserProfile = async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      alert("로그인이 필요합니다. 다시 로그인해주세요.");
      // 로그인 페이지 URL은 실제 경로에 맞게 수정해주세요.
      window.location.href = "/pages/loginpage.html";
      return;
    }

    try {
      // 백엔드에서 사용자 프로필을 불러오는 GET API
      const response = await axios.get(
        "https://focuscoach.click/api/members/me",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // 백엔드 응답의 실제 구조에 따라 `response.data` 또는 `response.data.result`를 사용하세요.
      // 대부분의 경우 `response.data.result` 형태입니다.
      const userData = response.data.result;

      // 닉네임 필드 채우기
      if (userData.newName) {
        nicknameInput.value = userData.newName;
      } else if (userData.memberName) {
        nicknameInput.value = userData.memberName;
      } else {
        nicknameInput.value = "닉네임을 설정해주세요.";
      }

      // 공부 목표 필드 채우기 (선택된 태그 활성화)
      if (userData.goalName) {
        let goalsToActivate = [];
        if (Array.isArray(userData.goalName)) {
          // 백엔드에서 goalName이 이미 배열로 온 경우
          goalsToActivate = userData.goalName.map((goal) =>
            goal.trim()
          );
        } else if (typeof userData.goalName === "string") {
          // 백엔드에서 goalName이 콤마로 구분된 문자열로 온 경우 (예: "대입,내신/학점")
          goalsToActivate = userData.goalName
            .split(",")
            .map((goal) => goal.trim());
        }

        // 모든 버튼의 'selected' 클래스 초기화 (중복 활성화 방지)
        tagButtons.forEach((btn) =>
          btn.classList.remove("selected")
        );

        // 불러온 목표에 따라 해당 버튼 활성화
        goalsToActivate.forEach((goalText) => {
          tagButtons.forEach((btn) => {
            const buttonText = btn.textContent.trim();
            // 버튼 텍스트와 불러온 목표 텍스트가 정확히 일치하면 'selected' 클래스 추가
            if (buttonText === goalText) {
              btn.classList.add("selected");
            }
          });
        });
      }
    } catch (error) {
      console.error(
        "사용자 프로필 로드 실패:",
        error.response?.data || error
      );
      alert(
        "프로필 정보를 불러오는데 실패했습니다: " +
          (error.response?.data?.message || error.message)
      );
    }
  };
  // --- 초기 사용자 프로필 로딩 함수 끝 ---

  // === 닉네임 편집 이벤트 리스너 ===
  nicknameEditBtn.addEventListener("click", async () => {
    if (!isNicknameEditing) {
      // 편집 모드 시작
      isNicknameEditing = true;
      toggleEditButton(nicknameEditBtn, true);
      toggleNicknameEditMode(true);
    } else {
      // 편집 완료, 백엔드 전송
      const newName = nicknameInput.value.trim();
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
        window.location.href = "/pages/loginpage.html"; // 로그인 페이지 URL은 실제 경로에 맞게 수정
        return;
      }

      try {
        // PATCH 요청으로 닉네임 업데이트
        await axios.patch(
          "https://focuscoach.click/api/members/name", // 닉네임 업데이트 API 엔드포인트
          { newName: newName }, // 백엔드가 'newName'이라는 키를 기대합니다.
          {
            headers: {
              Authorization: `Bearer ${accessToken}`, // Access Token 포함
              "Content-Type": "application/json", // JSON 형식으로 데이터 전송 명시
            },
          }
        );
        alert("닉네임이 저장되었습니다.");
      } catch (error) {
        console.error(
          "닉네임 저장 실패",
          error.response?.data || error
        );
        alert(
          "닉네임 저장에 실패했습니다: " +
            (error.response?.data?.message || error.message)
        );
      }
      isNicknameEditing = false;
      toggleEditButton(nicknameEditBtn, false);
      toggleNicknameEditMode(false);
    }
  });

  // === 공부 목표 편집 이벤트 리스너 ===
  goalsEditBtn.addEventListener("click", async () => {
    if (!isGoalsEditing) {
      // 편집 모드 시작
      isGoalsEditing = true;
      toggleEditButton(goalsEditBtn, true);
      toggleTagButtons(true);
    } else {
      // 편집 완료, 백엔드 전송
      const selectedGoals = Array.from(
        document.querySelectorAll(".tag-button.selected")
      ).map((btn) => btn.textContent.trim()); // 현재 선택된 태그들의 텍스트를 배열로 가져옴

      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
        window.location.href = "pages/loginpage.html"; // 로그인 페이지 URL은 실제 경로에 맞게 수정
        return;
      }

      try {
        // 중요: 이 PUT 요청의 'goalName' 필드가 '배열'을 받는지, 아니면 '콤마 구분 문자열'을 받는지
        // 백엔드에 확인해야 합니다. 현재 코드는 '배열'을 보내도록 되어 있습니다.
        await axios.put(
          "https://focuscoach.click/api/members/goals", // 공부 목표 업데이트 API 엔드포인트
          { goalName: selectedGoals }, // selectedGoals는 배열 (예: ["대입", "내신"])
          {
            headers: {
              Authorization: `Bearer ${accessToken}`, // Access Token 포함
              "Content-Type": "application/json", // JSON 형식으로 데이터 전송 명시
            },
          }
        );
        alert("공부 목표가 저장되었습니다.");
      } catch (error) {
        console.error(
          "공부 목표 저장 실패",
          error.response?.data || error
        );
        alert(
          "공부 목표 저장에 실패했습니다: " +
            (error.response?.data?.message || error.message)
        );
      }

      isGoalsEditing = false;
      toggleEditButton(goalsEditBtn, false);
      toggleTagButtons(false);
    }
  });

  // === 태그 버튼 클릭 시 선택/해제 토글 ===
  tagButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // 편집 모드일 때만 태그 선택/해제 가능
      if (!isGoalsEditing) return;
      btn.classList.toggle("selected");
    });
  });

  // === 페이지 로드 시 초기 상태 및 프로필 정보 로드 ===
  // 초기에는 닉네임 입력 필드와 태그 버튼 비활성화
  toggleNicknameEditMode(false);
  toggleTagButtons(false);

  // DOMContentLoaded 이벤트 발생 시, 사용자 프로필 정보 불러오는 함수 호출
  fetchUserProfile();
});
