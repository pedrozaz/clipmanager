const invoke = window.__TAURI__ ? window.__TAURI__.core.invoke : async (cmd, args) => console.log(`[Mock Invoke] ${cmd}`, args);

export const api = {
  // Clips
  createClip: (clipData) => invoke("create_clip", clipData),
  getClip: (id) => invoke("get_clip", { id }),
  listClips: (params = {}) => invoke("list_clips", {
    filterStatus: params.filterStatus || null,
    searchQuery: params.searchQuery || null,
    sortBy: params.sortBy || null,
    sortOrder: params.sortOrder || null,
  }),
  updateClip: (clipData) => invoke("update_clip", clipData),
  updateClipStatus: (id, newStatus) => invoke("update_clip_status", { id, newStatus }),
  deleteClip: (id) => invoke("delete_clip", { id }),

  // Categories
  createCategory: (name, color) => invoke("create_category", { name, color }),
  listCategories: () => invoke("list_categories"),
  updateCategory: (id, name, color) => invoke("update_category", { id, name, color }),
  deleteCategory: (id) => invoke("delete_category", { id }),
  addCategoryToClip: (clipId, categoryId) => invoke("add_category_to_clip", { clipId, categoryId }),
  removeCategoryFromClip: (clipId, categoryId) => invoke("remove_category_from_clip", { clipId, categoryId }),
  getClipCategories: (clipId) => invoke("get_clip_categories", { clipId }),
};
