export function renderCategoryTag(category) {
  const color = category.color || "#8b5cf6";
  return `
    <span class="category-tag" style="--tag-color: ${color}">
      ${category.name}
    </span>
  `;
}
