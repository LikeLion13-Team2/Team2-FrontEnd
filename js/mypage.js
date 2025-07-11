document.addEventListener("DOMContentLoaded", () => {
  const nicknameInput = document.getElementById("nicknameInput");
  const nicknameEditBtn = document.querySelector(
    ".nickname-edit-btn"
  );
  const goalsEditBtn = document.querySelector(".goals-edit-btn");
  const tagButtons = document.querySelectorAll(".tag-button");

  let isNicknameEditing = false;
  let isGoalsEditing = false;

  const toggleEditButton = (button, isEditingMode) => {
    button.innerHTML = isEditingMode
      ? `<img src="/assets/mypage_icon/done.png" alt="완성" class="icon-img" /> 완료`
      : `<img src="/assets/mypage_icon/edit.png" alt="편집" class="icon-img" /> 편집`;
  };

  const toggleNicknameEditMode = (enable) => {
    nicknameInput.disabled = !enable;
    if (enable) nicknameInput.focus();
  };

  const toggleTagButtons = (enable) => {
    tagButtons.forEach((btn) => (btn.disabled = !enable));
  };

  // --- 초기 사용자 프로필 로딩 함수 추가 ---
  const fetchUserProfile = async () => {
    const accessToken = localStorage.getItem("accessToken"); // Access Token 가져오기
    if (!accessToken) {
      console.error(
        "Access Token이 없습니다. 로그인 상태를 확인하세요."
      );
      alert("로그인이 필요합니다. 다시 로그인해주세요.");
      window.location.href = "/index.html"; // 로그인 페이지로 리다이렉트 (필요시 경로 수정)
      return;
    }

    try {
      // 백엔드에서 사용자 프로필을 불러오는 GET API 주소로 변경하세요!
      // 예시: 'https://focuscoach.click/api/user/profile' 또는 'https://focuscoach.click/api/members/profile' 등
      const response = await axios.get(
        "https://focuscoach.click/api/members/me",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const userData = response.data; // Axios는 응답 데이터를 response.data에 넣어줍니다.
      console.log("사용자 프로필 로드 성공:", userData);

      // 닉네임 필드 채우기: 백엔드에서 'newName'으로 내려주므로 userData.newName을 사용
      if (userData.newName) {
        nicknameInput.value = userData.newName;
      } else {
        nicknameInput.value = "닉네임을 설정해주세요."; // 닉네임이 없을 경우 기본값
      }

      // 공부 목표 필드 채우기 (선택된 태그 활성화): 백엔드에서 'goalName'으로 내려주므로 userData.goalName을 사용
      if (
        userData.goalName &&
        Array.isArray(userData.goalName)
      ) {
        // 모든 버튼의 'selected' 클래스 초기화 (중복 방지)
        tagButtons.forEach((btn) =>
          btn.classList.remove("selected")
        );

        tagButtons.forEach((btn) => {
          const buttonText = btn.textContent.trim();
          // 백엔드에서 받은 goalName 배열에 현재 버튼의 텍스트가 포함되어 있으면 'selected' 클래스 추가
          if (userData.goalName.includes(buttonText)) {
            btn.classList.add("selected");
          }
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
      // 필요시, 에러 발생 시 로그인 페이지로 리다이렉트 등 추가 처리
    }
  };
  // --- 초기 사용자 프로필 로딩 함수 끝 ---

  // === 닉네임 편집 ===
  nicknameEditBtn.addEventListener("click", async () => {
    if (!isNicknameEditing) {
      // 편집 시작
      isNicknameEditing = true;
      toggleEditButton(nicknameEditBtn, true);
      toggleNicknameEditMode(true);
    } else {
      // 편집 완료, 백엔드 전송
      const newName = nicknameInput.value.trim(); // 닉네임 변수명도 'newName'으로 일관성 있게!
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
        window.location.href = "/index.html";
        return;
      }

      try {
        // PATCH 요청, 엔드포인트는 백엔드에서 알려준 'https://focuscoach.click/api/members/name' 사용
        // 보낼 데이터의 키는 'newName'으로 변경!
        await axios.patch(
          "https://focuscoach.click/api/members/name",
          { newName: newName }, // <--- 여기 수정됨: 'nickname' 대신 'newName'
          {
            headers: {
              Authorization: `Bearer ${accessToken}`, // Access Token 추가
              "Content-Type": "application/json", // 데이터 타입 명시
            },
          }
        );
        console.log("닉네임 저장 완료:", newName);
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

  // === 공부 목표 편집 ===
  goalsEditBtn.addEventListener("click", async () => {
    if (!isGoalsEditing) {
      // 편집 시작
      isGoalsEditing = true;
      toggleEditButton(goalsEditBtn, true);
      toggleTagButtons(true);
    } else {
      // 편집 완료, 백엔드 전송
      const selectedGoals = Array.from(
        document.querySelectorAll(".tag-button.selected")
      ).map((btn) => btn.textContent.trim());
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
        window.location.href = "/index.html";
        return;
      }

      try {
        // PUT 요청, 엔드포인트는 '/api/mypage/goals' 사용 (백엔드와 확인 필요)
        // 보낼 데이터의 키는 'goalName'으로 변경!
        await axios.put(
          "https://focuscoach.click/api/members/goals",
          { goalName: selectedGoals }, // <--- 여기 수정됨: 'goals' 대신 'goalName'
          {
            headers: {
              Authorization: `Bearer ${accessToken}`, // Access Token 추가
              "Content-Type": "application/json", // 데이터 타입 명시
            },
          }
        );
        console.log("공부 목표 저장 완료:", selectedGoals);
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
      if (!isGoalsEditing) return; // 편집 모드일 때만 가능
      btn.classList.toggle("selected");
    });
  });

  // === 페이지 로드 시 초기 상태 및 프로필 정보 로드 ===
  toggleNicknameEditMode(false); // 초기에는 닉네임 입력 비활성화
  toggleTagButtons(false); // 초기에는 태그 버튼 비활성화

  // 페이지 로드 후 사용자 프로필 정보 불러오기
  fetchUserProfile(); // <--- 이 함수를 호출하여 초기 데이터를 로드합니다.
});
