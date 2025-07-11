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

        // ✅ URL에서 쿼리스트링 제거
        window.history.replaceState(
          {},
          document.title,
          "/index.html"
        );

        // ✅ 필요한 페이지로 리디렉션
        // window.location.href = "/dashboard.html";
      })
      .catch((err) => {
        console.error("❌ 로그인 실패:", err);
        window.history.replaceState(
          {},
          document.title,
          "/index.html"
        );
      });
  }
};
