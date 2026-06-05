<script lang="ts">
  import Dropdown from "./Dropdown.svelte";

  export let selected: string = "videasy";
  export let onchange: (value: string) => void = () => {};

  const sources = [
    { label: "Videasy", value: "videasy" },
    { label: "Vidlink", value: "vidlink" },
  ];

  let showMenu = false;

  $: currentLabel =
    sources.find((s) => s.value === selected)?.label ?? "Source";

  function select(value: string) {
    showMenu = false;
    onchange(value);
  }
</script>

<Dropdown bind:showMenu label={currentLabel}>
  {#each sources as src}
    <button
      class:active={selected === src.value}
      on:click={() => select(src.value)}
    >
      {src.label}
    </button>
  {/each}
</Dropdown>
