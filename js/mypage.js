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
    const token =
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjYXBzdG9uZXJ1ZG9scGgxQGdtYWlsLmNvbSIsInJvbGUiOiJST0xFX1VTRVIiLCJpYXQiOjE3NTIyNjU0NjgsImV4cCI6MTc1MjI4NzA2OH0.LOvj4g-VnnLJVWbCrjmizOVvBP0DOP87qBebZ68SiEg";

    try {
      // 백엔드에서 사용자 프로필을 불러오는 GET API
      const response = await axios.get(
        "https://focuscoach.click/api/members/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
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
      if (userData.goals && Array.isArray(userData.goals)) {
        // 모든 버튼의 'selected' 클래스 초기화 (중복 활성화 방지)
        tagButtons.forEach((btn) =>
          btn.classList.remove("selected")
        );

        // goals 배열에서 각 객체의 goalName을 추출하여 해당 버튼 활성화
        userData.goals.forEach((goalObj) => {
          const goalText = goalObj.goalName.trim();
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

      if (!newName) {
        alert("닉네임을 입력해주세요.");
        return;
      }

      try {
        // PUT 요청으로 닉네임 업데이트
        const token =
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjYXBzdG9uZXJ1ZG9scGgxQGdtYWlsLmNvbSIsInJvbGUiOiJST0xFX1VTRVIiLCJpYXQiOjE3NTIyNjU0NjgsImV4cCI6MTc1MjI4NzA2OH0.LOvj4g-VnnLJVWbCrjmizOVvBP0DOP87qBebZ68SiEg";
        await axios.put(
          "https://focuscoach.click/api/members/name", // 닉네임 업데이트 API 엔드포인트
          { newName: newName }, // 백엔드가 'newName'이라는 키를 기대합니다.
          {
            headers: {
              Authorization: `Bearer ${token}`, // 제공받은 토큰 사용
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

      // 선택된 목표들을 콤마로 구분된 문자열로 변환
      const goalNamesString = selectedGoals.join(",");

      try {
        // PUT 요청으로 공부 목표 업데이트
        const token =
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjYXBzdG9uZXJ1ZG9scGgxQGdtYWlsLmNvbSIsInJvbGUiOiJST0xFX1VTRVIiLCJpYXQiOjE3NTIyNjU0NjgsImV4cCI6MTc1MjI4NzA2OH0.LOvj4g-VnnLJVWbCrjmizOVvBP0DOP87qBebZ68SiEg";
        await axios.put(
          "https://focuscoach.click/api/members/goals", // 공부 목표 업데이트 API 엔드포인트
          { goalNames: goalNamesString }, // API 문서에 따라 goalNames 필드에 콤마로 구분된 문자열 전송
          {
            headers: {
              Authorization: `Bearer ${token}`, // 제공받은 토큰 사용
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

  // === 로그아웃 이벤트 리스너 ===
  const logoutLink = document.querySelector(
    ".footer-links a:nth-child(3)"
  ); // "로그아웃" 링크 선택
  if (
    logoutLink &&
    logoutLink.textContent.includes("로그아웃")
  ) {
    logoutLink.addEventListener("click", async (e) => {
      e.preventDefault(); // 기본 링크 동작 방지

      const confirmed = confirm("로그아웃 하시겠습니까?");
      if (!confirmed) return;

      try {
        // 로그아웃 API 호출
        const token =
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjYXBzdG9uZXJ1ZG9scGgxQGdtYWlsLmNvbSIsInJvbGUiOiJST0xFX1VTRVIiLCJpYXQiOjE3NTIyNjU0NjgsImV4cCI6MTc1MjI4NzA2OH0.LOvj4g-VnnLJVWbCrjmizOVvBP0DOP87qBebZ68SiEg";

        await axios.delete(
          "https://focuscoach.click/api/members/logout",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // localStorage에서 토큰 제거
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        alert("로그아웃되었습니다.");

        // index.html로 리다이렉트
        window.location.href = "/index.html";
      } catch (error) {
        console.error(
          "로그아웃 실패:",
          error.response?.data || error
        );

        // API 호출이 실패해도 로컬에서는 로그아웃 처리
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        alert(
          "로그아웃 처리 중 오류가 발생했지만, 로컬에서 로그아웃됩니다."
        );
        window.location.href = "/index.html";
      }
    });
  }

  // === 회원 탈퇴 이벤트 리스너 ===
  const deleteAccountLink = document.querySelector(
    ".footer-links a.danger"
  ); // "회원 탈퇴" 링크 선택
  if (
    deleteAccountLink &&
    deleteAccountLink.textContent.includes("회원 탈퇴")
  ) {
    deleteAccountLink.addEventListener("click", async (e) => {
      e.preventDefault(); // 기본 링크 동작 방지

      const confirmed = confirm(
        "정말로 회원 탈퇴하시겠습니까?\n\n탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다."
      );
      if (!confirmed) return;

      // 두 번째 확인
      const doubleConfirmed = confirm(
        "정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      );
      if (!doubleConfirmed) return;

      try {
        // 회원 탈퇴 API 호출
        const token =
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJjYXBzdG9uZXJ1ZG9scGgxQGdtYWlsLmNvbSIsInJvbGUiOiJST0xFX1VTRVIiLCJpYXQiOjE3NTIyNjU0NjgsImV4cCI6MTc1MjI4NzA2OH0.LOvj4g-VnnLJVWbCrjmizOVvBP0DOP87qBebZ68SiEg";

        await axios.delete(
          "https://focuscoach.click/api/members/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // localStorage에서 모든 사용자 데이터 제거
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.clear(); // 모든 localStorage 데이터 삭제

        alert(
          "회원 탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다."
        );

        // index.html로 리다이렉트
        window.location.href = "/index.html";
      } catch (error) {
        console.error(
          "회원 탈퇴 실패:",
          error.response?.data || error
        );
        alert(
          "회원 탈퇴 처리 중 오류가 발생했습니다: " +
            (error.response?.data?.message || error.message)
        );
      }
    });
  }
});
