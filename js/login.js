// Google OAuth 초기화
window.onload = function () {
  google.accounts.id.initialize({
    client_id:
      "906903443579-3g3sibq532i7b63houskeuumfc2v4a4k.apps.googleusercontent.com",
    callback: handleCredentialResponse,
  });

  // 버튼 클릭 시 로그인 창 표시
  document
    .getElementById("googleLoginBtn")
    .addEventListener("click", function () {
      google.accounts.id.prompt(); // 로그인 팝업 열기
    });
};

// 로그인 성공 시 호출되는 콜백
function handleCredentialResponse(response) {
  const idToken = response.credential;
  console.log("받은 토큰:", idToken);

  // 백엔드로 전송
  fetch("http://localhost:8080/api/oauth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: idToken }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("서버 오류");
      return res.json();
    })
    .then((data) => {
      alert(`환영합니다, ${data.name}님!`);
      // 이후 토큰 저장하거나 페이지 이동 등
    })
    .catch((err) => {
      console.error("로그인 실패", err);
      alert("로그인에 실패했습니다.");
    });
}
