<script lang="ts">
  import { onMount } from "svelte";
  import Hls from "hls.js";
  import type { Movie } from "../lib/tmdb";

  export let movie: Movie;
  export let streamUrl: string;
  export let onback: () => void = () => {};

  let video: HTMLVideoElement;
  let hls: Hls | null = null;

  onMount(() => {
    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
    }

    return () => {
      hls?.destroy();
    };
  });

  function handleBack() {
    onback();
  }
</script>

<div class="watch-container">
  <button class="back-btn" on:click={handleBack}> ← Back </button>
  <h1>{movie.title}</h1>
  <video
    bind:this={video}
    controls
    autoplay
    class="player"
    poster={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
  ></video>
</div>

<style>
  .watch-container {
    max-width: 960px;
    margin: 0 auto;
    padding: 24px;
  }

  .back-btn {
    background: var(--color-accent-blue);
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 8px 18px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 20px;
    transition: background 0.2s;
  }

  .back-btn:hover {
    background: #0070e9;
  }

  h1 {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 16px 0;
    letter-spacing: -0.3px;
  }

  .player {
    width: 100%;
    border-radius: 16px;
    background: #000;
    box-shadow: var(--shadow-elevated);
  }

  @media (max-width: 768px) {
    .watch-container {
      padding: 16px;
    }
    h1 {
      font-size: 22px;
    }
  }
</style>
