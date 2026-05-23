<script lang="ts">
  import Dropdown from "./Dropdown.svelte";

  export let sortBy: "rating" | "name" | "date" = "rating";
  export let onchange: (value: "rating" | "name" | "date") => void = () => {};

  let showMenu = false;
  $: label =
    sortBy === "rating" ? "Rating" : sortBy === "date" ? "Date" : "Name";

  function select(value: "rating" | "name" | "date") {
    showMenu = false;
    onchange(value);
  }
</script>

<Dropdown bind:showMenu label={`Sort: ${label}`}>
  <button class:active={sortBy === "rating"} on:click={() => select("rating")}
    >Rating</button
  >
  <button class:active={sortBy === "date"} on:click={() => select("date")}
    >Date</button
  >
  <button class:active={sortBy === "name"} on:click={() => select("name")}
    >Name</button
  >
</Dropdown>
