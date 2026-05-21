<script lang="ts">
  import { onMount } from "svelte";
  import type { Movie, CastMember } from "../lib/tmdb";
  import { fetchMovieDetails } from "../lib/tmdb";

  export let movie: Movie | null = null;
  export let isOpen: boolean = false;
  export let onClose: () => void = () => {};

  let details: (Movie & { credits?: { cast: CastMember[] } }) | null = null;
  let loading: boolean = false;
  let imageElement: HTMLImageElement | null = null;
  let modalElement: HTMLDivElement | null = null;

  async function openModal(mov: Movie) {
    isOpen = true;
    loading = true;
    details = null;

    try {
      details = await fetchMovieDetails(mov.id);
    } catch (e) {
      console.error("Failed to fetch movie details", e);
    }

    loading = false;

    // FLIP Animation: Animate image from card to modal
    if (imageElement && modalElement) {
      setTimeout(() => {
        animateImageTransition();
      }, 0);
    }
  }

  function animateImageTransition() {
    if (!imageElement || !modalElement) return;

    // Get current scroll position
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // FIRST: Get initial position
    const cardImages = document.querySelectorAll(
      ".movie-card .art img",
    ) as NodeListOf<HTMLImageElement>;
    let sourceImg: HTMLImageElement | null = null;

    for (const img of cardImages) {
      if (img.alt === movie?.title) {
        sourceImg = img;
        break;
      }
    }

    if (!sourceImg || !imageElement) return;

    const sourceRect = sourceImg.getBoundingClientRect();
    const targetRect = imageElement.getBoundingClientRect();

    // Calculate FLIP values
    const scaleX = sourceRect.width / targetRect.width;
    const scaleY = sourceRect.height / targetRect.height;
    const translateX = sourceRect.left - targetRect.left;
    const translateY = sourceRect.top - targetRect.top;

    // INVERT: Apply initial transform
    imageElement.style.transform = `
      translate(${translateX}px, ${translateY}px)
      scaleX(${scaleX})
      scaleY(${scaleY})
    `;
    imageElement.style.transformOrigin = "0 0";

    // Force reflow
    void imageElement.offsetHeight;

    // PLAY: Animate to final state
    imageElement.style.transition =
      "transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)";
    imageElement.style.transform = "translate(0, 0) scaleX(1) scaleY(1)";
  }

  function handleClose() {
    isOpen = false;
    onClose();
  }

  onMount(() => {
    if (isOpen && movie) {
      openModal(movie);
    }
  });
</script>

{#if isOpen && movie}
  <div class="modal-overlay" on:click={handleClose}>
    <div
      class="modal-content"
      bind:this={modalElement}
      on:click|stopPropagation
    >
      <button class="close-btn" on:click={handleClose}>✕</button>

      <div class="modal-image">
        {#if movie.poster_path}
          <img
            bind:this={imageElement}
            src="https://image.tmdb.org/t/p/w500{movie.poster_path}"
            alt={movie.title}
          />
        {/if}
      </div>

      <div class="modal-body">
        <h2>{movie.title}</h2>
        <p class="release-date">{movie.release_date}</p>

        {#if loading}
          <p>Loading details...</p>
        {:else if details}
          <div class="rating">
            <span class="stars">⭐ {details.vote_average?.toFixed(1)}</span>
          </div>

          <p class="overview">{details.overview}</p>

          {#if details.credits?.cast && details.credits.cast.length > 0}
            <div class="cast">
              <h3>Cast</h3>
              <div class="cast-grid">
                {#each details.credits.cast.slice(0, 6) as member}
                  <div class="cast-member">
                    {#if member.profile_path}
                      <img
                        src="https://image.tmdb.org/t/p/w185{member.profile_path}"
                        alt={member.name}
                      />
                    {/if}
                    <p class="name">{member.name}</p>
                    <p class="character">{member.character}</p>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <div class="actions">
            <button class="btn-play">PLAY</button>
            <button class="btn-watchlist">+ WATCHLIST</button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
    backdrop-filter: blur(4px);
    animation: fadeIn 0.3s var(--timing-snappy) forwards;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal-content {
    background: var(--color-bg-modal);
    border-radius: 8px;
    border: 2px solid rgba(19, 200, 255, 0.3);
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.8),
      inset 0 0 30px rgba(19, 200, 255, 0.1);
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    position: relative;
    animation: scaleIn 0.3s var(--timing-snappy) forwards;
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.8); /* start smaller */
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .close-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(19, 200, 255, 0.2);
    border: 2px solid var(--color-primary-cyan);
    color: var(--color-primary-cyan);
    width: 40px;
    height: 40px;
    border-radius: 4px;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s var(--timing-snappy);
    z-index: 10;
  }

  .close-btn:hover {
    background: var(--color-primary-cyan);
    color: #000;
    transform: scale(1.1);
  }

  .modal-image {
    position: relative;
    overflow: hidden;
  }

  .modal-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .modal-body {
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
  }

  h2 {
    margin: 0;
    font-family: "Luckiest Guy", cursive;
    font-size: 28px;
    color: var(--color-highlight-yellow);
    text-transform: uppercase;
    letter-spacing: 2px;
    -webkit-text-stroke: 1px rgba(0, 0, 0, 0.5);
    text-shadow: 3px 3px 0px rgba(0, 0, 0, 0.7);
  }

  .release-date {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .rating {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .stars {
    font-size: 16px;
    color: var(--color-uncommon);
    font-weight: 700;
  }

  .overview {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 14px;
    line-height: 1.6;
  }

  .cast {
    margin-top: 16px;
  }

  .cast h3 {
    margin: 0 0 12px 0;
    font-size: 16px;
    color: var(--color-highlight-yellow);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .cast-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .cast-member {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .cast-member img {
    width: 100%;
    aspect-ratio: 2/3;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid rgba(19, 200, 255, 0.2);
  }

  .name {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .character {
    margin: 0;
    font-size: 11px;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
  }

  .btn-play,
  .btn-watchlist {
    flex: 1;
    padding: 14px;
    border-radius: 4px;
    border: 2px solid;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s var(--timing-snappy);
    transform: skewX(-4deg);
  }

  .btn-play {
    background: var(--color-uncommon);
    border-color: var(--color-uncommon);
    color: #000;
  }

  .btn-play:hover {
    transform: skewX(-4deg) scale(1.05);
    background: var(--color-highlight-yellow);
    border-color: var(--color-highlight-yellow);
    box-shadow: 0 0 20px rgba(255, 243, 51, 0.4);
  }

  .btn-watchlist {
    background: rgba(19, 200, 255, 0.15);
    border-color: var(--color-primary-cyan);
    color: var(--color-primary-cyan);
  }

  .btn-watchlist:hover {
    transform: skewX(-4deg) scale(1.05);
    background: var(--color-primary-cyan);
    color: #000;
    box-shadow: 0 0 20px rgba(19, 200, 255, 0.4);
  }

  @media (max-width: 768px) {
    .modal-content {
      grid-template-columns: 1fr;
    }

    .modal-body {
      padding: 24px;
    }

    h2 {
      font-size: 22px;
    }

    .cast-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
