<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Header from "./components/Header.svelte";
  import MovieGrid from "./components/MovieGrid.svelte";
  import CacheIndicator from "./components/CacheIndicator.svelte";
  import SortDropdown from "./components/SortDropdown.svelte";
  import CustomStreamDialog from "./components/CustomStreamDialog.svelte";
  import JoinRoomDialog from "./components/JoinRoomDialog.svelte";
  import {
    fetchPopularMovies,
    searchMovies,
    fetchMovieCredits,
    fetchMovieDetails,
  } from "./lib/tmdb";
  import type { Movie, CastMember } from "./lib/tmdb";
  import { debounce } from "./lib/utils";
  import { fetchMovieStreamUrl } from "./lib/videasy";
  import { createProxyUrl, fetchHealth, type HealthInfo } from "./lib/proxy";
  import "./styles/global.css";

  // Lazy-loaded components (heavy: gsap, hls.js live in these)
  let WatchComponent: any = null;
  let MoviePopupComponent: any = null;

  let query = "";
  let movies: Movie[] = [];
  let loading = false;
  let searchInput: HTMLInputElement | undefined;

  let selectedMovie: Movie | null = null;
  let cast: CastMember[] = [];
  let sourceRect: DOMRect | null = null;

  let view: "home" | "watch" = "home";
  let watchMovie: Movie | null = null;
  let watchStreamUrl: string | null = null;
  let watchSubtitles: { url: string; lang: string; language: string }[] = [];
  let watchSources: { quality: string; url: string }[] = [];
  let isTransitioning = false;
  let progressMessage = "";

  let sortBy: "rating" | "name" | "date" = "rating";

  let showJoinRoom = false;
  let syncRoom: { roomId: string; username: string } | null = null;

  // Health / cache state
  let healthInfo: HealthInfo | null = null;
  let healthInterval: ReturnType<typeof setInterval>;
  let cacheJustUpdated = false;
  // Render/proxy cold-start state.
  // Keep showing a disabled spinner until the proxy health endpoint replies.
  let proxyStarting = true;
  // Prevent stacking concurrent health checks during Render cold starts.
  let healthInflight = false;

  // Custom stream dialog
  let showCustomStream = false;
  let customStreamUrl = "";
  let customStreamOrigin = "https://cineby.sc";

  // Preload heavy components in the background after first paint
  onMount(async () => {
    loading = true;
    try {
      movies = await fetchPopularMovies();
    } catch (e) {
      console.error("Failed to fetch popular movies", e);
    }
    loading = false;

    searchInput?.focus();

    // Do not block the app on Render cold-start.
    refreshHealth();
    healthInterval = setInterval(refreshHealth, 10_000);

    // Kick off lazy loads immediately after paint — not blocking
    import("./components/Watch.svelte").then(
      (m) => (WatchComponent = m.default),
    );
    import("./components/MoviePopup.svelte").then(
      (m) => (MoviePopupComponent = m.default),
    );
  });

  const doSearch = debounce(async () => {
    loading = true;
    try {
      movies = query ? await searchMovies(query) : await fetchPopularMovies();
    } catch (e) {
      console.error("Search failed", e);
      movies = [];
    }
    loading = false;
  }, 300);

  // Re-run search whenever the query changes (including being cleared).
  $: query, doSearch();

  $: sortedMovies = [...movies].sort((a, b) => {
    if (sortBy === "rating") {
      return (b.vote_average ?? 0) - (a.vote_average ?? 0);
    }
    if (sortBy === "date") {
      return (b.release_date ?? "").localeCompare(a.release_date ?? "");
    }
    return (a.title ?? "").localeCompare(b.title ?? "");
  });

  async function refreshHealth() {
    if (healthInflight) return;
    healthInflight = true;
    try {
      const newHealth = await fetchHealth();
      if (
        healthInfo &&
        newHealth.cache.utilization_percent !==
          healthInfo.cache.utilization_percent
      ) {
        cacheJustUpdated = true;
        setTimeout(() => (cacheJustUpdated = false), 1500);
      }
      healthInfo = newHealth;
      proxyStarting = false;
    } catch {
      // If Render is still waking up — or the proxy has died mid-session —
      // surface the spinner again.
      proxyStarting = true;
    } finally {
      healthInflight = false;
    }
  }

  onDestroy(() => clearInterval(healthInterval));

  function handleMovieSelect(movie: Movie, rect: DOMRect) {
    selectedMovie = movie;
    sourceRect = rect;

    // Ensure MoviePopup is loaded (should already be preloaded)
    if (!MoviePopupComponent) {
      import("./components/MoviePopup.svelte").then(
        (m) => (MoviePopupComponent = m.default),
      );
    }

    fetchMovieCredits(movie.id)
      .then((c) => (cast = c))
      .catch(() => (cast = []));
  }

  function handleClosePopup() {
    selectedMovie = null;
    sourceRect = null;
    cast = [];
  }

  async function handlePlay(movie: Movie) {
    isTransitioning = true;
    progressMessage = "Fetching movie details...";

    // Ensure Watch is loaded before we switch view
    if (!WatchComponent) {
      const mod = await import("./components/Watch.svelte");
      WatchComponent = mod.default;
    }

    try {
      const details = await fetchMovieDetails(movie.id);
      if (!details.imdb_id) throw new Error("Missing imdb_id");

      progressMessage = "Finding best stream...";
      const result = await fetchMovieStreamUrl({
        title: details.title,
        year: details.release_date?.slice(0, 4) ?? "",
        tmdbId: details.id,
        imdbId: details.imdb_id,
      });

      progressMessage = "Proxying stream...";
      const bestSource =
        result.sources.find((s) => s.quality === "1080p") ?? result.sources[0];
      if (!bestSource) throw new Error("No stream found");

      watchStreamUrl = createProxyUrl(bestSource.url);
      watchSources = result.sources.map((s) => ({
        quality: s.quality,
        url: createProxyUrl(s.url),
      }));
      watchSubtitles = dedupeSubtitles(
        result.subtitles.map((sub) => ({
          ...sub,
          url: createProxyUrl(sub.url),
        })),
      );
      watchMovie = details;

      progressMessage = "Loading player...";
      await new Promise((r) => setTimeout(r, 400));
      view = "watch";
    } catch (e) {
      console.error(e);
      alert("Could not load stream. Try another movie.");
    } finally {
      isTransitioning = false;
      progressMessage = "";
    }
  }

  async function handleCustomStream() {
    const url = customStreamUrl.trim();
    const origin = customStreamOrigin.trim() || "https://cineby.sc";
    if (!url || !url.endsWith(".m3u8")) {
      alert("Invalid .m3u8 URL");
      return;
    }

    isTransitioning = true;
    progressMessage = "Proxying custom stream...";

    if (!WatchComponent) {
      const mod = await import("./components/Watch.svelte");
      WatchComponent = mod.default;
    }

    try {
      watchStreamUrl = createProxyUrl(url, origin);
      watchSources = [{ quality: "Custom", url: watchStreamUrl }];
      watchSubtitles = [];
      watchMovie = {
        id: 0,
        title: "Custom Stream",
        poster_path: null,
        backdrop_path: null,
        release_date: "",
        vote_average: 0,
        overview: "",
      };
      showCustomStream = false;
      await new Promise((r) => setTimeout(r, 400));
      view = "watch";
    } catch (e) {
      console.error(e);
      alert("Failed to load custom stream.");
    } finally {
      isTransitioning = false;
      progressMessage = "";
    }
  }

  function dedupeSubtitles(
    subs: { lang: string; language: string; url: string }[],
  ) {
    const seen = new Set<string>();
    return subs.filter((sub) => {
      const key = sub.language.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function handleBack() {
    view = "home";
    watchMovie = null;
    watchStreamUrl = null;
    watchSubtitles = [];
    watchSources = [];
  }

  function handleJoinRoom(username: string, roomId: string) {
    syncRoom = { roomId, username };
    showJoinRoom = false;
  }

  function handleLeaveSync() {
    syncRoom = null;
  }
</script>

<svelte:head>
  <title>Melana</title>
</svelte:head>

{#if view === "home"}
  <main class="wrap">
    <Header bind:query bind:searchInput onSearch={() => doSearch()} />

    <div class="toolbar">
      <button
        class="custom-stream-btn"
        on:click={() => (showCustomStream = true)}
      >
        <svg
          class="plus-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Custom Stream
      </button>

      <SortDropdown {sortBy} onchange={(e) => (sortBy = e)} />

      <button
        class="sort-btn join-room-btn"
        on:click={() => (showJoinRoom = true)}
      >
        <svg
          class="join-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M15 15l-6 6m0 0l-6-6m6 6V3" />
        </svg>
        Join Room
      </button>

      <div class="cache-inline">
        <CacheIndicator
          {healthInfo}
          {cacheJustUpdated}
          loading={proxyStarting}
        />
      </div>
    </div>

    <MovieGrid
      movies={sortedMovies}
      isLoading={loading}
      onselect={handleMovieSelect}
      onplay={handlePlay}
    />
  </main>

  <!-- Lazy-rendered popup -->
  {#if selectedMovie && sourceRect && MoviePopupComponent}
    <svelte:component
      this={MoviePopupComponent}
      movie={selectedMovie}
      {cast}
      {sourceRect}
      onclose={handleClosePopup}
      onplay={handlePlay}
    />
  {/if}
{:else if watchMovie && watchStreamUrl && WatchComponent}
  <svelte:component
    this={WatchComponent}
    movie={watchMovie}
    streamUrl={watchStreamUrl}
    subtitles={watchSubtitles}
    sources={watchSources}
    {healthInfo}
    {proxyStarting}
    {syncRoom}
    onback={handleBack}
  />
{/if}

<!-- Loading overlay -->
{#if isTransitioning}
  <div class="loading-overlay">
    <div class="loading-card">
      <p class="progress-text">{progressMessage}</p>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
  </div>
{/if}

{#if showJoinRoom}
  <JoinRoomDialog
    onclose={() => (showJoinRoom = false)}
    onjoin={handleJoinRoom}
  />
{/if}

{#if showCustomStream}
  <CustomStreamDialog
    bind:url={customStreamUrl}
    bind:origin={customStreamOrigin}
    onplay={handleCustomStream}
    onclose={() => (showCustomStream = false)}
  />
{/if}

<style>
  .join-room-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: var(--color-text-primary);
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .join-room-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  .join-icon {
    width: 18px;
    height: 18px;
  }
  .wrap {
    max-width: 1200px;
    margin: 0 auto;
    padding: 32px 20px;
  }
  .toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .custom-stream-btn {
    background: var(--color-accent-blue);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .custom-stream-btn:hover {
    background: #0070e9;
  }
  .plus-icon {
    width: 18px;
    height: 18px;
  }
  .cache-inline {
    display: flex;
    align-items: center;
  }
  .loading-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(12px);
  }
  .loading-card {
    background: var(--color-bg-surface);
    border-radius: 16px;
    padding: 32px 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    box-shadow: var(--shadow-elevated);
    min-width: 280px;
  }
  .progress-text {
    font-size: 15px;
    color: var(--color-text-secondary);
    font-weight: 500;
    margin: 0;
  }
  .progress-bar {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    width: 60%;
    background: var(--color-accent-blue);
    border-radius: 2px;
    animation: progress-indeterminate 1.4s ease-in-out infinite;
  }
  @keyframes progress-indeterminate {
    0% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(0%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  @media (max-width: 768px) {
    .wrap {
      padding: 24px 16px;
    }
  }
  @media (max-width: 480px) {
    .wrap {
      padding: 16px 12px;
    }
  }
</style>
