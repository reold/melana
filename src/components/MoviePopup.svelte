<!-- components/MoviePopup.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import type { Movie, CastMember } from "../lib/tmdb";
  import {
    fetchMovieDetails,
    fetchTVDetails,
    fetchSeasonEpisodes,
    type TVDetails,
    type Episode,
  } from "../lib/tmdb";
  import {
    runEntranceAnimation,
    runExitAnimation,
  } from "../lib/popupAnimations";
  import CastSection from "./CastSection.svelte";
  import EpisodeCard from "./EpisodeCard.svelte";
  import Carousel from "./Carousel.svelte";
  import SeasonCard from "./SeasonCard.svelte";

  export let movie: Movie;
  export let cast: CastMember[];
  export let sourceRect: DOMRect | null;
  export let selectedEpisodeId: number | null = null;
  export let selectedSeasonNumber: number | null = null;

  export let onclose: () => void = () => {};
  export let onplay: (movie: Movie) => void = () => {};
  export let onplayEpisode: (data: {
    episodeId: number;
    showTitle: string;
    year: string;
    tmdbId: number;
    season: number;
    episodeNumber: number;
    episodeName: string;
  }) => void = () => {};
  export let onSelectEpisode: (data: {
    tmdbId: number;
    season: number;
    episodeNumber: number;
  }) => void = () => {};

  let popup: HTMLDivElement;
  let overlay: HTMLDivElement;
  let details: any | null = null;
  let isTV = movie.media_type === "tv" || false;
  let tvDetails: TVDetails | null = null;
  let selectedSeason: number | null = null;
  let episodes: Episode[] = [];
  let loadingEpisodes = false;
  let detailsLoading = false;
  let detailsError = false;
  let episodeError = false;
  let isClosing = false;
  let entranceTimeline: any = null;

  $: displayableSeasons = tvDetails
    ? tvDetails.seasons.filter(
        (s) =>
          s.season_number > 0 &&
          (s.episode_count === null || s.episode_count > 0),
      )
    : [];

  // Derived helpers
  $: releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : "";
  $: ratingValue = movie.vote_average?.toFixed(1) ?? null;

  function close() {
    if (isClosing) return;
    isClosing = true;
    const isMobileCard = window.innerWidth <= 480;
    const cardArtHeight = isMobileCard ? 220 : 280;
    runExitAnimation(overlay, popup, sourceRect, cardArtHeight, onclose);
  }

  function backdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) close();
  }

  function handlePlay() {
    onplay(movie);
  }

  function handleEpisodePlay(ep: Episode) {
    onplayEpisode({
      episodeId: ep.id,
      showTitle: movie.title,
      year: tvDetails?.first_air_date?.slice(0, 4) ?? "",
      tmdbId: movie.id,
      season: ep.season_number,
      episodeNumber: ep.episode_number,
      episodeName: ep.name,
    });
  }

  function handleSelectEpisode(ep: Episode) {
    onSelectEpisode({
      tmdbId: movie.id,
      season: ep.season_number,
      episodeNumber: ep.episode_number,
    });
  }

  function handlePlayFirstEpisode() {
    if (episodes.length > 0) handleEpisodePlay(episodes[0]);
  }

  function handlePlayLastEpisode() {
    if (tvDetails?.last_episode_to_air) {
      const le = tvDetails.last_episode_to_air;
      onplayEpisode({
        episodeId: le.id,
        showTitle: movie.title,
        year: tvDetails.first_air_date?.slice(0, 4) ?? "",
        tmdbId: movie.id,
        season: le.season_number,
        episodeNumber: le.episode_number,
        episodeName: le.name,
      });
    }
  }

  async function loadDetails() {
    detailsLoading = true;
    detailsError = false;
    try {
      if (isTV) {
        tvDetails = await fetchTVDetails(movie.id);
        details = tvDetails;
        if (selectedSeasonNumber) await selectSeason(selectedSeasonNumber);
      } else {
        details = await fetchMovieDetails(movie.id);
      }
    } catch (e) {
      console.error(e);
      detailsError = true;
    } finally {
      detailsLoading = false;
    }
  }

  async function selectSeason(seasonNumber: number) {
    selectedSeason = seasonNumber;
    loadingEpisodes = true;
    episodes = [];
    episodeError = false;
    try {
      episodes = await fetchSeasonEpisodes(movie.id, seasonNumber);
    } catch (e) {
      console.error(e);
      episodes = [];
      episodeError = true;
    } finally {
      loadingEpisodes = false;
    }
  }

  function backToSeasons() {
    selectedSeason = null;
    episodes = [];
    episodeError = false;
  }

  onMount(async () => {
    const isMobileCard = window.innerWidth <= 480;
    const cardArtHeight = isMobileCard ? 220 : 280;
    entranceTimeline = await runEntranceAnimation(
      overlay,
      popup,
      sourceRect,
      cardArtHeight,
    );
    void loadDetails();
  });

  $: backdrop = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : null;
  $: posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder.jpg";
</script>

<div
  bind:this={overlay}
  class="overlay"
  role="dialog"
  aria-modal="true"
  aria-label="Movie details"
  tabindex="-1"
  on:click={backdropClick}
  on:keydown={(e) => e.key === "Escape" && close()}
>
  <div
    bind:this={popup}
    class="card"
    role="presentation"
    on:click|stopPropagation
  >
    <button class="close-btn fade-content" on:click={close} aria-label="Close">
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
      <div class="hero fade-content" style="background-image: url({backdrop})">
        <div class="hero-gradient"></div>
      </div>
    {/if}

    <div class="content">
      <div class="poster-wrapper">
        <img src={posterUrl} alt={movie.title} class="poster" />
      </div>

      <div class="info">
        <!-- Title -->
        <h2 class="fade-content">{movie.title}</h2>

        <!-- Rating + year on same line (if any) -->
        <div class="meta-line fade-content">
          {#if ratingValue !== null}
            <span class="rating">
              <svg class="star-icon" viewBox="0 0 24 24" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                  clip-rule="evenodd"
                />
              </svg>
              {ratingValue}
            </span>
          {/if}
          {#if releaseYear}
            <span class="year">{releaseYear}</span>
          {/if}
        </div>

        <!-- Main action button -->
        {#if !isTV}
          <button class="btn-play fade-content" on:click={handlePlay}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="play-svg"
            >
              <path
                fill-rule="evenodd"
                d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                clip-rule="evenodd"
              />
            </svg>
            Play
          </button>
        {:else if tvDetails && selectedSeason && episodes.length > 0 && !loadingEpisodes}
          <button
            class="btn-play-first fade-content"
            on:click={handlePlayFirstEpisode}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="play-svg"
            >
              <path
                fill-rule="evenodd"
                d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                clip-rule="evenodd"
              />
            </svg>
            Play First
          </button>
        {/if}

        <!-- Overview -->
        {#if movie.overview}
          <p class="overview fade-content">
            {movie.overview}
          </p>
        {/if}

        {#if detailsError}
          <p class="error-msg fade-content">
            Failed to load details. Please try again later.
          </p>
        {/if}

        <!-- Genres & additional meta -->
        {#if details && !detailsLoading}
          <div class="tv-meta fade-content">
            {#if details.genres?.length}
              <div class="genre-tags">
                {#each details.genres as g}
                  <span class="genre-pill">{g.name}</span>
                {/each}
              </div>
            {/if}

            {#if isTV}
              <div class="tv-stats">
                {#if details.status && details.status !== "Released"}
                  <span class="stat">{details.status}</span>
                  <span class="separator">•</span>
                {/if}
                <span class="stat">{details.number_of_seasons} seasons</span>
                <span class="separator">•</span>
                <span class="stat">{details.number_of_episodes} episodes</span>
              </div>
              {#if details.created_by?.length}
                <p class="creators">
                  Created by: {details.created_by.map((c) => c.name).join(", ")}
                </p>
              {/if}
              {#if details.networks?.length}
                <p class="networks">
                  Network: {details.networks.map((n) => n.name).join(", ")}
                </p>
              {/if}
              {#if details.last_episode_to_air}
                <button class="last-ep-btn" on:click={handlePlayLastEpisode}>
                  Last aired: {details.last_episode_to_air.name} ({details
                    .last_episode_to_air.air_date})
                </button>
              {/if}
              {#if details.next_episode_to_air}
                <p class="next-ep">
                  Next: {details.next_episode_to_air.name} ({details
                    .next_episode_to_air.air_date})
                </p>
              {/if}
            {:else}
              {#if details.status && details.status !== "Released"}
                <p class="stat">Status: {details.status}</p>
              {/if}
              {#if details.production_companies?.length}
                <p class="networks">
                  Production: {details.production_companies
                    .map((c) => c.name)
                    .join(", ")}
                </p>
              {/if}
              {#if details.credits?.crew}
                {@const director = details.credits.crew.find(
                  (c) => c.job === "Director",
                )}
                {#if director}
                  <p class="creators">Director: {director.name}</p>
                {/if}
              {/if}
            {/if}
          </div>
        {/if}

        <!-- Cast -->
        <CastSection {cast} />

        <!-- TV section -->
        {#if isTV && tvDetails && !detailsLoading}
          <div class="fade-content">
            {#if !selectedSeason}
              {#if displayableSeasons.length > 0}
                <div class="carousel-section">
                  <h3>Seasons</h3>
                  <Carousel
                    items={displayableSeasons}
                    cardWidth={180}
                    cardGap={16}
                    key="season_number"
                    let:item={season}
                  >
                    <SeasonCard
                      {season}
                      highlight={season.season_number === selectedSeasonNumber}
                      onclick={() => selectSeason(season.season_number)}
                    />
                  </Carousel>
                </div>
              {:else}
                <div class="no-seasons-msg">
                  <p>No seasons available for this show.</p>
                </div>
              {/if}
            {:else}
              <div class="carousel-section">
                <div
                  style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;"
                >
                  <button class="back-to-seasons" on:click={backToSeasons}>
                    ← Back to Seasons
                  </button>
                  <h3>Episodes – Season {selectedSeason}</h3>
                  {#if episodes.length > 0 && !loadingEpisodes}
                    <button
                      class="btn-play-first"
                      on:click={handlePlayFirstEpisode}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="play-svg"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      Play First
                    </button>
                  {/if}
                </div>

                {#if loadingEpisodes}
                  <div class="loading-episodes">
                    <div class="loading-spinner"></div>
                    <p>Loading episodes...</p>
                  </div>
                {:else if episodeError}
                  <div class="error-msg">
                    <p>Failed to load episodes.</p>
                    <button
                      class="retry-btn"
                      on:click={() => selectSeason(selectedSeason!)}
                    >
                      Retry
                    </button>
                  </div>
                {:else if episodes.length === 0}
                  <div class="no-episodes-msg">
                    <p>No episodes available for this season.</p>
                  </div>
                {:else}
                  <Carousel
                    items={episodes}
                    cardWidth={180}
                    cardGap={16}
                    key="id"
                    let:item={ep}
                  >
                    <EpisodeCard
                      {ep}
                      isSelected={ep.id === selectedEpisodeId}
                      onplay={() => handleEpisodePlay(ep)}
                      onselect={() => handleSelectEpisode(ep)}
                    />
                  </Carousel>
                {/if}
              </div>
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
    background: rgba(0, 0, 0, 0.5);
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    padding: 24px;
    opacity: 0;
  }
  .card {
    position: relative;
    width: 100%;
    max-width: 780px;
    max-height: 90vh;
    overflow-y: auto;
    overflow-x: hidden;
    background: rgba(255, 255, 255, 0.1);
    -webkit-backdrop-filter: blur(30px);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    opacity: 0;
    transform-origin: top left;
  }
  .fade-content {
    will-change: opacity, transform;
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
    border: 1px solid rgba(255, 255, 255, 0.2);
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
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 60%);
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
    aspect-ratio: 2 / 3;
    display: block;
    border-radius: 12px;
    box-shadow: var(--shadow-elevated);
    object-fit: cover;
    border: 1px solid rgba(255, 255, 255, 0.1);
    will-change: transform;
  }
  .info {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  /* Title */
  h2 {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 8px 0;
    letter-spacing: -0.3px;
    will-change: transform;
  }

  /* Rating & year line */
  .meta-line {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 15px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }
  .meta-line .rating {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--color-accent-orange);
    font-weight: 600;
  }
  .star-icon {
    width: 16px;
    height: 16px;
    color: var(--color-accent-orange);
  }
  .year {
    color: var(--color-text-secondary);
  }

  /* Play button */
  .btn-play,
  .btn-play-first {
    width: 100%;
    background: linear-gradient(to bottom, var(--color-accent-green), #2ecc71);
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 12px 18px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.2s;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    margin-bottom: 16px;
  }
  .btn-play-first {
    background: linear-gradient(to bottom, var(--color-accent-orange), #f57c00);
  }
  .btn-play:hover {
    background: linear-gradient(to bottom, #30b94e, #28a745);
  }
  .btn-play-first:hover {
    background: linear-gradient(to bottom, #e08600, #d07400);
  }
  .play-svg {
    width: 18px;
    height: 18px;
  }

  /* Overview */
  .overview {
    font-size: 14px;
    line-height: 1.5;
    color: var(--color-text-secondary);
    margin: 0 0 20px 0;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  /* Error */
  .error-msg {
    color: var(--color-accent-pink);
    font-size: 14px;
    margin-bottom: 16px;
  }

  /* TV meta */
  .tv-meta {
    margin-bottom: 16px;
    font-size: 13px;
    color: var(--color-text-secondary);
  }
  .genre-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }
  .genre-pill {
    background: var(--color-accent-blue);
    color: #fff;
    border-radius: 12px;
    padding: 2px 10px;
    font-size: 12px;
    font-weight: 500;
  }
  .tv-stats {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }
  .tv-stats .separator {
    color: var(--color-text-tertiary);
    opacity: 0.5;
  }
  .creators,
  .networks {
    margin: 4px 0;
  }
  .last-ep-btn {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 4px 10px;
    color: var(--color-accent-blue);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: block;
    margin: 6px 0;
    transition: background 0.2s;
  }
  .last-ep-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  .next-ep {
    margin: 2px 0;
    font-style: italic;
  }
  .back-to-seasons {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--color-text-primary);
    border-radius: 8px;
    padding: 4px 12px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }
  .back-to-seasons:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .carousel-section {
    margin-top: 20px;
  }
  .carousel-section h3 {
    font-size: 16px;
    margin: 0 0 10px 0;
    color: var(--color-text-primary);
  }

  .no-seasons-msg,
  .no-episodes-msg {
    text-align: center;
    padding: 20px;
    color: var(--color-text-secondary);
  }
  .loading-episodes {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px;
    gap: 12px;
    color: var(--color-text-secondary);
  }
  .loading-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: var(--color-accent-blue);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .retry-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--color-text-primary);
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 13px;
    cursor: pointer;
    margin-top: 8px;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .overlay {
      padding: 12px;
      align-items: flex-start;
    }
    .card {
      max-height: 96vh;
      border-radius: 16px;
    }
    .hero {
      height: 140px;
    }
    .content {
      flex-direction: column;
      align-items: center;
      padding: 0 16px 16px;
      gap: 12px;
    }
    .poster-wrapper {
      width: 110px;
      margin-top: -40px;
    }
    .info {
      width: 100%;
      text-align: center;
    }
    h2 {
      font-size: 20px;
      text-align: center;
    }
    .meta-line {
      justify-content: center;
    }
    .btn-play,
    .btn-play-first {
      font-size: 15px;
      padding: 10px 16px;
    }
  }
</style>
