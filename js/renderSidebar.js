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

      // ✅ 아이콘 변경 로직 여기서 실행
      const menuLinks = document.querySelectorAll("aside a");

      function updateIcons(activeLink) {
        menuLinks.forEach((link) => {
          const img = link.querySelector("img");
          const href = link.getAttribute("href");
          const iconName = href.split("/").pop().split(".")[0]; // ex: home, report

          if (link === activeLink) {
            img.src = `/assets/sidebar_icon/${iconName}_white.png`;
          } else {
            img.src = `/assets/sidebar_icon/${iconName}.png`;
          }
        });
      }

      menuLinks.forEach((link) => {
        link.addEventListener("click", function () {
          updateIcons(this);
        });
      });

      // 현재 페이지에 맞게 아이콘 설정
      links.forEach((link) => {
        const href = link.getAttribute("href");
        const fileName = href.split("/").pop();
        if (fileName === currentPage) {
          updateIcons(link);
        }
      });
    })
    .catch((err) => {
      console.error("사이드바 로딩 중 오류 발생:", err);
    });
});
