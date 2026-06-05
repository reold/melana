<script lang="ts">
  import Dropdown from "./Dropdown.svelte";
  import type { MediaType } from "../lib/tmdb";

  export let mediaType: MediaType = "movie";
  export let showMenu = false;

  function selectMediaType(nextType: MediaType) {
    mediaType = nextType;
    showMenu = false;
  }
</script>

<Dropdown bind:showMenu label={mediaType === "movie" ? "Movies" : "TV Shows"}>
  <button
    class:active={mediaType === "movie"}
    on:click={() => selectMediaType("movie")}
  >
    Movies
  </button>
  <button
    class:active={mediaType === "tv"}
    on:click={() => selectMediaType("tv")}
  >
    TV Shows
  </button>
</Dropdown>
