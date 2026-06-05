<script lang="ts">
  import { searchMovies } from "../lib/tmdb";
  import type { Movie } from "../lib/tmdb";
  import { debounce } from "../lib/utils";

  export let query = "";
  export let searchInput: HTMLInputElement | undefined = undefined;
  export let onsearch: () => void = () => {};

  let suggestions: Movie[] = [];
  let showSuggestions = false;
  let selectedIndex = -1;

  const fetchSuggestions = debounce(async () => {
    if (!query.trim()) {
      suggestions = [];
      showSuggestions = false;
      return;
    }
    try {
      suggestions = await searchMovies(query);
      showSuggestions = true;
      selectedIndex = -1;
    } catch {
      suggestions = [];
      showSuggestions = false;
    }
  }, 200);

  $: if (query) fetchSuggestions();
  else {
    suggestions = [];
    showSuggestions = false;
  }

  function selectSuggestion(movie: Movie) {
    query = movie.title;
    showSuggestions = false;
    // Don't call onsearch() here – the query change triggers the parent's search
    searchInput?.focus();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!showSuggestions) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        selectSuggestion(suggestions[selectedIndex]);
      } else {
        showSuggestions = false;
        onsearch();
      }
    }
  }

  function handleBlur() {
    setTimeout(() => (showSuggestions = false), 150);
  }

  function clearQuery() {
    query = "";
    suggestions = [];
    showSuggestions = false;
    searchInput?.focus();
  }
</script>

<div class="autocomplete-wrapper">
  <input
    bind:this={searchInput}
    bind:value={query}
    placeholder="Search Movies"
    aria-label="Search movies"
    class="search-input"
    on:focus={() => {
      if (suggestions.length) showSuggestions = true;
    }}
    on:blur={handleBlur}
    on:keydown={handleKeydown}
  />

  {#if query}
    <button
      class="clear-btn"
      on:click={clearQuery}
      aria-label="Clear search"
      type="button"
    >
      <svg
        class="clear-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  {/if}

  <button class="search-button" on:click={() => onsearch()} aria-label="Search">
    <svg
      class="search-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  </button>

  {#if showSuggestions && suggestions.length > 0}
    <div class="suggestions-dropdown">
      {#each suggestions as movie, i}
        <button
          class="suggestion-item"
          class:selected={i === selectedIndex}
          on:click={() => selectSuggestion(movie)}
          on:mouseenter={() => (selectedIndex = i)}
        >
          {movie.title}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .autocomplete-wrapper {
    position: relative;
    display: flex;
    flex: 1;
    gap: 8px;
    align-items: center;
  }
  .search-input {
    flex: 1;
    padding: 10px 56px 10px 16px; /* increased right padding */
    border-radius: 20px;
    border: none;
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    outline: none;
    font-size: 16px;
    font-weight: 500;
    transition: background 0.2s;
    backdrop-filter: blur(10px);
  }
  .search-input::placeholder {
    color: var(--color-text-tertiary);
  }
  .search-input:focus {
    background: #3a3a3c;
    box-shadow: 0 0 0 2px var(--color-accent-blue);
  }

  .clear-btn {
    position: absolute;
    right: 56px; /* moved further left */
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--color-text-tertiary);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }
  .clear-btn:hover {
    color: var(--color-text-primary);
  }
  .clear-icon {
    width: 16px;
    height: 16px;
  }

  .search-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border: none;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
      background 0.2s,
      transform 0.1s;
  }
  .search-button:hover {
    background: rgba(255, 255, 255, 0.25);
  }
  .search-button:active {
    transform: scale(0.95);
  }
  .search-icon {
    width: 20px;
    height: 20px;
  }
  .suggestions-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 48px;
    margin-top: 4px;
    background: var(--color-bg-elevated);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    padding: 4px;
    z-index: 100;
    box-shadow: var(--shadow-elevated);
    max-height: 240px;
    overflow-y: auto;
  }
  .suggestion-item {
    background: none;
    border: none;
    color: var(--color-text-primary);
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    text-align: left;
    width: 100%;
    display: block;
  }
  .suggestion-item:hover,
  .suggestion-item.selected {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
