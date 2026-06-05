<!-- components/EpisodeCard.svelte -->
<script lang="ts">
  import type { Episode } from "../lib/tmdb";

  export let ep: Episode;
  export let isSelected: boolean;
  export let onplay: () => void;
  export let onselect: () => void;

  let expanded = false;
  let showAllGuests = false;

  function toggleDetails() {
    expanded = !expanded;
    onselect(); // calls the parent's selection handler, which updates the hash
  }
</script>

<div
  class="episode-card"
  class:expanded
  class:selected={isSelected}
  on:click={toggleDetails}
>
  <div class="episode-poster">
    {#if ep.still_path}
      <img
        src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
        alt={ep.name}
      />
    {:else}
      <div class="fallback-poster">EP{ep.episode_number}</div>
    {/if}
    {#if isSelected}
      <div class="selected-badge">Selected</div>
    {/if}
  </div>

  <div class="episode-info">
    <p class="ep-number">{ep.episode_number}. {ep.name}</p>
    <div class="ep-meta-row">
      <span class="ep-rating">⭐ {ep.vote_average?.toFixed(1) ?? "N/A"}</span>
      {#if ep.runtime}<span class="ep-runtime">{ep.runtime} min</span>{/if}
    </div>
  </div>

  <button class="btn-play-ep" on:click|stopPropagation={onplay}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      class="play-svg-ep"
    >
      <path
        fill-rule="evenodd"
        d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
        clip-rule="evenodd"
      />
    </svg>
  </button>

  {#if expanded}
    <div class="ep-card-details">
      {#if ep.overview}<p class="ep-overview">{ep.overview}</p>{/if}
      {#if ep.air_date}<p class="ep-air-date">Air date: {ep.air_date}</p>{/if}
      {#if ep.vote_count}<p class="ep-votes">{ep.vote_count} votes</p>{/if}

      {#if ep.guest_stars.length > 0}
        <div class="guest-stars">
          <strong>Guest Stars:</strong>
          <div class="guest-list">
            {#each showAllGuests ? ep.guest_stars : ep.guest_stars.slice(0, 5) as gs}
              <div class="guest-chip">
                {#if gs.profile_path}
                  <img
                    src={`https://image.tmdb.org/t/p/w92${gs.profile_path}`}
                    alt={gs.name}
                  />
                {:else}
                  <div class="placeholder-avatar-small">?</div>
                {/if}
                <span>{gs.name} as {gs.character}</span>
              </div>
            {/each}
          </div>
          {#if ep.guest_stars.length > 5}
            <button
              class="show-more-btn"
              on:click|stopPropagation={() => (showAllGuests = !showAllGuests)}
            >
              {showAllGuests
                ? "Show less"
                : `+${ep.guest_stars.length - 5} more`}
            </button>
          {/if}
        </div>
      {/if}

      {#if ep.crew.length > 0}
        <div class="crew">
          <strong>Key Crew:</strong>
          <ul>
            {#each ep.crew as c}<li>{c.job} – {c.name}</li>{/each}
          </ul>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .episode-card {
    flex-shrink: 0;
    width: 180px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition:
      transform 0.2s,
      box-shadow 0.2s,
      border-color 0.2s;
    position: relative;
    border: 2px solid transparent;
  }
  .episode-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
  }
  .episode-card.selected {
    border-color: var(--color-accent-blue);
    box-shadow: 0 0 12px rgba(0, 122, 255, 0.4);
  }
  .episode-poster {
    width: 100%;
    height: 110px;
    overflow: hidden;
    background: #2c2c2e;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .episode-poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .selected-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    background: var(--color-accent-blue);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
  }
  .episode-info {
    padding: 10px;
  }
  .ep-number {
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ep-meta-row {
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: 11px;
    color: var(--color-text-secondary);
  }
  .ep-rating {
    color: var(--color-accent-orange);
    font-weight: 500;
  }
  .btn-play-ep {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.7);
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 2;
  }
  .play-svg-ep {
    width: 16px;
    height: 16px;
    color: #fff;
  }
  .ep-card-details {
    padding: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 11px;
    color: var(--color-text-secondary);
  }
  .ep-overview {
    margin: 0 0 8px;
    line-height: 1.4;
    word-break: break-word;
  }
  .guest-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 4px;
  }
  .guest-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 2px 8px 2px 4px;
    font-size: 10px;
    max-width: 100%;
  }
  .guest-chip img {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    object-fit: cover;
  }
  .placeholder-avatar-small {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: var(--color-text-secondary);
  }
  .crew ul {
    margin: 4px 0 0 16px;
    padding: 0;
  }
  .crew li {
    margin: 2px 0;
  }
  .show-more-btn {
    margin-top: 4px;
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--color-accent-blue);
    border-radius: 8px;
    padding: 2px 8px;
    font-size: 10px;
    cursor: pointer;
  }

  @media (max-width: 768px) {
    .episode-card {
      width: 150px;
    }
  }
</style>
