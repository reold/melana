<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import MovieCard from "./MovieCard.svelte";
  import type { Movie } from "../lib/tmdb";

  export let movies: Movie[] = [];
  export let isLoading: boolean = false;
  export let loadingMore: boolean = false;
  export let hasMore: boolean = true;
  export let onselect: (movie: Movie, rect: DOMRect) => void = () => {};
  export let onplay: (movie: Movie) => void = () => {};
  export let onLoadMore: () => void = () => {};

  // First 3 cards get network-level image priority (fetchpriority="high",
  // loading="eager", decoding="sync"). Keep this small — every priority
  // image competes for bandwidth with the LCP image.
  const PRIORITY_COUNT = 3;

  // First 6 cards get paint-level priority via content-visibility: visible.
  // They opt out of the auto-skip and render eagerly. This is free at the
  // network level — only changes whether the browser does the paint work.
  const EAGER_COUNT = 6;

  let sentinel: HTMLDivElement;
  let observer: IntersectionObserver;

  onMount(() => {
    if (!sentinel) return;
    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !loadingMore && !isLoading) {
          onLoadMore();
        }
      },
      {
        rootMargin: "400px",
        threshold: 0.01,
      },
    );
    observer.observe(sentinel);
  });

  onDestroy(() => observer?.disconnect());
</script>

<section class="grid">
  {#if isLoading}
    {#each Array(20) as _, i}
      <MovieCard isSkeleton={true} key={i} />
    {/each}
  {:else if movies.length === 0}
    <div class="empty">No movies found!</div>
  {:else}
    {#each movies as movie, i (movie.id)}
      <MovieCard
        {movie}
        {onselect}
        {onplay}
        priority={i < PRIORITY_COUNT}
        eager={i < EAGER_COUNT}
      />
    {/each}
    {#if loadingMore}
      {#each Array(6) as _, i}
        <MovieCard isSkeleton={true} key={`more-${i}`} />
      {/each}
    {/if}
  {/if}
  <div bind:this={sentinel} class="sentinel"></div>
</section>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
    animation: fadeIn 0.4s var(--timing-ease-out);
    padding-bottom: 20px;
  }

  .sentinel {
    grid-column: 1 / -1;
    height: 1px;
    visibility: hidden;
    pointer-events: none;
  }

  .empty {
    grid-column: 1 / -1;
    padding: 60px 20px;
    text-align: center;
    color: var(--color-text-tertiary);
    font-size: 17px;
    font-weight: 500;
  }

  @media (max-width: 768px) {
    .grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 16px;
    }
  }

  @media (max-width: 480px) {
    .grid {
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
    }
  }
</style>
