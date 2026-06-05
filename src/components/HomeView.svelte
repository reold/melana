<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import Header from "./Header.svelte";
  import MovieGrid from "./MovieGrid.svelte";
  import CacheIndicator from "./CacheIndicator.svelte";
  import SortDropdown from "./SortDropdown.svelte";
  import MediaTypeDropdown from "./MediaTypeDropdown.svelte";
  import SourceDropdown from "./SourceDropdown.svelte";
  import type { HealthInfo } from "../lib/proxy";
  import type { MediaType, Movie, SortOption } from "../lib/tmdb";
  import { debounce } from "../lib/utils";
  import { SORT_OPTIONS } from "../lib/mediaCatalog";
  import { createCatalogStore } from "../lib/catalogStore";
  import { createXmbBackground } from "../lib/xmbBackground"; // <-- new

  export let healthInfo: HealthInfo | null = null;
  export let cacheJustUpdated = false;
  export let proxyStarting = true;
  export let activeMovieId: number | undefined = undefined;
  export let onselect: (movie: Movie, rect: DOMRect) => void = () => {};
  export let onplay: (movie: Movie) => void = () => {};
  export let onJoinRoom: () => void = () => {};
  export let onCustomStream: () => void = () => {};
  export let currentSource: string = "videasy"; // <-- bound from App
  export let onSourceChange: (value: string) => void = () => {}; // <-- new

  const catalog = createCatalogStore();
  const {
    movies,
    loading,
    loadingMore,
    hasMore,
    error,
    isSearching,
    loadFirstPage,
    loadMore,
  } = catalog;

  let query = "";
  let searchInput: HTMLInputElement | undefined;
  let mediaType: MediaType = "movie";
  let currentSort: SortOption = "popularity.desc";
  let showMediaDropdown = false;
  let mounted = false;

  let previousQuery = "";
  let previousMediaType: MediaType = mediaType;
  let previousSort: SortOption = currentSort;

  let destroyXmb: (() => void) | undefined;

  onMount(async () => {
    destroyXmb = createXmbBackground(); // start wave background
    await loadFirstPage({ query, mediaType, sort: currentSort, page: 1 });
    searchInput?.focus();
    previousQuery = query;
    previousMediaType = mediaType;
    previousSort = currentSort;
    mounted = true;
  });

  onDestroy(() => {
    destroyXmb?.(); // clean up background
  });

  const runSearch = () => {
    if (!query.trim()) {
      loadFirstPage({ query, mediaType, sort: currentSort, page: 1 });
      return;
    }
    loadFirstPage({ query, mediaType, sort: currentSort, page: 1 });
  };

  const debouncedSearch = debounce(runSearch, 300);

  $: if (mounted) {
    synchronizeCatalog(query, mediaType, currentSort);
  }

  function synchronizeCatalog(
    nextQuery: string,
    nextMediaType: MediaType,
    nextSort: SortOption,
  ) {
    const queryChanged = nextQuery !== previousQuery;
    const mediaChanged = nextMediaType !== previousMediaType;
    const sortChanged = nextSort !== previousSort;

    if (!queryChanged && !mediaChanged && !sortChanged) return;

    const wasSearching = previousQuery.trim().length > 0;
    const shouldSearch = nextQuery.trim().length > 0;

    previousQuery = nextQuery;
    previousMediaType = nextMediaType;
    previousSort = nextSort;

    if (shouldSearch) {
      void debouncedSearch();
      return;
    }

    if (wasSearching || mediaChanged || sortChanged) {
      loadFirstPage({
        query: nextQuery,
        mediaType: nextMediaType,
        sort: nextSort,
        page: 1,
      });
    }
  }

  function handleLoadMore() {
    loadMore({ query, mediaType, sort: currentSort, page: 0 });
  }

  // Helper that updates both local state and propagates to parent
  function handleSourceChange(value: string) {
    currentSource = value;
    onSourceChange(value);
  }
</script>

<main class="wrap">
  <Header bind:query bind:searchInput onSearch={runSearch} />

  <div class="toolbar">
    <MediaTypeDropdown bind:mediaType bind:showMenu={showMediaDropdown} />
    {#if !$isSearching}
      <SortDropdown
        options={SORT_OPTIONS}
        selected={currentSort}
        onchange={(value) => (currentSort = value)}
      />
    {/if}
    <!-- Fixed: propagate change to parent -->
    <SourceDropdown selected={currentSource} onchange={handleSourceChange} />

    <button class="join-room-btn" on:click={onJoinRoom}>
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
      <CacheIndicator {healthInfo} {cacheJustUpdated} loading={proxyStarting} />
    </div>
  </div>

  {#if $error}
    <div class="error-banner">
      <p>{$error}</p>
      <button
        class="retry-btn"
        on:click={() =>
          loadFirstPage({ query, mediaType, sort: currentSort, page: 1 })}
        >Retry</button
      >
    </div>
  {/if}

  <MovieGrid
    movies={$movies}
    isLoading={$loading}
    loadingMore={$loadingMore}
    hasMore={$hasMore}
    {activeMovieId}
    onLoadMore={handleLoadMore}
    {onselect}
    {onplay}
  />
</main>

<button
  class="floating-custom-btn"
  on:click={onCustomStream}
  aria-label="Open custom stream dialog"
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
</button>

<style>
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
  .join-room-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: var(--color-text-primary);
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background 0.2s;
  }
  .join-room-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  .join-icon {
    width: 18px;
    height: 18px;
  }
  .cache-inline {
    display: flex;
    align-items: center;
  }
  .error-banner {
    background: rgba(255, 45, 85, 0.15);
    border: 1px solid var(--color-accent-pink);
    color: var(--color-accent-pink);
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .error-banner p {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
  }
  .retry-btn {
    background: var(--color-accent-pink);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .floating-custom-btn {
    position: fixed;
    bottom: 32px;
    right: 32px;
    z-index: 999;
    background: var(--color-accent-blue);
    color: #fff;
    border: none;
    border-radius: 50%;
    padding: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 122, 255, 0.4);
    transition:
      transform 0.2s,
      box-shadow 0.2s,
      background 0.2s;
  }
  .floating-custom-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(0, 122, 255, 0.55);
    background: #0070e9;
  }
  .floating-custom-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.4);
  }
  .plus-icon {
    width: 24px;
    height: 24px;
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
