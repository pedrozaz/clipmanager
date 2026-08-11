export function renderCategoryTag(category) {
  const color = category.color || "#8b5cf6";
  return `
    <span class="tag" style="color: ${color} !important">
      ${category.name}
    </span>
  `;
}
