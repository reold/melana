export async function loadWatchComponent() {
  const module = await import("../components/Watch.svelte");
  return module.default;
}

export async function loadMoviePopupComponent() {
  const module = await import("../components/MoviePopup.svelte");
  return module.default;
}
