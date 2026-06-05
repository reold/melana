import { writable } from "svelte/store";

export type SubtitleTrack = {
  url: string;
  lang: string;
  language: string;
};

export type StreamSource = {
  quality: string;
  url: string;
};

const SYNC_BUFFER_OPTIONS = {
  maxBufferLength: 60, // seconds
  maxMaxBufferLength: 90, // seconds
  maxBufferSize: 90 * 1e6, // bytes (90 MB)
};

export function createPlayerControls(
  video: HTMLVideoElement,
  initialSubtitles: SubtitleTrack[],
  initialSources: StreamSource[],
) {
  // HLS instance
  let hls: any = null;
  let HlsClass: any = null;

  // Subtitle state
  let subtitleTracks: HTMLTrackElement[] = [];
  const originalCueTimes = new Map<
    HTMLTrackElement,
    { start: number; end: number }[]
  >();
  let ignoreTrackModeChange = false;
  let savedSubtitleLang = "";
  let savedSubtitleOffset = 0;
  let awaitingSubtitleRestore = false;

  // Stores
  const selectedQuality = writable(-1);
  const selectedSubtitle = writable(-1);
  const subtitleOffset = writable(0);
  const availableSubtitles = writable<SubtitleTrack[]>(initialSubtitles);
  const availableSources = writable<StreamSource[]>(initialSources);
  const currentStreamUrl = writable("");

  // Subtitle internals
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
      const idx = subtitleTracks.findIndex((t) => t.track === activeTrack);
      selectedSubtitle.set(idx);
    } else {
      selectedSubtitle.set(-1);
    }
  }

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

  // Public methods

  function setSubtitle(index: number) {
    ignoreTrackModeChange = true;
    selectedSubtitle.set(index);
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = "disabled";
    }
    if (index >= 0 && index < subtitleTracks.length) {
      const targetTrack = subtitleTracks[index];
      targetTrack.track.mode = "showing";
      captureCueTimes(targetTrack);
      const currentOffset: number = 0;
      applySubtitleOffset(currentOffset, targetTrack);
    }
    setTimeout(() => (ignoreTrackModeChange = false), 0);
  }

  function adjustSubtitleOffset(delta: number) {
    subtitleOffset.update((v) => v + delta);
    let currentIdx: number;
    selectedSubtitle.subscribe((idx) => (currentIdx = idx))();
    if (currentIdx! >= 0 && currentIdx! < subtitleTracks.length) {
      let newOffset: number;
      subtitleOffset.subscribe((o) => (newOffset = o))();
      applySubtitleOffset(newOffset!, subtitleTracks[currentIdx!]);
    }
  }

  function resetSubtitleOffset() {
    subtitleOffset.set(0);
    let currentIdx: number;
    selectedSubtitle.subscribe((idx) => (currentIdx = idx))();
    if (currentIdx! >= 0 && currentIdx! < subtitleTracks.length) {
      applySubtitleOffset(0, subtitleTracks[currentIdx!]);
    }
  }

  /**
   * Apply sync‑specific buffer settings to the current HLS instance.
   * If no HLS instance exists, the settings will be remembered and applied
   * the next time `loadStream` is called.
   */
  let _syncMode = false;
  function applySyncBuffer(enabled: boolean) {
    _syncMode = enabled;
    if (hls && HlsClass) {
      const config = hls.config;
      if (enabled) {
        config.maxBufferLength = SYNC_BUFFER_OPTIONS.maxBufferLength;
        config.maxMaxBufferLength = SYNC_BUFFER_OPTIONS.maxMaxBufferLength;
        config.maxBufferSize = SYNC_BUFFER_OPTIONS.maxBufferSize;
      } else {
        // Restore default HLS.js values
        config.maxBufferLength = 30;
        config.maxMaxBufferLength = 600;
        config.maxBufferSize = 60 * 1000 * 1000; // 60 MB
      }
    }
  }

  async function loadStream(url: string, subtitles: SubtitleTrack[]) {
    if (hls) {
      hls.destroy();
      hls = null;
    }

    subtitleTracks.forEach((t) => t.parentNode?.removeChild(t));
    subtitleTracks = [];
    originalCueTimes.clear();

    availableSubtitles.set(subtitles);
    currentStreamUrl.set(url);

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
        let currentIdx: number;
        selectedSubtitle.subscribe((idx) => (currentIdx = idx))();
        if (currentIdx! === i) {
          let offset: number;
          subtitleOffset.subscribe((o) => (offset = o))();
          if (offset! !== 0) {
            applySubtitleOffset(offset!, t);
          }
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
        // Apply sync buffer settings if sync mode is active at load time
        ...(_syncMode ? SYNC_BUFFER_OPTIONS : {}),
      });
      hls.on(HlsClass.Events.MANIFEST_PARSED, () => {});
      hls.loadSource(url);
      hls.attachMedia(video);
    } else {
      video.src = url;
    }
  }

  function setQuality(index: number, sources: StreamSource[]) {
    selectedQuality.set(index);
    if (index === -1) {
      if (hls) hls.currentLevel = -1;
      return;
    }
    const url = sources[index]?.url;
    let currentUrl: string;
    currentStreamUrl.subscribe((u) => (currentUrl = u))();
    if (!url || url === currentUrl!) return;

    const resumeAt = video.currentTime;
    const wasPlaying = !video.paused;

    let currentSubIdx: number;
    selectedSubtitle.subscribe((idx) => (currentSubIdx = idx))();
    if (currentSubIdx! >= 0 && currentSubIdx! < subtitles.length) {
      savedSubtitleLang = subtitles[currentSubIdx!].lang;
      let offset: number;
      subtitleOffset.subscribe((o) => (offset = o))();
      savedSubtitleOffset = offset!;
      awaitingSubtitleRestore = true;
    } else {
      savedSubtitleLang = "";
      awaitingSubtitleRestore = false;
    }

    loadStream(url, subtitles).then(() => {
      const resume = () => {
        video.currentTime = resumeAt;
        if (wasPlaying) video.play().catch(() => {});
        video.removeEventListener("loadedmetadata", resume);
        if (awaitingSubtitleRestore && savedSubtitleLang) {
          awaitingSubtitleRestore = false;
          const idx = subtitles.findIndex((s) => s.lang === savedSubtitleLang);
          if (idx !== -1) {
            subtitleOffset.set(savedSubtitleOffset);
            setSubtitle(idx);
          }
        }
      };
      video.addEventListener("loadedmetadata", resume, { once: true });
    });
  }

  function destroy() {
    hls?.destroy();
    subtitleTracks.forEach((t) => t.parentNode?.removeChild(t));
  }

  return {
    loadStream,
    setQuality,
    setSubtitle,
    adjustSubtitleOffset,
    resetSubtitleOffset,
    applySyncBuffer, // <-- exposed
    destroy,
    selectedQuality,
    selectedSubtitle,
    subtitleOffset,
    availableSubtitles,
    availableSources,
    currentStreamUrl,
  };
}
