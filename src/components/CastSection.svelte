<!-- components/CastSection.svelte -->
<script lang="ts">
  import type { CastMember } from "../lib/tmdb";

  export let cast: CastMember[];
  let showAll = false;

  $: truncatedCast = showAll ? cast : cast.slice(0, 5);
  $: remainingCount = cast.length - 5;
</script>

{#if cast.length > 0}
  <div class="cast-section fade-content">
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
      <button class="show-more-btn" on:click={() => (showAll = !showAll)}>
        {showAll ? "Show less" : `+${remainingCount} more`}
      </button>
    {/if}
  </div>
{/if}

<style>
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
</style>
