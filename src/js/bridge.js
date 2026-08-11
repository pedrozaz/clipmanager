const invoke = window.__TAURI__ ? window.__TAURI__.core.invoke : async (cmd, args) => console.log(`[Mock Invoke] ${cmd}`, args);

export const api = {
  // Clips
  createClip: (clipData) => invoke("create_clip", clipData),
  getClip: (id) => invoke("get_clip", { id: Number(id) }),
  listClips: (params = {}) => invoke("list_clips", {
    filterStatus: params.filterStatus || null,
    filterCategoryId: params.filterCategoryId ? Number(params.filterCategoryId) : null,
    searchQuery: params.searchQuery || null,
    sortBy: params.sortBy || null,
    sortOrder: params.sortOrder || null,
  }),
  updateClip: (d) => invoke("update_clip", {
    id: Number(d.id),
    title: d.title ?? '',
    twitchUrl: d.twitchUrl ?? null,
    youtubeUrl: d.youtubeUrl ?? null,
    instagramUrl: d.instagramUrl ?? null,
    thumbnailUrl: d.thumbnailUrl ?? null,
    duration: d.duration ? Number(d.duration) : null,
    clipDate: d.clipDate ?? null,
    status: d.status ?? 'Novo',
    notes: d.notes ?? null,
  }),
  updateClipStatus: (id, newStatus) => invoke("update_clip_status", { id: Number(id), newStatus }),
  deleteClip: (id) => invoke("delete_clip", { id: Number(id) }),
  deleteAllClips: () => invoke("delete_all_clips"),

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

  // Analytics & Dashboard
  fetchYoutubeAnalytics: (clipId) => invoke("fetch_youtube_analytics", { clipId: Number(clipId) }),
  fetchAllAnalytics: () => invoke("fetch_all_analytics"),
  getAnalyticsHistory: (clipId) => invoke("get_analytics_history", { clipId: Number(clipId) }),
  testYoutubeConnection: () => invoke("test_youtube_connection"),
  getDashboardStats: () => invoke("get_dashboard_stats"),
  getClipsByStatusCount: () => invoke("get_clips_by_status_count"),
  getTopClips: (limit = 10) => invoke("get_top_clips", { limit: Number(limit) }),

  // Valorant Match Linker
  fetchRecentMatches: (size = 10, start = 0, mode = null) => invoke("fetch_recent_matches", {
    size: size ? Number(size) : null,
    start: start ? Number(start) : 0,
    mode: mode || null,
  }),
  fetchMatchById: (matchId) => invoke("fetch_match_by_id", { matchId }),
  linkMatchToClip: (params) => invoke("link_match_to_clip", {
    clipId: Number(params.clipId),
    matchId: params.matchId,
    agent: params.agent,
    map: params.map,
    score: params.score,
    kda: params.kda,
    result: params.result,
    rank: params.rank || null,
  }),
  getClipMatchData: (clipId) => invoke("get_clip_match_data", { clipId: Number(clipId) }),
  unlinkMatchFromClip: (clipId) => invoke("unlink_match_from_clip", { clipId: Number(clipId) }),
  getValorantStats: () => invoke("get_valorant_stats"),
  testValorantConnection: () => invoke("test_valorant_connection"),

  // Export & Backup
  exportDataJson: () => invoke("export_data_json"),
  exportClipsCsv: () => invoke("export_clips_csv"),
  importDataJson: (jsonStr) => invoke("import_data_json", { jsonStr }),
};
