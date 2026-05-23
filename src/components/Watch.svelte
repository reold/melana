<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Dropdown from "./Dropdown.svelte";
  import CacheChart from "./CacheChart.svelte";
  import type { Movie } from "../lib/tmdb";
  import type { HealthInfo } from "../lib/proxy";

  export let movie: Movie;
  export let streamUrl: string;
  export let subtitles: { url: string; lang: string; language: string }[] = [];
  export let sources: { quality: string; url: string }[] = [];
  export let healthInfo: HealthInfo | null = null;
  export let proxyStarting: boolean = false;
  export let syncRoom: { roomId: string; username: string } | null = null;
  export let onback: () => void = () => {};

  // ---------- DOM / player ----------
  let video: HTMLVideoElement;

  let hls: any | null = null;
  let HlsClass: any | null = null;

  // ---------- Subtitle tracks ----------
  // Direct references to <track> elements we create in onMount.
  // These survive quality switches — hls.js never touches them because
  // we use renderTextTracksNatively: false.
  let subtitleTracks: HTMLTrackElement[] = [];

  // Original cue times keyed by track element (stable across quality switches).
  const originalCueTimes = new Map<
    HTMLTrackElement,
    { start: number; end: number }[]
  >();

  // Saved subtitle state before a quality switch, so we can restore it.
  let savedSubtitleLang = "";
  let savedSubtitleOffset = 0;
  let awaitingSubtitleRestore = false;

  // ---------- UI state ----------
  let selectedQuality = -1;
  let selectedSubtitle = -1;
  let showQualityMenu = false;
  let showSubtitleMenu = false;
  let showMore = false;
  let showCache = false;
  let subtitleOffset = 0;
  let ignoreTrackModeChange = false;

  // ---------- Sync state ----------
  let ws: WebSocket | null = null;
  let username = "";
  let offset = 0;
  let syncCount = 0;
  let offsetSum = 0;
  const OFFSET_SAMPLES = 5;
  let playbackTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let driftTimer: ReturnType<typeof setInterval> | null = null;
  let bufferGraceTimer: ReturnType<typeof setTimeout> | null = null;
  let positionReportTimer: ReturnType<typeof setInterval> | null = null;
  let masterPlaybackState: {
    action: "play" | "pause";
    position: number;
    serverTimestamp: number;
  } | null = null;
  let videoReady = false;
  let pendingAction: { action: string; position: number } | null = null;
  let buffering = false;
  let reportedBuffering = false;
  let manualPlaybackRate = 1.0;
  let waiters: string[] = [];

  $: waitlocked = waiters.length > 0;
  $: othersWaiting = waiters.filter((w) => w !== username);

  let suppressEvents = 0;

  const suppress = (fn: () => void) => {
    suppressEvents++;
    try {
      fn();
    } finally {
      setTimeout(() => suppressEvents--, 80);
    }
  };

  const suppressSeek = (fn: () => void) => {
    suppressEvents++;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      video.removeEventListener("seeked", release);
      suppressEvents--;
    };
    video.addEventListener("seeked", release, { once: true });
    setTimeout(release, 1500);
    try {
      fn();
    } catch {
      release();
    }
  };

  const BUFFER_GRACE_MS = 750;
  let syncStatusText = "Offset: -- ms | Syncing…";

  $: qualityLabel =
    selectedQuality === -1
      ? "Auto"
      : (sources[selectedQuality]?.quality ?? "Auto");

  $: subtitleLabel =
    selectedSubtitle === -1
      ? "Off"
      : (subtitles[selectedSubtitle]?.language ?? "Off");

  $: statusLine = (() => {
    if (waitlocked && othersWaiting.length > 0) {
      return `⏸ Waiting for ${othersWaiting.join(", ")}…`;
    }
    if (reportedBuffering) return `⏳ Buffering…`;
    return syncStatusText;
  })();

  // ===================================================================
  // CAPTIONS
  // ===================================================================

  /**
   * Store original cue timestamps for a track so offsets are always
   * applied relative to the unshifted baseline, never accumulated.
   */
  function captureCueTimes(track: HTMLTrackElement) {
    if (originalCueTimes.has(track)) return;
    const cues = Array.from(track.track.cues || []);
    if (!cues.length) return;
    originalCueTimes.set(
      track,
      cues.map((c) => ({ start: c.startTime, end: c.endTime })),
    );
  }

  function onTrackModeChange() {
    if (ignoreTrackModeChange) return;
    const tracks = Array.from(video.textTracks);
    const activeTrack = tracks.find((t) => t.mode === "showing");

    if (activeTrack) {
      // Find the exact matching object instead of relying on array index
      const idx = subtitleTracks.findIndex((t) => t.track === activeTrack);
      selectedSubtitle = idx; // Will gracefully set to -1 if an embedded HLS track is active
    } else {
      selectedSubtitle = -1;
    }
    showSubtitleMenu = false;
  }

  /**
   * Apply a time offset to all cues in a track.
   * Uses stored original times so offsets are always relative to baseline.
   */
  function applySubtitleOffset(delta: number, track: HTMLTrackElement) {
    if (!track) return;
    const videoTrack = track.track;
    const original = originalCueTimes.get(track);
    if (!original || !videoTrack.cues) return;
    for (let i = 0; i < videoTrack.cues.length; i++) {
      const cue = videoTrack.cues[i];
      const orig = original[i];
      if (orig) {
        cue.startTime = orig.start + delta;
        cue.endTime = orig.end + delta;
      }
    }
  }
  function setSubtitle(index: number) {
    ignoreTrackModeChange = true;
    selectedSubtitle = index;
    showSubtitleMenu = false;

    // 1. Force ALL tracks (ours and HLS-embedded ones) to disabled first
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = "disabled";
    }

    // 2. Enable only the selected external track
    if (index >= 0 && index < subtitleTracks.length) {
      const targetTrack = subtitleTracks[index];
      targetTrack.track.mode = "showing";

      captureCueTimes(targetTrack);
      applySubtitleOffset(subtitleOffset, targetTrack);
    }

    setTimeout(() => (ignoreTrackModeChange = false), 0);
  }

  const adjustSubtitleOffset = (d: number) => {
    subtitleOffset += d;
    if (selectedSubtitle >= 0 && selectedSubtitle < subtitleTracks.length) {
      applySubtitleOffset(subtitleOffset, subtitleTracks[selectedSubtitle]);
    }
  };

  const resetSubtitleOffset = () => {
    subtitleOffset = 0;
    if (selectedSubtitle >= 0 && selectedSubtitle < subtitleTracks.length) {
      applySubtitleOffset(0, subtitleTracks[selectedSubtitle]);
    }
  };

  const handleBack = () => onback();

  // ===================================================================
  // LOCAL VIDEO -> WS
  // ===================================================================

  function onPlay() {
    if (suppressEvents) return;
    if (waitlocked) {
      suppress(() => video.pause());
      return;
    }
    sendPlaybackAction("play");
  }

  function onPause() {
    if (!suppressEvents) sendPlaybackAction("pause");
  }

  function onSeeked() {
    if (!suppressEvents && !buffering) {
      sendPlaybackAction("seek", video.currentTime);
    }
  }

  function sendPlaybackAction(action: string, position?: number) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const pos = typeof position === "number" ? position : video.currentTime;
    ws.send(JSON.stringify({ type: "playback", action, position: pos }));
  }

  // ===================================================================
  // BUFFERING REPORTING
  // ===================================================================

  function onWaiting() {
    buffering = true;
    if (bufferGraceTimer) clearTimeout(bufferGraceTimer);
    bufferGraceTimer = setTimeout(() => {
      bufferGraceTimer = null;
      if (
        buffering &&
        !reportedBuffering &&
        ws?.readyState === WebSocket.OPEN
      ) {
        reportedBuffering = true;
        ws.send(
          JSON.stringify({
            type: "buffer_start",
            position: video.currentTime,
          }),
        );
      }
    }, BUFFER_GRACE_MS);
  }

  function onPlaying() {
    buffering = false;
    if (bufferGraceTimer) {
      clearTimeout(bufferGraceTimer);
      bufferGraceTimer = null;
    }
    if (reportedBuffering && ws?.readyState === WebSocket.OPEN) {
      reportedBuffering = false;
      ws.send(
        JSON.stringify({
          type: "buffer_end",
          position: video.currentTime,
        }),
      );
    }
  }

  function onCanPlay() {
    videoReady = true;
    if (pendingAction) {
      let lateMs = 0;
      if (masterPlaybackState) {
        const serverNow = performance.now() + offset;
        lateMs = Math.max(0, serverNow - masterPlaybackState.serverTimestamp);
      }
      applyImmediately(pendingAction.action, pendingAction.position, lateMs);
      pendingAction = null;
    }
    if (reportedBuffering && ws?.readyState === WebSocket.OPEN) {
      reportedBuffering = false;
      ws.send(
        JSON.stringify({
          type: "buffer_end",
          position: video.currentTime,
        }),
      );
    }
  }

  // ===================================================================
  // SYNC ENGINE
  // ===================================================================

  function connectSync(roomId: string, name: string) {
    disconnectSync();
    username = name;
    offset = 0;
    syncCount = 0;
    offsetSum = 0;
    waiters = [];
    reportedBuffering = false;
    syncStatusText = "Connecting…";

    const socket = new WebSocket(`wss://rtc.reold.workers.dev/room/${roomId}`);
    ws = socket;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({ type: "join", name, clientId: crypto.randomUUID() }),
      );

      for (let i = 0; i < OFFSET_SAMPLES; i++) {
        setTimeout(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                type: "sync_request",
                clientTs: performance.now(),
              }),
            );
          }
        }, i * 200);
      }

      if (streamUrl) {
        socket.send(JSON.stringify({ type: "stream", url: streamUrl }));
      }

      startDriftCorrection();
      startPositionReporter();
    };

    socket.onmessage = (e) => {
      let data: any;
      try {
        data = JSON.parse(e.data);
      } catch {
        return;
      }
      if (!data?.type) return;

      switch (data.type) {
        case "sync_reply": {
          if (
            typeof data.serverTs !== "number" ||
            typeof data.clientTs !== "number"
          ) {
            break;
          }
          const localPerfNow = performance.now();
          const roundTrip = localPerfNow - data.clientTs;
          const estimatedServerNow = data.serverTs + roundTrip / 2;
          const sample = estimatedServerNow - localPerfNow;
          offsetSum += sample;
          syncCount++;
          offset = offsetSum / syncCount;
          syncStatusText = `Offset: ${offset.toFixed(1)} ms | Synced ${syncCount} samples`;
          break;
        }

        case "playback": {
          if (
            typeof data.action !== "string" ||
            typeof data.position !== "number" ||
            typeof data.timestamp !== "number"
          ) {
            break;
          }
          scheduleAction(data.action, data.position, data.timestamp);
          break;
        }

        case "waitlock": {
          waiters = Array.isArray(data.waiters) ? data.waiters : [];
          if (waitlocked) {
            if (playbackTimer) {
              clearTimeout(playbackTimer);
              playbackTimer = null;
            }
            if (videoReady && !video.paused) {
              suppress(() => video.pause());
            }
          }
          break;
        }

        case "stream": {
          if (
            typeof data.url === "string" &&
            data.url &&
            data.url !== streamUrl
          ) {
            streamUrl = data.url;
            loadStream(data.url);
          }
          break;
        }
      }
    };

    socket.onerror = () => {
      syncStatusText = "Connection error";
    };

    socket.onclose = () => {
      if (ws === socket) ws = null;
      syncStatusText = "Disconnected";
      clearTimers();
      waiters = [];
    };

    heartbeatTimer = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);
  }

  function disconnectSync() {
    clearTimers();
    if (ws) {
      try {
        ws.close();
      } catch {}
      ws = null;
    }
    masterPlaybackState = null;
    manualPlaybackRate = 1.0;
    if (video) video.playbackRate = 1.0;
    waiters = [];
    reportedBuffering = false;
  }

  function clearTimers() {
    if (playbackTimer) {
      clearTimeout(playbackTimer);
      playbackTimer = null;
    }
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (driftTimer) {
      clearInterval(driftTimer);
      driftTimer = null;
    }
    if (bufferGraceTimer) {
      clearTimeout(bufferGraceTimer);
      bufferGraceTimer = null;
    }
    if (positionReportTimer) {
      clearInterval(positionReportTimer);
      positionReportTimer = null;
    }
  }

  function shareStream() {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "stream", url: streamUrl }));
    }
  }

  /**
   * Find the external <track> element whose srclang matches the saved language
   * and activate it, restoring the subtitle offset too.
   */
  function restoreSubtitleByLang(lang: string, offsetDelta: number) {
    const idx = subtitles.findIndex((s) => s.lang === lang);
    if (idx !== -1) {
      subtitleOffset = offsetDelta;
      setSubtitle(idx);
    }
  }
  async function loadStream(url: string) {
    if (hls) {
      hls.destroy();
      hls = null;
    }

    videoReady = false;

    // 1. Destroy old tracks to prevent browser zombie state
    subtitleTracks.forEach((t) => {
      if (t && t.parentNode) t.parentNode.removeChild(t);
    });
    subtitleTracks = [];
    originalCueTimes.clear();

    // 2. Rebuild fresh tracks for the new video source
    subtitles.forEach((sub, i) => {
      const t = document.createElement("track");
      t.kind = "subtitles";
      t.label = sub.language;
      t.srclang = sub.lang;
      t.src = sub.url;
      t.id = `sub-${i}`;
      video.appendChild(t);
      subtitleTracks[i] = t;

      t.addEventListener("load", () => {
        captureCueTimes(t);
        t.track.addEventListener("modechange", onTrackModeChange);
        // Apply offset seamlessly once the new VTT loads
        if (selectedSubtitle === i && subtitleOffset !== 0) {
          applySubtitleOffset(subtitleOffset, t);
        }
      });
    });

    if (!HlsClass) {
      const mod = await import("hls.js");
      HlsClass = mod.default;
    }

    if (HlsClass.isSupported()) {
      hls = new HlsClass({
        capLevelToPlayerSize: false,
        autoStartLoad: true,
        renderTextTracksNatively: false,
      });

      hls.on(HlsClass.Events.MANIFEST_PARSED, () => {});
      hls.loadSource(url);
      hls.attachMedia(video);
    } else {
      video.src = url;
    }
  }
  function setQuality(index: number) {
    selectedQuality = index;
    showQualityMenu = false;
    if (index === -1) {
      if (hls) hls.currentLevel = -1;
      return;
    }

    const url = sources[index]?.url;
    if (!url || url === streamUrl) return;

    const resumeAt = video.currentTime;
    const wasPlaying = !video.paused;

    if (selectedSubtitle >= 0 && selectedSubtitle < subtitles.length) {
      savedSubtitleLang = subtitles[selectedSubtitle].lang;
      savedSubtitleOffset = subtitleOffset;
      awaitingSubtitleRestore = true;
    } else {
      savedSubtitleLang = "";
      awaitingSubtitleRestore = false;
    }

    streamUrl = url;
    loadStream(url).then(() => {
      const resume = () => {
        video.currentTime = resumeAt;
        if (wasPlaying) video.play().catch(() => {});
        video.removeEventListener("loadedmetadata", resume);

        // RESTORE HERE: The browser is done resetting the video element
        if (awaitingSubtitleRestore && savedSubtitleLang) {
          awaitingSubtitleRestore = false;
          restoreSubtitleByLang(savedSubtitleLang, savedSubtitleOffset);
        }
      };
      video.addEventListener("loadedmetadata", resume, { once: true });
    });
  }

  function scheduleAction(
    action: string,
    position: number,
    serverTimestamp: number,
  ) {
    if (action === "play" || action === "pause") {
      masterPlaybackState = {
        action,
        position,
        serverTimestamp,
      };
    } else if (action === "seek" && masterPlaybackState) {
      masterPlaybackState = {
        ...masterPlaybackState,
        position,
        serverTimestamp,
      };
    }

    const targetLocal = serverTimestamp - offset;
    const delay = targetLocal - performance.now();

    if (playbackTimer) {
      clearTimeout(playbackTimer);
      playbackTimer = null;
    }

    if (delay <= 0) {
      applyImmediately(action, position, Math.abs(delay));
    } else {
      playbackTimer = setTimeout(
        () => applyImmediately(action, position, 0),
        delay,
      );
      syncStatusText = `Offset: ${offset.toFixed(1)} ms | Scheduled ${action} in ${(delay / 1000).toFixed(2)}s`;
    }
  }

  function applyImmediately(action: string, position: number, lateByMs = 0) {
    if (!videoReady) {
      pendingAction = { action, position };
      return;
    }

    if (action === "play") {
      suppressSeek(() => {
        video.currentTime = position + lateByMs / 1000;
      });
      suppress(() => {
        video.play().catch(() => {});
        video.playbackRate = manualPlaybackRate;
      });
    } else if (action === "pause") {
      suppress(() => {
        video.pause();
        video.playbackRate = manualPlaybackRate;
      });
    } else if (action === "seek") {
      suppressSeek(() => {
        video.currentTime = position + lateByMs / 1000;
      });
    }
  }

  function startDriftCorrection() {
    if (driftTimer) clearInterval(driftTimer);
    driftTimer = setInterval(() => {
      if (
        !videoReady ||
        !masterPlaybackState ||
        !video ||
        buffering ||
        waitlocked ||
        syncCount === 0
      ) {
        if (video) video.playbackRate = manualPlaybackRate;
        return;
      }

      if (video.paused) {
        if (masterPlaybackState.action === "play") {
          suppressSeek(() => {
            video.currentTime = masterPlaybackState!.position;
          });
          suppress(() => {
            video.play().catch(() => {});
          });
        }
        video.playbackRate = manualPlaybackRate;
        return;
      }

      if (masterPlaybackState.action !== "play") return;

      const serverNow = performance.now() + offset;
      const expected =
        masterPlaybackState.position +
        (serverNow - masterPlaybackState.serverTimestamp) / 1000;
      const drift = expected - video.currentTime;

      if (Math.abs(drift) > 1.0) {
        suppressSeek(() => {
          video.currentTime = expected;
        });
        video.playbackRate = manualPlaybackRate;
        syncStatusText = `Drift large (${(drift * 1000).toFixed(0)}ms)! Hard-syncing…`;
      } else if (drift > 0.03) {
        video.playbackRate = manualPlaybackRate * 1.02;
        syncStatusText = `Lagging by ${(drift * 1000).toFixed(0)}ms | Speeding up…`;
      } else if (drift < -0.03) {
        video.playbackRate = manualPlaybackRate * 0.98;
        syncStatusText = `Leading by ${Math.abs(drift * 1000).toFixed(0)}ms | Slowing down…`;
      } else {
        video.playbackRate = manualPlaybackRate;
        syncStatusText = `Offset: ${offset.toFixed(1)} ms | In sync (<30ms)`;
      }
    }, 2000);
  }

  function startPositionReporter() {
    if (positionReportTimer) clearInterval(positionReportTimer);
    positionReportTimer = setInterval(() => {
      if (!waitlocked) return;
      if (!videoReady || !ws || ws.readyState !== WebSocket.OPEN) return;
      ws.send(
        JSON.stringify({
          type: "position_report",
          position: video.currentTime,
        }),
      );
    }, 2000);
  }

  // ===================================================================
  // LIFECYCLE
  // ===================================================================
  onMount(() => {
    // Track creation is now safely handled inside loadStream()
    loadStream(streamUrl);

    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("stalled", onWaiting);
    video.addEventListener("ratechange", () => {
      if (suppressEvents) return;
      const r = video.playbackRate;
      if (r < 0.97 || r > 1.03) manualPlaybackRate = r;
    });

    if (syncRoom) connectSync(syncRoom.roomId, syncRoom.username);
  });

  onDestroy(() => {
    hls?.destroy();
    disconnectSync();
  });
</script>

<div class="watch-container">
  <div class="top-bar">
    <button class="back-btn" on:click={handleBack}>← Back</button>
    <h1 class="movie-title">{movie.title}</h1>
    <button class="more-btn" on:click={() => (showMore = !showMore)}>
      <svg viewBox="0 0 24 24" fill="currentColor" class="more-icon">
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="19" r="2" />
      </svg>
    </button>
  </div>

  <div class="primary-controls">
    <Dropdown bind:showMenu={showQualityMenu} label={qualityLabel}>
      <button
        class:active={selectedQuality === -1}
        on:click={() => setQuality(-1)}
      >
        Auto
      </button>
      {#each sources as src, i}
        <button
          class:active={selectedQuality === i}
          on:click={() => setQuality(i)}
        >
          {src.quality}
        </button>
      {/each}
    </Dropdown>

    <Dropdown bind:showMenu={showSubtitleMenu} label={subtitleLabel}>
      <button
        class:active={selectedSubtitle === -1}
        on:click={() => setSubtitle(-1)}
      >
        Off
      </button>
      {#each subtitles as sub, i}
        <button
          class:active={selectedSubtitle === i}
          on:click={() => setSubtitle(i)}
        >
          {sub.language}
        </button>
      {/each}
    </Dropdown>

    {#if selectedSubtitle !== -1}
      <div class="timing-controls">
        <button on:click={() => adjustSubtitleOffset(-0.1)}>−0.1</button>
        <button on:click={() => adjustSubtitleOffset(-1)}>−1</button>
        <span class="offset-display">{subtitleOffset.toFixed(1)}s</span>
        <button on:click={() => adjustSubtitleOffset(0.1)}>+0.1</button>
        <button on:click={() => adjustSubtitleOffset(1)}>+1</button>
        <button on:click={resetSubtitleOffset} class="reset-btn">Reset</button>
      </div>
    {/if}
  </div>

  <div class="sync-bar">
    {#if ws}
      <span
        class="sync-status"
        class:waiting={waitlocked && othersWaiting.length > 0}
      >
        {waitlocked && othersWaiting.length > 0 ? "🟡" : "🟢"}
        {statusLine}
      </span>
      <button class="sync-btn" on:click={shareStream}>Share Stream</button>
      <button class="sync-btn" on:click={disconnectSync}>Leave</button>
    {:else}
      <button
        class="sync-btn"
        on:click={() => {
          const room = prompt("Room ID:")?.trim();
          const name = prompt("Your name:")?.trim();
          if (room && name) connectSync(room, name);
        }}
      >
        Join Sync
      </button>
    {/if}
  </div>

  {#if showMore}
    <div class="more-menu">
      {#if healthInfo}
        <button class="control-btn" on:click={() => (showCache = !showCache)}>
          {showCache ? "Hide Cache" : "Cache"}
        </button>
      {:else if proxyStarting}
        <button
          class="control-btn cache-loading-btn"
          disabled
          title="Proxy server is starting. Render cold starts can take a few minutes."
        >
          <span class="spinner" aria-hidden="true"></span>
          Cache Starting…
        </button>
      {/if}
    </div>
  {/if}

  {#if showCache && healthInfo}
    <div class="cache-section">
      <CacheChart {healthInfo} />
    </div>
  {/if}

  <video
    bind:this={video}
    controls
    autoplay
    class="player"
    crossorigin="anonymous"
    poster={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
    on:play={onPlay}
    on:pause={onPause}
    on:seeked={onSeeked}
  ></video>
</div>

<style>
  .watch-container {
    max-width: 960px;
    margin: 0 auto;
    padding: 24px;
  }
  .top-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
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
    transition: background 0.2s;
  }
  .back-btn:hover {
    background: #0070e9;
  }
  .movie-title {
    font-size: 22px;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.3px;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .more-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: var(--color-text-primary);
    border-radius: 8px;
    padding: 6px 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: background 0.2s;
  }
  .more-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  .more-icon {
    width: 18px;
    height: 18px;
  }
  .primary-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .timing-controls {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .timing-controls button {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: var(--color-text-secondary);
    border-radius: 6px;
    padding: 3px 8px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }
  .timing-controls button:hover {
    background: rgba(255, 255, 255, 0.18);
    color: #fff;
  }
  .offset-display {
    font-size: 12px;
    color: var(--color-accent-blue);
    font-weight: 600;
    min-width: 40px;
    text-align: center;
  }
  .reset-btn {
    color: var(--color-accent-pink) !important;
  }
  .sync-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .sync-status {
    font-size: 13px;
    color: #0f0;
  }
  .sync-status.waiting {
    color: #fc0;
  }
  .sync-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: var(--color-text-primary);
    border-radius: 8px;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }
  .sync-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  .more-menu {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  .control-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: var(--color-text-primary);
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background 0.2s;
  }
  .control-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }
  .control-btn:disabled {
    cursor: not-allowed;
    opacity: 0.65;
    color: var(--color-text-secondary);
  }
  .cache-loading-btn {
    pointer-events: none;
  }
  .spinner {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.25);
    border-top-color: var(--color-accent-blue);
    animation: spin 0.8s linear infinite;
  }
  .cache-section {
    margin-bottom: 12px;
  }
  .player {
    width: 100%;
    border-radius: 16px;
    background: #000;
    box-shadow: var(--shadow-elevated);
  }
  :global(.dropdown-menu button) {
    background: none;
    border: none;
    color: var(--color-text-primary);
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    text-align: left;
    width: 100%;
  }
  :global(.dropdown-menu button:hover) {
    background: rgba(255, 255, 255, 0.1);
  }
  :global(.dropdown-menu button.active) {
    color: var(--color-accent-blue);
    font-weight: 600;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (max-width: 768px) {
    .watch-container {
      padding: 16px;
    }
    .movie-title {
      font-size: 18px;
    }
    .primary-controls {
      gap: 6px;
    }
  }
</style>
