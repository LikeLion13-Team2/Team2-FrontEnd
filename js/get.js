document
  .getElementById("fetchSessionBtn")
  .addEventListener("click", () => {
    const sessionId =
      document.getElementById("sessionIdInput").value;
    const token =
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJoeXVuYmluaTI5NDJAZ21haWwuY29tIiwicm9sZSI6IlJPTEVfVVNFUiIsImlhdCI6MTc1MjE2MzQ4NiwiZXhwIjoxNzUyMTY1Mjg2fQ.VyJBXGfIuglOCDu3aQNZX1JpQBK1mVnMVrnjbuanWHc";

    if (!sessionId) {
      alert("세션 ID를 입력하세요.");
      return;
    }

    fetch(
      `https://focuscoach.click/api/v1/study-sessions/${sessionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("서버 오류 또는 세션 없음");
        return res.json();
      })
      .then((data) => {
        console.log("✅ 세션 조회 성공:", data);
        alert(JSON.stringify(data.result, null, 2)); // 보기 편하게 출력
      })
      .catch((err) => {
        console.error("❌ 세션 조회 실패:", err);
        alert("세션 조회 실패: " + err.message);
      });
  });
