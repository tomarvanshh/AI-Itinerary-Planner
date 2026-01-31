const tagInput = document.getElementById("tagInput");
const tagContainer = document.getElementById("tagContainer");

// if (!tagInput || !tagContainer) return;

let tags = [];

tagInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();

    const value = tagInput.value.trim().toLowerCase();
    if (value === "" || tags.includes(value)) return;

    addTag(value);
    tagInput.value = "";
  }
});

function addTag(text) {
  tags.push(text);

  const tag = document.createElement("div");
  tag.classList.add("tag");
  tag.innerHTML = `${text} <span>&times;</span>`;

  tag.querySelector("span").addEventListener("click", () => {
    tagContainer.removeChild(tag);
    tags = tags.filter((t) => t !== text);
  });

  tagContainer.insertBefore(tag, tagInput);
}

export function getPreferences() {
  return tags;
}