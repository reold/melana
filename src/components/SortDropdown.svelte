<script lang="ts">
  import Dropdown from "./Dropdown.svelte";
  import type { SortOption } from "../lib/tmdb";

  export let options: { label: string; value: SortOption }[] = [];
  export let selected: SortOption;
  export let onchange: (value: SortOption) => void = () => {};

  let showMenu = false;

  $: currentLabel = options.find((o) => o.value === selected)?.label ?? "Sort";

  function select(value: SortOption) {
    showMenu = false;
    onchange(value);
  }
</script>

<Dropdown bind:showMenu label={currentLabel}>
  {#each options as opt}
    <button
      class:active={selected === opt.value}
      on:click={() => select(opt.value)}
    >
      {opt.label}
    </button>
  {/each}
</Dropdown>
