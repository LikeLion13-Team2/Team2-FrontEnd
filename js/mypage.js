document.addEventListener("DOMContentLoaded", () => {
  const tagButtons = document.querySelectorAll(".tag-button");
  const editBtn = document.querySelector(".edit-btn");
  let isEditing = false;

  const toggleTagButtons = (enable) => {
    tagButtons.forEach((button) => {
      if (enable) {
        button.disabled = false;
        button.addEventListener("click", handleToggle);
      } else {
        button.disabled = true;
      }
    });
  };

  const handleToggle = (e) => {
    e.currentTarget.classList.toggle("selected");
  };

  editBtn.addEventListener("click", () => {
    isEditing = !isEditing;
    editBtn.innerHTML = isEditing
      ? `<img src="/assets/mypage_icon/done.png" alt="완성" class="icon-img" /> 완성`
      : `<img src="/assets/mypage_icon/edit.png" alt="편집" class="icon-img" /> 편집`;
    toggleTagButtons(isEditing);
  });

  toggleTagButtons(false);
});
