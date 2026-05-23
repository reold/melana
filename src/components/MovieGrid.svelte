<script lang="ts">
  import MovieCard from "./MovieCard.svelte";
  import type { Movie } from "../lib/tmdb";

  export let movies: Movie[] = [];
  export let isLoading: boolean = false;

  // Callbacks
  export let onselect: (movie: Movie, rect: DOMRect) => void = () => {};
  export let onplay: (movie: Movie) => void = () => {};
</script>

<section class="grid">
  {#if isLoading}
    {#each Array(20) as _, i}
      <MovieCard isSkeleton={true} key={i} />
    {/each}
  {:else if movies.length === 0}
    <div class="empty">NO MOVIES FOUND</div>
  {:else}
    {#each movies as movie (movie.id)}
      <MovieCard {movie} {onselect} {onplay} />
    {/each}
  {/if}
</section>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
    animation: fadeIn 0.4s var(--timing-ease-out);
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
