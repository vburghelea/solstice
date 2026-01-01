export const GLOBAL_SEARCH_OPEN_EVENT = "global-search:open";

export const openGlobalSearch = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(GLOBAL_SEARCH_OPEN_EVENT));
};
