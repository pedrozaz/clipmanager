const invoke = window.__TAURI__ ? window.__TAURI__.core.invoke : async (cmd, args) => console.log(`[Mock Invoke] ${cmd}`, args);

export const api = {
  // Clips
  createClip: (clipData) => invoke("create_clip", clipData),
  getClip: (id) => invoke("get_clip", { id: Number(id) }),
  listClips: (params = {}) => invoke("list_clips", {
    filterStatus: params.filterStatus || null,
    searchQuery: params.searchQuery || null,
    sortBy: params.sortBy || null,
    sortOrder: params.sortOrder || null,
  }),
  updateClip: (clipData) => invoke("update_clip", clipData),
  updateClipStatus: (id, newStatus) => invoke("update_clip_status", { id: Number(id), newStatus }),
  deleteClip: (id) => invoke("delete_clip", { id: Number(id) }),

  // Categories
  createCategory: (name, color) => invoke("create_category", { name, color }),
  listCategories: () => invoke("list_categories"),
  updateCategory: (id, name, color) => invoke("update_category", { id: Number(id), name, color }),
  deleteCategory: (id) => invoke("delete_category", { id: Number(id) }),
  addCategoryToClip: (clipId, categoryId) => invoke("add_category_to_clip", { clipId: Number(clipId), categoryId: Number(categoryId) }),
  removeCategoryFromClip: (clipId, categoryId) => invoke("remove_category_from_clip", { clipId: Number(clipId), categoryId: Number(categoryId) }),
  getClipCategories: (clipId) => invoke("get_clip_categories", { clipId: Number(clipId) }),

  // Settings
  getSetting: (key) => invoke("get_setting", { key }),
  setSetting: (key, value) => invoke("set_setting", { key, value }),
  listSettings: () => invoke("list_settings"),

  // Import & API Integration
  importTwitchClips: (daysBack = 30) => invoke("import_twitch_clips", { daysBack: Number(daysBack) }),
  testTwitchConnection: () => invoke("test_twitch_connection"),
};
