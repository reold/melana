<script lang="ts">
  import { onMount } from "svelte";
  import Header from "./components/Header.svelte";
  import MovieGrid from "./components/MovieGrid.svelte";
  import MoviePopup from "./components/MoviePopup.svelte";
  import Watch from "./components/Watch.svelte";
  import {
    fetchPopularMovies,
    searchMovies,
    fetchMovieCredits,
    fetchMovieDetails,
  } from "./lib/tmdb";
  import type { Movie, CastMember } from "./lib/tmdb";
  import { debounce } from "./lib/utils";
  import { fetchMovieStreamUrl } from "./lib/videasy";
  import { createProxyUrl } from "./lib/proxy";
  import "./styles/global.css";

  let query = "";
  let movies: Movie[] = [];
  let loading = false;
  let searchInput: HTMLInputElement | undefined;

  // Popup state
  let selectedMovie: Movie | null = null;
  let activeMovieId: number | null = null;
  let cast: CastMember[] = [];

  // Watch state
  let view: "home" | "watch" = "home";
  let watchMovie: Movie | null = null;
  let watchStreamUrl: string | null = null;

  // Debounced search (unchanged)
  const debouncedSearch = debounce(async () => {
    loading = true;
    try {
      movies = query ? await searchMovies(query) : await fetchPopularMovies();
    } catch (e) {
      console.error("Search failed", e);
      movies = [];
    }
    loading = false;
  }, 300);

  $: query, debouncedSearch();

  onMount(async () => {
    loading = true;
    try {
      movies = await fetchPopularMovies();
    } catch (e) {
      console.error("Failed to fetch popular movies", e);
    }
    loading = false;
    searchInput?.focus();
  });

  // New handler signatures – they receive the raw Movie object, not an event
  function handleMovieSelect(movie: Movie) {
    activeMovieId = movie.id;
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        selectedMovie = movie;
        fetchMovieCredits(movie.id)
          .then((c) => (cast = c))
          .catch(() => (cast = []));
      });
    } else {
      selectedMovie = movie;
      fetchMovieCredits(movie.id)
        .then((c) => (cast = c))
        .catch(() => (cast = []));
    }
  }

  function handleClosePopup() {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        selectedMovie = null;
        activeMovieId = null;
        cast = [];
      });
    } else {
      selectedMovie = null;
      activeMovieId = null;
      cast = [];
    }
  }

  async function handlePlay(movie: Movie) {
    try {
      const details = await fetchMovieDetails(movie.id);
      if (!details.imdb_id) throw new Error("Missing imdb_id");
      const rawUrl = await fetchMovieStreamUrl({
        title: details.title,
        year: details.release_date?.slice(0, 4) ?? "",
        tmdbId: details.id,
        imdbId: details.imdb_id,
      });
      watchStreamUrl = createProxyUrl(rawUrl);
      watchMovie = details;
      view = "watch";
    } catch (e) {
      console.error(e);
      alert("Could not load stream. Try another movie.");
    }
  }

  function handleBack() {
    view = "home";
    watchMovie = null;
    watchStreamUrl = null;
  }
</script>

<svelte:head>
  <title>Melana - Movie Browser</title>
</svelte:head>

{#if view === "home"}
  <main class="wrap">
    <Header bind:query bind:searchInput on:search={() => debouncedSearch()} />
    <MovieGrid
      {movies}
      isLoading={loading}
      {activeMovieId}
      onselect={handleMovieSelect}
      onplay={handlePlay}
    />
  </main>

  {#if selectedMovie}
    <MoviePopup movie={selectedMovie} {cast} onclose={handleClosePopup} />
  {/if}
{:else if watchMovie && watchStreamUrl}
  <Watch movie={watchMovie} streamUrl={watchStreamUrl} onback={handleBack} />
{/if}

<style>
  .wrap {
    max-width: 1200px;
    margin: 0 auto;
    padding: 32px 20px;
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
