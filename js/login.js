window.onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");

  if (code) {
    console.log("✅ 인가코드 감지:", code);

    fetch("https://focuscoach.click/api/oauth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("🎉 로그인 성공:", data);

        // --- 여기에 Access Token 및 사용자 정보 저장 ---
        if (data && data.result.jwtAccessToken) {
          localStorage.setItem("accessToken", data.result.jwtAccessToken);
          console.log("✅ Access Token 로컬 스토리지에 저장 완료!");

          // 백엔드 응답에 email, name이 있다면 함께 저장 (선택 사항)
          if (data.email) {
            localStorage.setItem("userEmail", data.result.email);
            console.log("✅ 사용자 이메일 로컬 스토리지에 저장 완료!");
          }
          if (data.name) {
            localStorage.setItem("userName", data.result.name);
            console.log("✅ 사용자 이름 로컬 스토리지에 저장 완료!");
          }
        } else {
          console.error("❌ 백엔드 응답에 Access Token이 없습니다:", data);
          alert("로그인 처리 실패: Access Token을 받지 못했습니다.");
          // 토큰이 없으면 리디렉션하지 않고 함수 종료
          window.history.replaceState(
            {},
            document.title,
            "/pages/loginpage.html"
          ); // URL 정리
          return;
        }

        // ✅ URL에서 쿼리스트링 제거
        window.history.replaceState(
          {},
          document.title,
          "/pages/loginpage.html"
        );

        // ✅ 필요한 페이지로 리디렉션
        window.location.href = "/pages/signup.html";
      })
      .catch((err) => {
        console.error("❌ 로그인 실패:", err);
        window.history.replaceState(
          {},
          document.title,
          "/pages/loginpage.html"
        );
      });
  }
};
