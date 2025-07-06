document.addEventListener("DOMContentLoaded", () => {
  fetch("/components/sidebar.html")
    .then((res) => {
      if (!res.ok) throw new Error("사이드바 로딩 실패");
      return res.text();
    })
    .then((html) => {
      const temp = document.createElement("div");
      temp.innerHTML = html;
      const aside = temp.querySelector("aside");
      if (aside) {
        document.body.insertBefore(
          aside,
          document.body.firstChild
        );
      }

      // active 클래스 자동 부여
      const currentPage =
        location.pathname.split("/").pop() || "index.html";
      const links = document.querySelectorAll("aside a");
      links.forEach((link) => {
        const target = link
          .getAttribute("href")
          .split("/")
          .pop();
        if (target === currentPage) {
          link.classList.add("active");
        }
      });
    })
    .catch((err) => {
      console.error("사이드바 로딩 중 오류 발생:", err);
    });
});
