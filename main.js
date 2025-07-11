window.onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");

  if (code) {
    console.log("✅ 인가코드 감지:", code);

    fetch("https://focuscoach.click/api/oauth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("🎉 로그인 성공:", data);

        // data 안에 유저 정보 있다고 가정 (예: data.email, data.name, data.access_token)
        const result = data;

        // 쿼리스트링 제거 (현재 페이지 경로로)
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        // 유저 정보 저장 요청
        return fetch("https://focuscoach.click/api/auth/save-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: result.email,
            name: result.name,
            accessToken: result.access_token, // 실제 키명 확인 필요
          }),
        });
      })
      .then((res) => res.json())
      .then((response) => {
        console.log("✅ 사용자 정보 저장 성공:", response);
        // 로그인 성공 후 이동 예시
        // window.location.href = "/dashboard.html";
      })
      .catch((err) => {
        console.error("❌ 에러 발생:", err);
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      });
  }
};
