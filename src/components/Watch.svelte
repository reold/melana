<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { writable } from "svelte/store";
  import Dropdown from "./Dropdown.svelte";
  import CacheChart from "./CacheChart.svelte";
  import Carousel from "./Carousel.svelte";
  import SeasonCard from "./SeasonCard.svelte";
  import EpisodeCard from "./EpisodeCard.svelte";
  import CastSection from "./CastSection.svelte";
  import type {
    Movie,
    Episode,
    TVDetails,
    CastMember,
    SeasonSummary,
  } from "../lib/tmdb";
  import type { HealthInfo } from "../lib/proxy";
  import type { EpisodePlayRequest, EpisodeHashRequest } from "../lib/appTypes";
  import {
    fetchTVDetails,
    fetchSeasonEpisodes,
    fetchTVCredits,
    fetchMovieDetails,
    fetchMovieCredits,
  } from "../lib/tmdb";
  import { createSyncEngine } from "../lib/syncEngine";
  import { createPlayerControls } from "../lib/playerControls";

  export let movie: Movie;
  export let streamUrl: string;
  export let subtitles: { url: string; lang: string; language: string }[] = [];
  export let sources: { quality: string; url: string }[] = [];
  export let healthInfo: HealthInfo | null = null;
  export let proxyStarting: boolean = false;
  export let syncRoom: { roomId: string; username: string } | null = null;
  export let onback: () => void = () => {};
  export let episodeId: number | undefined = undefined;
  export let seasonNumber: number | undefined = undefined;
  export let showId: number | undefined = undefined;
  export let playId: number = 0; // external play counter for forced reloads
  export let onplayEpisode: (data: EpisodePlayRequest) => void = () => {};
  export let onselectEpisode: (data: EpisodeHashRequest) => void = () => {};
  export let onplay: (movie: Movie) => void = () => {};

  let video: HTMLVideoElement;
  let playerControls: ReturnType<typeof createPlayerControls>;
  let syncEngine: ReturnType<typeof createSyncEngine> | null = null;

  // Sync stores
  let wsConnectedStore: any;
  let othersWaitingStore: any;
  let statusLineStore: any;

  // Player UI stores
  let selectedQuality = writable(-1);
  let selectedSubtitle = writable(-1);
  let subtitleOffset = writable(0);

  let showQualityMenu = false;
  let showSubtitleMenu = false;
  let showCache = false;

  // Media details
  let movieDetails: any = null;
  let tvDetails: TVDetails | null = null;
  let cast: CastMember[] = [];
  let episodeCast: CastMember[] = [];
  let currentEpisode: Episode | null = null;
  let browsedEpisode: Episode | null = null;
  let expandedEpisodeId: number | null = null;
  let loadingDetails = false;
  let detailsError = false;

  // TV navigation
  let displayableSeasons: SeasonSummary[] = [];
  let selectedSeason: number | null = null;
  let episodes: Episode[] = [];
  let loadingEpisodes = false;
  let episodeError = false;

  $: isTV = movie.media_type === "tv" && movie.id !== 0;
  $: isMovie = movie.media_type === "movie" && movie.id !== 0;
  $: isCustomStream = movie.id === 0;
  $: tvId = showId ?? (isTV ? movie.id : undefined);

  $: qualityLabel =
    $selectedQuality === -1
      ? "Auto"
      : (sources[$selectedQuality]?.quality ?? "Auto");
  $: subtitleLabel =
    $selectedSubtitle === -1
      ? "Off"
      : (subtitles[$selectedSubtitle]?.language ?? "Off");

  // Reactive stream loading
  $: if (video && playerControls && (streamUrl || playId)) {
    playerControls.loadStream(streamUrl, subtitles);
  }

  // Apply sync buffer settings whenever the sync connection state changes
  $: if (playerControls) {
    playerControls.applySyncBuffer($wsConnectedStore);
  }

  // Image URLs
  $: episodeStill = browsedEpisode?.still_path || currentEpisode?.still_path;
  $: posterUrl = episodeStill
    ? `https://image.tmdb.org/t/p/w342${episodeStill}`
    : tvDetails?.poster_path
      ? `https://image.tmdb.org/t/p/w342${tvDetails.poster_path}`
      : movieDetails?.poster_path
        ? `https://image.tmdb.org/t/p/w342${movieDetails.poster_path}`
        : movie.poster_path
          ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
          : "/placeholder.jpg";
  $: backdropUrl = episodeStill
    ? `https://image.tmdb.org/t/p/w1280${episodeStill}`
    : tvDetails?.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${tvDetails.backdrop_path}`
      : movieDetails?.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${movieDetails.backdrop_path}`
        : movie.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
          : null;

  $: displayTitle = browsedEpisode
    ? `${movie.title} – ${browsedEpisode.name} (S${browsedEpisode.season_number}E${browsedEpisode.episode_number})`
    : currentEpisode
      ? `${movie.title} – ${currentEpisode.name} (S${currentEpisode.season_number}E${currentEpisode.episode_number})`
      : movie.title;

  $: prevEpisode = currentEpisode
    ? (episodes
        .slice()
        .reverse()
        .find(
          (e) =>
            e.season_number === currentEpisode!.season_number &&
            e.episode_number === currentEpisode!.episode_number - 1,
        ) ?? null)
    : null;
  $: nextEpisode = currentEpisode
    ? (episodes.find(
        (e) =>
          e.season_number === currentEpisode!.season_number &&
          e.episode_number === currentEpisode!.episode_number + 1,
      ) ?? null)
    : null;

  $: if (isMovie && movie.id) {
    loadMovieDetails(movie.id);
  } else if (isTV && tvId) {
    loadTVDetails(tvId);
  } else {
    resetDetails();
  }

  function resetDetails() {
    movieDetails = null;
    tvDetails = null;
    cast = [];
    episodeCast = [];
    currentEpisode = null;
    browsedEpisode = null;
    expandedEpisodeId = null;
    displayableSeasons = [];
    selectedSeason = null;
    episodes = [];
  }

  async function loadMovieDetails(id: number) {
    loadingDetails = true;
    detailsError = false;
    try {
      const [details, credits] = await Promise.all([
        fetchMovieDetails(id),
        fetchMovieCredits(id),
      ]);
      movieDetails = details;
      cast = credits;
    } catch (e) {
      console.error(e);
      detailsError = true;
    } finally {
      loadingDetails = false;
    }
  }

  async function loadTVDetails(id: number) {
    loadingDetails = true;
    detailsError = false;
    try {
      const [details, credits] = await Promise.all([
        fetchTVDetails(id),
        fetchTVCredits(id),
      ]);
      tvDetails = details;
      cast = credits;
      displayableSeasons = details.seasons.filter(
        (s) =>
          s.season_number > 0 &&
          (s.episode_count === null || s.episode_count > 0),
      );
      if (seasonNumber) {
        await selectSeason(seasonNumber);
      } else if (displayableSeasons.length > 0) {
        await selectSeason(displayableSeasons[0].season_number);
      }
    } catch (e) {
      console.error(e);
      detailsError = true;
    } finally {
      loadingDetails = false;
    }
  }

  async function selectSeason(seasonNum: number) {
    selectedSeason = seasonNum;
    loadingEpisodes = true;
    episodeError = false;
    try {
      episodes = await fetchSeasonEpisodes(tvId!, seasonNum);
      if (episodeId) {
        const ep = episodes.find((e) => e.id === episodeId);
        if (ep) {
          setCurrentEpisode(ep);
          browsedEpisode = ep;
          expandedEpisodeId = ep.id;
        }
      }
    } catch (e) {
      console.error(e);
      episodes = [];
      episodeError = true;
    } finally {
      loadingEpisodes = false;
    }
  }

  function setCurrentEpisode(ep: Episode) {
    currentEpisode = ep;
    episodeCast = (ep.guest_stars || []).map((g) => ({
      id: g.id,
      name: g.name,
      character: g.character,
      profile_path: g.profile_path,
    }));
  }

  function browseEpisode(ep: Episode) {
    browsedEpisode = ep;
    expandedEpisodeId = ep.id;
    episodeCast = (ep.guest_stars || []).map((g) => ({
      id: g.id,
      name: g.name,
      character: g.character,
      profile_path: g.profile_path,
    }));
  }

  function backToSeasons() {
    selectedSeason = null;
    episodes = [];
    currentEpisode = null;
    browsedEpisode = null;
    expandedEpisodeId = null;
    episodeCast = [];
  }

  function handleEpisodePlay(ep: Episode) {
    onplayEpisode({
      episodeId: ep.id,
      showTitle: movie.title,
      year: tvDetails?.first_air_date?.slice(0, 4) ?? "",
      tmdbId: tvId!,
      season: ep.season_number,
      episodeNumber: ep.episode_number,
      episodeName: ep.name,
    });
    setCurrentEpisode(ep);
    browsedEpisode = ep;
    expandedEpisodeId = ep.id;
  }

  function handleEpisodeCardSelect(ep: Episode) {
    browseEpisode(ep);
  }

  function handleJoinSync() {
    const room = prompt("Room ID:")?.trim();
    const name = prompt("Your name:")?.trim();
    if (room && name) syncEngine?.connect(room, name, streamUrl);
  }

  onMount(() => {
    playerControls = createPlayerControls(video, subtitles, sources);
    playerControls.loadStream(streamUrl, subtitles);

    playerControls.selectedQuality.subscribe((v) => selectedQuality.set(v));
    playerControls.selectedSubtitle.subscribe((v) => selectedSubtitle.set(v));
    playerControls.subtitleOffset.subscribe((v) => subtitleOffset.set(v));

    const engine = createSyncEngine(video);
    syncEngine = engine;
    wsConnectedStore = engine.wsConnected;
    othersWaitingStore = engine.othersWaiting;
    statusLineStore = engine.statusLine;

    video.addEventListener("sync-stream-change", ((e: CustomEvent) => {
      if (e.detail !== streamUrl) {
        streamUrl = e.detail;
      }
    }) as EventListener);

    if (syncRoom) {
      engine.connect(syncRoom.roomId, syncRoom.username, streamUrl);
    }
  });

  onDestroy(() => {
    playerControls?.destroy();
    syncEngine?.destroy();
  });
</script>

<div class="watch-container">
  <!-- Control bar unchanged -->
  <div class="control-bar">
    <button class="ctrl-btn back-btn" on:click={() => onback()} title="Back">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="icon"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
        />
      </svg>
      <span class="btn-label">Back</span>
    </button>

    <h1 class="movie-title">{displayTitle}</h1>

    <div class="bar-controls">
      <Dropdown bind:showMenu={showQualityMenu} label={qualityLabel}>
        <button
          class:active={$selectedQuality === -1}
          on:click={() => playerControls.setQuality(-1, sources)}>Auto</button
        >
        {#each sources as src, i}
          <button
            class:active={$selectedQuality === i}
            on:click={() => playerControls.setQuality(i, sources)}
            >{src.quality}</button
          >
        {/each}
      </Dropdown>

      <Dropdown bind:showMenu={showSubtitleMenu} label={subtitleLabel}>
        <button
          class:active={$selectedSubtitle === -1}
          on:click={() => playerControls.setSubtitle(-1)}>Off</button
        >
        {#each subtitles as sub, i}
          <button
            class:active={$selectedSubtitle === i}
            on:click={() => playerControls.setSubtitle(i)}
            >{sub.language}</button
          >
        {/each}
      </Dropdown>

      {#if healthInfo}
        <button
          class="ctrl-btn cache-btn"
          class:active={showCache}
          on:click={() => (showCache = !showCache)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="icon"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75"
            />
          </svg>
          <span class="cache-pct"
            >{healthInfo.cache.utilization_percent.toFixed(0)}%</span
          >
        </button>
      {:else if proxyStarting}
        <button class="ctrl-btn cache-btn" disabled
          ><span class="spinner" /></button
        >
      {:else}
        <button class="ctrl-btn cache-btn" disabled>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="icon"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75"
            />
          </svg>
        </button>
      {/if}

      {#if $wsConnectedStore}
        <span
          class="sync-indicator"
          class:waiting={$othersWaitingStore.length > 0}
          title={$statusLineStore}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="icon icon-spin"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
            />
          </svg>
        </span>
        <button
          class="ctrl-btn"
          on:click={() => syncEngine?.shareStream(streamUrl)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="icon"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
            />
          </svg>
        </button>
        <button
          class="ctrl-btn leave-btn"
          on:click={() => syncEngine?.disconnect()}
          title="Leave sync room"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="icon"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      {:else}
        <button class="ctrl-btn sync-join-btn" on:click={handleJoinSync}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="icon"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
            />
          </svg>
          <span class="btn-label">Sync</span>
        </button>
      {/if}
    </div>
  </div>

  <!-- Subtitle timing bar -->
  {#if $selectedSubtitle !== -1}
    <div class="timing-bar">
      <button on:click={() => playerControls.adjustSubtitleOffset(-0.1)}
        >−0.1</button
      >
      <button on:click={() => playerControls.adjustSubtitleOffset(-1)}
        >−1</button
      >
      <span class="offset-display">{$subtitleOffset.toFixed(1)}s</span>
      <button on:click={() => playerControls.adjustSubtitleOffset(0.1)}
        >+0.1</button
      >
      <button on:click={() => playerControls.adjustSubtitleOffset(1)}>+1</button
      >
      <button
        on:click={() => playerControls.resetSubtitleOffset()}
        class="reset-btn">Reset</button
      >
    </div>
  {/if}

  <!-- Sync status -->
  {#if $wsConnectedStore}
    <div
      class="sync-status-line"
      class:waiting={$othersWaitingStore.length > 0}
    >
      <span class="sync-dot" class:waiting={$othersWaitingStore.length > 0}
      ></span>
      {$statusLineStore}
    </div>
  {/if}

  <!-- Cache chart -->
  {#if showCache && healthInfo}
    <div class="cache-section"><CacheChart {healthInfo} /></div>
  {/if}

  <!-- Video player -->
  <video
    bind:this={video}
    controls
    autoplay
    class="player"
    crossorigin="anonymous"
    poster={backdropUrl}
  ></video>

  <!-- Previous/Next episode buttons -->
  {#if isTV && currentEpisode}
    <div class="ep-nav">
      {#if prevEpisode}
        <button
          class="ep-nav-btn"
          on:click={() => handleEpisodePlay(prevEpisode)}
        >
          ← {prevEpisode.name}
        </button>
      {:else}
        <div class="ep-nav-btn-placeholder"></div>
      {/if}
      {#if nextEpisode}
        <button
          class="ep-nav-btn"
          on:click={() => handleEpisodePlay(nextEpisode)}
        >
          {nextEpisode.name} →
        </button>
      {:else}
        <div class="ep-nav-btn-placeholder"></div>
      {/if}
    </div>
  {/if}

  <!-- DETAILS PANEL (identical to original) -->
  <div class="details-panel">
    {#if loadingDetails}
      <div class="loading-text">Loading details…</div>
    {:else if detailsError}
      <div class="error-text">Failed to load details.</div>
    {:else}
      <div class="details-row">
        <img class="poster-sm" src={posterUrl} alt={displayTitle} />
        <div class="meta">
          <h2>{displayTitle}</h2>
          <p class="sub">
            {browsedEpisode?.air_date ||
              tvDetails?.first_air_date ||
              movie.release_date ||
              "N/A"}
            {#if browsedEpisode?.runtime}
              &nbsp;| {browsedEpisode.runtime} min
            {:else if isMovie && movieDetails?.runtime}
              &nbsp;| {movieDetails.runtime} min
            {/if}
          </p>

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
            <span class="rating-value">
              {browsedEpisode?.vote_average?.toFixed(1) ??
                currentEpisode?.vote_average?.toFixed(1) ??
                movieDetails?.vote_average?.toFixed(1) ??
                tvDetails?.vote_average?.toFixed(1) ??
                movie.vote_average?.toFixed(1) ??
                "N/A"} / 10
            </span>
          </div>

          <p class="overview">
            {browsedEpisode?.overview ||
              currentEpisode?.overview ||
              movieDetails?.overview ||
              tvDetails?.overview ||
              movie.overview ||
              "No overview available."}
          </p>

          <div class="extra-meta">
            {#if movieDetails?.genres?.length}
              <div class="genre-tags">
                {#each movieDetails.genres as g}
                  <span class="genre-pill">{g.name}</span>
                {/each}
              </div>
            {/if}
            {#if tvDetails?.genres?.length}
              <div class="genre-tags">
                {#each tvDetails.genres as g}
                  <span class="genre-pill">{g.name}</span>
                {/each}
              </div>
            {/if}

            {#if movieDetails?.status && movieDetails.status !== "Released"}
              <p class="stat">Status: {movieDetails.status}</p>
            {/if}
            {#if tvDetails?.status && tvDetails.status !== "Released"}
              <p class="stat">Status: {tvDetails.status}</p>
            {/if}

            {#if tvDetails}
              <div class="tv-stats">
                {#if tvDetails.created_by?.length}
                  <p class="creators">
                    Created by: {tvDetails.created_by
                      .map((c) => c.name)
                      .join(", ")}
                  </p>
                {/if}
                {#if tvDetails.networks?.length}
                  <p class="networks">
                    Network: {tvDetails.networks.map((n) => n.name).join(", ")}
                  </p>
                {/if}
              </div>
            {/if}

            {#if movieDetails?.credits?.crew}
              {@const director = movieDetails.credits.crew.find(
                (c) => c.job === "Director",
              )}
              {#if director}
                <p class="director">Director: {director.name}</p>
              {/if}
            {/if}
          </div>
        </div>
      </div>

      {#if (browsedEpisode || currentEpisode) && episodeCast.length > 0}
        <div class="cast-section">
          <h3>Episode Cast</h3>
          <div class="cast-list">
            {#each episodeCast as actor}
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
        </div>
      {:else if cast.length > 0}
        <CastSection {cast} />
      {/if}

      {#if isTV && tvDetails && !detailsError}
        <div class="tv-section">
          {#if !selectedSeason}
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
                  highlight={season.season_number ===
                    (seasonNumber ?? displayableSeasons[0]?.season_number)}
                  onclick={() => selectSeason(season.season_number)}
                />
              </Carousel>
            </div>
          {:else}
            <div class="carousel-section">
              <div
                style="display:flex; align-items:center; gap:10px; margin-bottom:10px; flex-wrap:wrap;"
              >
                <button class="back-to-seasons" on:click={backToSeasons}
                  >← Back to Seasons</button
                >
                <h3>Episodes – Season {selectedSeason}</h3>
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
                    on:click={() => selectSeason(selectedSeason!)}>Retry</button
                  >
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
                    isSelected={ep.id === (currentEpisode?.id ?? episodeId)}
                    isExpanded={ep.id === expandedEpisodeId}
                    onplay={() => handleEpisodePlay(ep)}
                    onselect={() => handleEpisodeCardSelect(ep)}
                  />
                </Carousel>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  /* All existing styles remain unchanged */
  .watch-container {
    max-width: 960px;
    margin: 0 auto;
    padding: 24px;
  }
  .control-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }
  .ctrl-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: var(--color-text-primary);
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: background 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .ctrl-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.18);
  }
  .ctrl-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .ctrl-btn.active {
    background: rgba(0, 122, 255, 0.2);
    border-color: var(--color-accent-blue);
  }
  .icon {
    width: 17px;
    height: 17px;
    flex-shrink: 0;
  }
  .back-btn {
    background: var(--color-accent-blue);
    border-color: var(--color-accent-blue);
    color: #fff;
    font-weight: 600;
  }
  .back-btn:hover {
    background: #0070e9;
  }
  .movie-title {
    font-size: 17px;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.3px;
    flex: 1;
    min-width: 100px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .bar-controls {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .cache-btn .cache-pct {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-accent-blue);
    background: rgba(0, 122, 255, 0.12);
    border-radius: 4px;
    padding: 1px 5px;
    margin-left: 1px;
  }
  .spinner {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top-color: var(--color-accent-blue);
    animation: spin 0.8s linear infinite;
    display: inline-block;
  }
  .sync-indicator {
    display: flex;
    align-items: center;
    padding: 4px;
    border-radius: 6px;
    color: #34c759;
  }
  .sync-indicator.waiting {
    color: #ff9f0a;
  }
  .icon-spin {
    animation: spin-slow 3s linear infinite;
  }
  .leave-btn {
    color: var(--color-accent-pink) !important;
  }
  .sync-join-btn {
    background: rgba(52, 199, 89, 0.15);
    border-color: rgba(52, 199, 89, 0.3);
    color: #34c759;
  }
  .sync-join-btn:hover {
    background: rgba(52, 199, 89, 0.25);
  }
  .timing-bar {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 6px;
    padding-left: 4px;
  }
  .timing-bar button {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--color-text-secondary);
    border-radius: 5px;
    padding: 3px 8px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }
  .timing-bar button:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }
  .offset-display {
    font-size: 12px;
    color: var(--color-accent-blue);
    font-weight: 600;
    min-width: 36px;
    text-align: center;
  }
  .reset-btn {
    color: var(--color-accent-pink) !important;
  }
  .sync-status-line {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #34c759;
    margin-bottom: 6px;
  }
  .sync-status-line.waiting {
    color: #ff9f0a;
  }
  .sync-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #34c759;
    flex-shrink: 0;
  }
  .sync-dot.waiting {
    background: #ff9f0a;
  }
  .cache-section {
    margin-bottom: 10px;
    animation: fadeIn 0.25s ease-out;
  }
  .player {
    width: 100%;
    border-radius: 16px;
    background: #000;
    box-shadow: var(--shadow-elevated);
    margin-bottom: 20px;
  }
  .ep-nav {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
    gap: 12px;
  }
  .ep-nav-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: var(--color-text-primary);
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
    flex: 1;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  .ep-nav-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  .ep-nav-btn-placeholder {
    flex: 1;
  }
  .details-panel {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 20px;
    backdrop-filter: blur(10px);
    margin-top: 20px;
  }
  .loading-text,
  .error-text {
    text-align: center;
    color: var(--color-text-secondary);
    padding: 20px;
  }
  .details-row {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
  }
  .poster-sm {
    width: 140px;
    height: auto;
    border-radius: 10px;
    object-fit: cover;
    box-shadow: var(--shadow-card);
    flex-shrink: 0;
  }
  .meta {
    flex: 1;
    min-width: 0;
  }
  .meta h2 {
    font-size: 20px;
    margin: 0 0 8px;
    font-weight: 700;
    letter-spacing: -0.3px;
  }
  .sub {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0 0 12px;
  }
  .rating {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 12px;
  }
  .star-icon {
    width: 16px;
    height: 16px;
    color: var(--color-accent-orange);
    flex-shrink: 0;
  }
  .rating-value {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-accent-orange);
  }
  .overview {
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin-bottom: 12px;
  }
  .extra-meta {
    font-size: 13px;
    color: var(--color-text-secondary);
    margin-top: 8px;
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
  .stat,
  .creators,
  .networks,
  .director {
    margin: 4px 0;
  }
  .tv-stats {
    margin: 6px 0;
  }
  .cast-section {
    margin-top: 20px;
  }
  .cast-section h3 {
    font-size: 16px;
    margin: 0 0 10px;
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
    max-width: 100%;
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }
  .actor-character {
    font-size: 12px;
    color: var(--color-text-tertiary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }
  .tv-section {
    margin-top: 20px;
  }
  .carousel-section {
    margin-top: 16px;
  }
  .carousel-section h3 {
    font-size: 16px;
    margin: 0 0 10px 0;
  }
  .back-to-seasons {
    background: rgba(255, 255, 255, 0.1);
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
    background: rgba(255, 255, 255, 0.2);
  }
  .loading-episodes,
  .no-episodes-msg,
  .error-msg {
    text-align: center;
    padding: 20px;
    color: var(--color-text-secondary);
  }
  .error-msg {
    color: var(--color-accent-pink);
  }
  .loading-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: var(--color-accent-blue);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
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
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes spin-slow {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @media (max-width: 768px) {
    .watch-container {
      padding: 16px;
    }
    .movie-title {
      font-size: 15px;
      min-width: 60px;
    }
    .btn-label {
      display: none;
    }
    .ctrl-btn {
      padding: 6px 8px;
    }
    .bar-controls {
      gap: 4px;
    }
    .details-row {
      flex-direction: column;
    }
    .poster-sm {
      width: 100px;
    }
    .ep-nav-btn {
      font-size: 12px;
      padding: 6px 10px;
    }
  }
</style>
