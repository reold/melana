<script lang="ts">
  import { onMount } from "svelte";
  import { gsap } from "gsap";
  import type { Movie, CastMember } from "../lib/tmdb";

  export let movie: Movie;
  export let cast: CastMember[];
  export let sourceRect: DOMRect;
  export let onclose: () => void = () => {};
  export let onplay: (movie: Movie) => void = () => {};

  let showAllCast = false;
  let popup: HTMLDivElement;
  let overlay: HTMLDivElement;
  let posterImg: HTMLImageElement;

  $: truncatedCast = showAllCast ? cast : cast.slice(0, 5);
  $: remainingCount = cast.length - 5;

  function close() {
    onclose();
  }

  function backdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) close();
  }

  function handleOverlayKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  function handlePlay() {
    onplay(movie);
  }

  $: backdrop = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : null;
  $: poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder.jpg";

  onMount(() => {
    gsap.fromTo(
      overlay,
      { opacity: 0, duration: 0.3 },
      { opacity: 1, ease: "power2.out" },
    );

    if (posterImg && sourceRect) {
      const targetRect = posterImg.getBoundingClientRect();
      const deltaX = sourceRect.left - targetRect.left;
      const deltaY = sourceRect.top - targetRect.top;
      const scaleX = sourceRect.width / targetRect.width;
      const scaleY = sourceRect.height / targetRect.height;

      gsap.fromTo(
        posterImg,
        {
          x: deltaX,
          y: deltaY,
          scaleX,
          scaleY,
          transformOrigin: "top left",
        },
        {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          duration: 0.4,
          ease: "back.out(1.2)",
        },
      );
    }

    gsap.fromTo(
      popup,
      { scale: 0.95, opacity: 0, duration: 0.3 },
      { scale: 1, opacity: 1, ease: "back.out(1.2)" },
    );
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={overlay}
  class="overlay"
  role="dialog"
  aria-modal="true"
  aria-label="Movie details"
  tabindex="-1"
  on:click={backdropClick}
  on:keydown={handleOverlayKeydown}
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={popup}
    class="card"
    role="presentation"
    on:click|stopPropagation
    on:keydown={() => {}}
  >
    <button class="close-btn" on:click={close} aria-label="Close">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="close-icon"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M6 18 18 6M6 6l12 12"
        />
      </svg>
    </button>

    {#if backdrop}
      <div class="hero" style="background-image: url({backdrop})">
        <div class="hero-gradient"></div>
      </div>
    {/if}

    <div class="content">
      <div class="poster-wrapper">
        <img
          src={poster}
          alt={movie.title}
          style="view-transition-name: movie-poster"
          class="poster"
        />
      </div>

      <div class="info">
        <div class="title-row">
          <h2 style="view-transition-name: movie-title">{movie.title}</h2>
          <button class="btn-play" on:click={handlePlay}>▶ Play</button>
        </div>
        {#if movie.release_date}
          <p class="release" style="view-transition-name: movie-date">
            {movie.release_date.slice(0, 4)}
          </p>
        {/if}
        <div class="rating">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="star-icon"
          >
            <path
              fill-rule="evenodd"
              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
              clip-rule="evenodd"
            />
          </svg>
          {movie.vote_average?.toFixed(1)} / 10
        </div>
        <p class="overview">{movie.overview || "No overview available."}</p>

        {#if cast.length > 0}
          <div class="cast-section">
            <h3>Top Cast</h3>
            <div class="cast-list">
              {#each truncatedCast as actor}
                <div class="cast-chip">
                  {#if actor.profile_path}
                    <img
                      src={`https://image.tmdb.org/t/p/w92${actor.profile_path}`}
                      alt={actor.name}
                    />
                  {:else}
                    <div class="placeholder-avatar">?</div>
                  {/if}
                  <div>
                    <p class="actor-name">{actor.name}</p>
                    <p class="actor-character">{actor.character}</p>
                  </div>
                </div>
              {/each}
            </div>
            {#if remainingCount > 0}
              <button
                class="show-more-btn"
                on:click={() => (showAllCast = !showAllCast)}
              >
                {showAllCast ? "Show less" : `+${remainingCount} more`}
              </button>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    padding: 24px;
  }

  .card {
    position: relative;
    width: 100%;
    max-width: 780px;
    max-height: 90vh;
    overflow-y: auto;
    background: var(--color-bg-surface);
    border-radius: 20px;
    box-shadow: var(--shadow-elevated);
  }

  .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: none;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: background 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .close-icon {
    width: 18px;
    height: 18px;
  }

  .hero {
    height: 200px;
    background-size: cover;
    background-position: center;
    border-radius: 20px 20px 0 0;
    position: relative;
  }

  .hero-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      var(--color-bg-surface) 0%,
      transparent 60%
    );
  }

  .content {
    padding: 0 24px 24px;
    display: flex;
    gap: 24px;
    margin-top: -60px;
    position: relative;
  }

  .poster-wrapper {
    width: 150px;
    flex-shrink: 0;
  }

  .poster {
    width: 100%;
    border-radius: 12px;
    box-shadow: var(--shadow-elevated);
    object-fit: cover;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .info {
    flex: 1;
  }

  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 4px;
  }

  h2 {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.3px;
    flex: 1;
  }

  .btn-play {
    background: var(--color-accent-green);
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 8px 18px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .btn-play:hover {
    background: #30b94e;
  }

  .release {
    font-size: 15px;
    color: var(--color-text-secondary);
    margin: 0 0 12px 0;
    font-weight: 500;
  }

  .rating {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-accent-orange);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .star-icon {
    width: 18px;
    height: 18px;
    color: var(--color-accent-orange);
  }

  .overview {
    font-size: 14px;
    line-height: 1.5;
    color: var(--color-text-secondary);
    margin-bottom: 24px;
  }

  .cast-section h3 {
    font-size: 17px;
    font-weight: 600;
    margin: 0 0 12px 0;
  }

  .cast-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .cast-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 6px 14px 6px 6px;
  }

  .cast-chip img {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    object-fit: cover;
  }

  .placeholder-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  .actor-name {
    font-size: 13px;
    font-weight: 600;
    margin: 0;
  }

  .actor-character {
    font-size: 12px;
    color: var(--color-text-tertiary);
    margin: 0;
  }

  .show-more-btn {
    margin-top: 12px;
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--color-accent-blue);
    border-radius: 10px;
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .show-more-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    .content {
      flex-direction: column;
      align-items: center;
    }
    .poster-wrapper {
      width: 120px;
    }
    h2 {
      font-size: 20px;
    }
    .btn-play {
      padding: 6px 14px;
      font-size: 14px;
    }
  }
</style>
