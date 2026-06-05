<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import HomeView from "./components/HomeView.svelte";
  import LoadingOverlay from "./components/LoadingOverlay.svelte";
  import CustomStreamDialog from "./components/CustomStreamDialog.svelte";
  import JoinRoomDialog from "./components/JoinRoomDialog.svelte";
  import type { CastMember, Movie } from "./lib/tmdb";
  import { createHealthMonitor } from "./lib/healthMonitor";
  import {
    clearLocationHash,
    loadMediaSelectionFromRoute,
    parseMediaHash,
    toEpisodeHash,
    toMediaHash,
    type MediaSelection,
  } from "./lib/hashRouting";
  import { fetchCastForMedia } from "./lib/mediaDetails";
  import {
    buildCustomWatchPayload,
    buildEpisodeWatchPayload,
    buildMovieWatchPayload,
    type WatchPayload,
  } from "./lib/streamPlayback";
  import {
    loadMoviePopupComponent,
    loadWatchComponent,
  } from "./lib/lazyComponents";
  import type {
    AppView,
    EpisodeHashRequest,
    EpisodePlayRequest,
    SyncRoom,
  } from "./lib/appTypes";
  import "./styles/global.css";

  let WatchComponent: any = null;
  let MoviePopupComponent: any = null;
  let selectedMovie: Movie | null = null;
  let selectedEpisodeId: number | null = null;
  let selectedSeasonNumber: number | null = null;
  let cast: CastMember[] = [];
  let sourceRect: DOMRect | null = null;
  let view: AppView = "home";
  let watchMovie: Movie | null = null;
  let watchStreamUrl: string | null = null;
  let watchSubtitles: { url: string; lang: string; language: string }[] = [];
  let watchSources: { quality: string; url: string }[] = [];
  let watchEpisodeId: number | undefined = undefined;
  let watchSeasonNumber: number | undefined = undefined;
  let watchShowId: number | undefined = undefined;
  let isTransitioning = false;
  let progressMessage = "";
  let showJoinRoom = false;
  let syncRoom: SyncRoom | null = null;
  let showCustomStream = false;
  let customStreamUrl = "";
  let customStreamOrigin = "";
  let skipNextHashChange = false;

  let currentSource: string = "vidlink"; // <-- new state
  let playCounter = 0;

  const health = createHealthMonitor();

  onMount(() => {
    health.start();
    void warmLazyComponents();
    void handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
  });

  onDestroy(() => {
    health.stop();
    window.removeEventListener("hashchange", handleHashChange);
  });

  async function warmLazyComponents() {
    try {
      const [Watch, MoviePopup] = await Promise.all([
        loadWatchComponent(),
        loadMoviePopupComponent(),
      ]);
      WatchComponent = Watch;
      MoviePopupComponent = MoviePopup;
    } catch (error) {
      console.error("Failed to warm lazy components", error);
    }
  }

  async function ensureWatchComponent() {
    if (!WatchComponent) {
      WatchComponent = await loadWatchComponent();
    }
  }

  async function ensureMoviePopupComponent() {
    if (!MoviePopupComponent) {
      MoviePopupComponent = await loadMoviePopupComponent();
    }
  }

  async function handleHashChange() {
    if (skipNextHashChange) {
      skipNextHashChange = false;
      return;
    }
    const route = parseMediaHash(window.location.hash);
    if (!route) return;

    try {
      const selection = await loadMediaSelectionFromRoute(route);
      if (selection) {
        await openMediaSelection(selection, null);
      }
    } catch (error) {
      console.error("Failed to load media from hash", error);
    }
  }

  async function openMediaSelection(
    selection: MediaSelection,
    rect: DOMRect | null,
  ) {
    selectedMovie = selection.movie;
    selectedEpisodeId = selection.selectedEpisodeId;
    selectedSeasonNumber = selection.selectedSeasonNumber;
    cast = selection.cast;
    sourceRect = rect;
    view = "home";
    watchMovie = null;
    watchStreamUrl = null;
    watchSubtitles = [];
    watchSources = [];
    syncRoom = null;
    watchEpisodeId = undefined;
    watchSeasonNumber = undefined;
    watchShowId = undefined;
    await ensureMoviePopupComponent();
  }

  function handleMovieSelect(movie: Movie, rect: DOMRect) {
    selectedMovie = movie;
    selectedEpisodeId = null;
    selectedSeasonNumber = null;
    sourceRect = rect;
    cast = [];
    view = "home";
    void ensureMoviePopupComponent();

    fetchCastForMedia(movie)
      .then((credits) => {
        if (selectedMovie?.id === movie.id) {
          cast = credits;
        }
      })
      .catch((error) => {
        console.error("Failed to fetch cast", error);
        if (selectedMovie?.id === movie.id) {
          cast = [];
        }
      });

    skipNextHashChange = true;
    window.location.hash = toMediaHash(movie);
  }

  function handleSelectEpisode(episodeData: EpisodeHashRequest) {
    skipNextHashChange = true;
    window.location.hash = toEpisodeHash(episodeData);
  }

  function handleClosePopup() {
    selectedMovie = null;
    selectedEpisodeId = null;
    selectedSeasonNumber = null;
    sourceRect = null;
    cast = [];
    clearLocationHash();
  }

  function applyWatchPayload(payload: WatchPayload) {
    watchMovie = payload.movie;
    watchStreamUrl = payload.streamUrl;
    watchSubtitles = payload.subtitles;
    watchSources = payload.sources;
    watchEpisodeId = payload.episodeId;
    watchSeasonNumber = payload.seasonNumber;
    watchShowId = payload.tvShowId;
    view = "watch";
    playCounter++;
  }

  async function runPlaybackTransition(
    task: (onProgress: (message: string) => void) => Promise<WatchPayload>,
    fallbackErrorMessage: string,
  ) {
    isTransitioning = true;
    progressMessage = "Preparing player...";
    try {
      await ensureWatchComponent();
      const payload = await task((message) => {
        progressMessage = message;
      });
      applyWatchPayload(payload);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : fallbackErrorMessage);
    } finally {
      isTransitioning = false;
      progressMessage = "";
    }
  }

  // Updated handlers to pass currentSource
  async function handlePlay(movie: Movie) {
    if (movie.media_type === "tv") {
      alert("Select an episode from the show details to start watching.");
      return;
    }
    await runPlaybackTransition(
      (onProgress) => buildMovieWatchPayload(movie, onProgress, currentSource),
      "Could not load stream. Try another movie.",
    );
  }

  async function handlePlayEpisode(episodeData: EpisodePlayRequest) {
    await runPlaybackTransition(
      (onProgress) =>
        buildEpisodeWatchPayload(episodeData, onProgress, currentSource),
      "Could not load episode stream.",
    );
  }

  async function handleCustomStream() {
    await runPlaybackTransition(
      (onProgress) =>
        buildCustomWatchPayload(
          customStreamUrl,
          customStreamOrigin,
          onProgress,
        ),
      "Failed to load custom stream.",
    );
    if (watchStreamUrl) {
      showCustomStream = false;
    }
  }

  function handleBack() {
    view = "home";
    watchMovie = null;
    watchStreamUrl = null;
    watchSubtitles = [];
    watchSources = [];
    syncRoom = null;
    watchEpisodeId = undefined;
    watchSeasonNumber = undefined;
    watchShowId = undefined;
  }

  function handleJoinRoom(username: string, roomId: string) {
    syncRoom = { roomId, username };
    showJoinRoom = false;
  }
</script>

<svelte:head>
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
  />
  <title>Melana</title>
</svelte:head>

{#if view === "home"}
  <HomeView
    healthInfo={$health.healthInfo}
    cacheJustUpdated={$health.cacheJustUpdated}
    proxyStarting={$health.proxyStarting}
    activeMovieId={selectedMovie?.id}
    onselect={handleMovieSelect}
    onplay={handlePlay}
    onJoinRoom={() => (showJoinRoom = true)}
    onCustomStream={() => (showCustomStream = true)}
    {currentSource}
    onSourceChange={(v) => (currentSource = v)}
  />

  {#if selectedMovie && MoviePopupComponent}
    <svelte:component
      this={MoviePopupComponent}
      movie={selectedMovie}
      {cast}
      {sourceRect}
      {selectedEpisodeId}
      {selectedSeasonNumber}
      onclose={handleClosePopup}
      onplay={handlePlay}
      onplayEpisode={handlePlayEpisode}
      onSelectEpisode={handleSelectEpisode}
    />
  {/if}
{:else if watchMovie && watchStreamUrl && WatchComponent}
  <svelte:component
    this={WatchComponent}
    movie={watchMovie}
    streamUrl={watchStreamUrl}
    subtitles={watchSubtitles}
    sources={watchSources}
    healthInfo={$health.healthInfo}
    proxyStarting={$health.proxyStarting}
    {syncRoom}
    onback={handleBack}
    episodeId={watchEpisodeId}
    seasonNumber={watchSeasonNumber}
    showId={watchShowId}
    playId={playCounter}
    onplayEpisode={handlePlayEpisode}
    onselectEpisode={handleSelectEpisode}
    onplay={handlePlay}
  />
{/if}

{#if isTransitioning}
  <LoadingOverlay message={progressMessage} />
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
