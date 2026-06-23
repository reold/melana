<script lang="ts">
  import SearchAutocomplete from "./SearchAutocomplete.svelte";

  export let query: string = "";
  export let onSearch: () => void = () => {};
  export let searchInput: HTMLInputElement | undefined = undefined;
</script>

<header class="topbar">
  <div class="logo">
    <div class="aurora">
      <div class="aurora__item"></div>
      <div class="aurora__item"></div>
      <div class="aurora__item"></div>
      <div class="aurora__item"></div>
    </div>

    <svg
      class="logo-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      fill="none"
    >
      <!-- Inner connecting lines -->
      <path
        d="M43.0577 431H457.942M43.0577 431C35.8815 431 28.9993 428.147 23.925 423.07C18.8507 417.992 16 411.106 16 403.925M43.0577 431H79.1346C94.0705 431 106.192 418.87 106.192 403.925M457.942 431C472.878 431 485 418.87 485 403.925M457.942 431H421.865C414.689 431 407.807 428.147 402.733 423.07C397.658 417.992 394.808 411.106 394.808 403.925M16 403.925V97.075M16 403.925V367.825C16 352.88 28.1218 340.75 43.0577 340.75M106.192 403.925V277.575M106.192 403.925C106.192 418.87 118.314 431 133.25 431H367.75C382.686 431 394.808 418.87 394.808 403.925M106.192 403.925V367.825C106.192 352.88 94.0705 340.75 79.1346 340.75M16 97.075C16 82.1296 28.1218 70 43.0577 70M16 97.075V133.175C16 148.12 28.1218 160.25 43.0577 160.25M43.0577 340.75C28.1218 340.75 16 328.62 16 313.675V277.575C16 262.63 28.1218 250.5 43.0577 250.5M43.0577 340.75H79.1346M485 403.925V97.075M485 403.925V367.825C485 352.88 472.878 340.75 457.942 340.75M485 97.075C485 82.1296 472.878 70 457.942 70M485 97.075V133.175C485 148.12 472.878 160.25 457.942 160.25M457.942 340.75C472.878 340.75 485 328.62 485 313.675V277.575C485 262.63 472.878 250.5 457.942 250.5M457.942 340.75H421.865M394.808 403.925V277.575M394.808 403.925V367.825C394.808 352.88 406.93 340.75 421.865 340.75M457.942 70H43.0577M457.942 70H421.865C406.93 70 394.808 82.1296 394.808 97.075M43.0577 70H79.1346C94.0705 70 106.192 82.1296 106.192 97.075M394.808 97.075C394.808 82.1296 382.686 70 367.75 70H133.25C118.314 70 106.192 82.1296 106.192 97.075M394.808 97.075V133.175C394.808 140.356 397.658 147.242 402.733 152.32C407.807 157.397 414.689 160.25 421.865 160.25M394.808 97.075V223.425M457.942 160.25H421.865M457.942 160.25C472.878 160.25 485 172.38 485 187.325V223.425C485 238.37 472.878 250.5 457.942 250.5M106.192 97.075V133.175C106.192 148.12 94.0705 160.25 79.1346 160.25M106.192 97.075V223.425M43.0577 160.25H79.1346M43.0577 160.25C28.1218 160.25 16 172.38 16 187.325V223.425C16 238.37 28.1218 250.5 43.0577 250.5M79.1346 160.25C94.0705 160.25 106.192 172.38 106.192 187.325V223.425M43.0577 250.5H79.1346M106.192 223.425C106.192 230.606 109.043 237.492 114.117 242.57C119.192 247.647 126.074 250.5 133.25 250.5M106.192 223.425C106.192 238.37 94.0705 250.5 79.1346 250.5M421.865 160.25C406.93 160.25 394.808 172.38 394.808 187.325V223.425M394.808 223.425C394.808 238.37 382.686 250.5 367.75 250.5M394.808 223.425C394.808 238.37 406.93 250.5 421.865 250.5M457.942 250.5H421.865M133.25 250.5H367.75M133.25 250.5C118.314 250.5 106.192 262.63 106.192 277.575M367.75 250.5C382.686 250.5 394.808 262.63 394.808 277.575M106.192 277.575V313.675C106.192 328.62 94.0705 340.75 79.1346 340.75M106.192 277.575C106.192 262.63 94.0705 250.5 79.1346 250.5M421.865 250.5C406.93 250.5 394.808 262.63 394.808 277.575M394.808 277.575V313.675C394.808 328.62 406.93 340.75 421.865 340.75"
        stroke="currentColor"
        stroke-width="20"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <!-- Lightning bolt -->
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M307.885 22.0823C311.098 23.8713 313.62 26.6851 315.048 30.075C316.476 33.4648 316.727 37.2353 315.763 40.7851L272.05 201.098H431.543C434.75 201.098 437.888 202.036 440.569 203.796C443.251 205.556 445.361 208.061 446.638 211.004C447.916 213.947 448.306 217.199 447.76 220.361C447.215 223.523 445.758 226.456 443.568 228.801L213.15 475.757C210.641 478.452 207.3 480.228 203.662 480.8C200.024 481.372 196.3 480.707 193.085 478.912C189.869 477.117 187.349 474.295 185.926 470.897C184.503 467.5 184.261 463.723 185.237 460.171L228.95 299.88H69.4574C66.2499 299.88 63.1124 298.942 60.4306 297.182C57.7487 295.423 55.6394 292.917 54.3619 289.974C53.0843 287.031 52.6943 283.779 53.2397 280.617C53.7851 277.455 55.2422 274.522 57.4318 272.177L287.85 25.2214C290.359 22.5355 293.696 20.7672 297.327 20.1983C300.958 19.6294 304.675 20.2926 307.885 22.0823Z"
        fill="currentColor"
      />
    </svg>

    <h1 class="logo-text">Melana</h1>
  </div>

  <div class="search-container">
    <SearchAutocomplete bind:query bind:searchInput onsearch={onSearch} />
  </div>
</header>

<style>
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
    gap: 10px;
  }

  .logo {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    background: transparent;
  }

  .logo-icon {
    width: 45px;
    height: 45px;
    color: #fff;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }

  .logo-text {
    font-size: 45px;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin: 0;
    color: #fff;
    position: relative;
    z-index: 1;
  }

  .aurora {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    mix-blend-mode: darken;
    pointer-events: none;
  }

  .aurora__item {
    position: absolute;
    top: 0;
    left: 0;
    width: 60vw;
    height: 60vw;
    border-radius: 40%;
    filter: blur(1rem);
    mix-blend-mode: overlay;
    will-change: transform;
  }

  .aurora__item:nth-of-type(1) {
    background-color: #00c2ff;
    animation: aurora-1 12s ease-in-out infinite alternate;
  }
  .aurora__item:nth-of-type(2) {
    background-color: #ffc640;
    animation: aurora-2 12s ease-in-out infinite alternate;
  }
  .aurora__item:nth-of-type(3) {
    background-color: #33ff8c;
    animation: aurora-3 8s ease-in-out infinite alternate;
  }
  .aurora__item:nth-of-type(4) {
    background-color: #e54cff;
    animation: aurora-4 24s ease-in-out infinite alternate;
  }

  @keyframes aurora-1 {
    0% {
      transform: translate(-20%, -20%) scale(1) rotate(0deg);
    }
    50% {
      transform: translate(30%, 40%) scale(1.2) rotate(90deg);
    }
    100% {
      transform: translate(-20%, -20%) scale(1) rotate(180deg);
    }
  }
  @keyframes aurora-2 {
    0% {
      transform: translate(20%, -20%) scale(1) rotate(0deg);
    }
    50% {
      transform: translate(-30%, 40%) scale(1.3) rotate(-90deg);
    }
    100% {
      transform: translate(20%, -20%) scale(1) rotate(-180deg);
    }
  }
  @keyframes aurora-3 {
    0% {
      transform: translate(-20%, 20%) scale(1) rotate(0deg);
    }
    50% {
      transform: translate(30%, -40%) scale(1.2) rotate(90deg);
    }
    100% {
      transform: translate(-20%, 20%) scale(1) rotate(180deg);
    }
  }
  @keyframes aurora-4 {
    0% {
      transform: translate(20%, 20%) scale(1) rotate(0deg);
    }
    50% {
      transform: translate(-30%, -40%) scale(1.1) rotate(-90deg);
    }
    100% {
      transform: translate(20%, 20%) scale(1) rotate(-180deg);
    }
  }

  .search-container {
    display: flex;
    gap: 8px;
    align-items: center;
    flex: 1;
    max-width: 420px;
  }

  .search-container :global(input) {
    font-size: 16px !important;
  }

  @media (max-width: 768px) {
    .topbar {
      flex-direction: column;
      margin-bottom: 24px;
    }
    .search-container {
      width: 100%;
    }
  }
</style>
