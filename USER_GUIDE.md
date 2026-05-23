# Melana - User Guide

Your complete guide to discovering movies, streaming with high quality, and watching together with friends.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Finding Movies](#finding-movies)
3. [Watching Movies](#watching-movies)
4. [Player Controls](#player-controls)
5. [Watching with Friends](#watching-with-friends)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

---

## Getting Started

### Accessing Melana

1. Open your web browser and navigate to the Melana application URL
2. You'll see the **home page** displaying popular movies
3. Look for the **Cache Indicator** (top-right) showing server status

### Understanding the Interface

```
┌─────────────────────────────────────────────────┐
│  🎬 MELANA    [Search...]    [Sort ▼]  [📊 Cache]│
├─────────────────────────────────────────────────┤
│                                                   │
│  [Movie] [Movie] [Movie]                        │
│  [Movie] [Movie] [Movie]                        │
│  [Movie] [Movie] [Movie]                        │
│                                                   │
└─────────────────────────────────────────────────┘
```

- **Search Box** - Find movies by title
- **Sort Dropdown** - Arrange movies by rating, name, or date
- **Cache Indicator** - Shows proxy server health and cache usage
- **Movie Grid** - Browse available movies

---

## Finding Movies

### Browsing Popular Movies

When you first open Melana, you'll see trending and popular movies automatically loaded on the home page.

**Actions:**

- Scroll down to see more movies
- Click any movie card to view details
- Mouse over a movie card to see preview information

### Searching for a Movie

**Step 1: Click the Search Box**

- Located at the top of the page
- Shows placeholder text like "Search movies..."

**Step 2: Type the Movie Title**

- Start typing the name of the movie you want to watch
- The search is **case-insensitive** and works with partial titles
- Example: Type "matrix" to find "The Matrix"

**Step 3: Use Autocomplete Suggestions**

- As you type, suggestions appear below the search box
- Click any suggestion to instantly search for that movie
- Or press Enter to search

**Step 4: Browse Results**

- Movie grid updates with matching results
- Results are shown with poster, title, and rating

**Helpful Tips:**

- Search is debounced (waits 300ms after you stop typing before updating)
- Empty search returns to popular movies feed
- Autocomplete uses TMDB data (largest movie database)

### Sorting Movies

**Available Sort Options:**

| Option | Sort Order               |
| ------ | ------------------------ |
| Rating | Highest rated first ⭐   |
| Name   | A → Z alphabetically     |
| Date   | Newest releases first 📅 |

**How to Sort:**

1. Click the **Sort Dropdown** at the top
2. Select your preferred sort method
3. Movie grid instantly reorganizes

---

## Watching Movies

### Movie Details Popup

When you click a movie card, a popup appears showing:

- **Poster & Title** - Movie artwork and full title
- **Rating** - Average user rating (0-10)
- **Plot Summary** - Brief description of the story
- **Cast** - Actors and their roles
- **Release Date** - When the movie was released

### Starting Playback

**Steps:**

1. Click the **"Watch"** button in the movie popup
2. The video player loads (may take 5-10 seconds on first load)
3. The "Starting..." indicator shows the proxy server is initializing
4. When ready, the player will automatically select the best quality for your connection
5. Click the **Play button** (center of video) or press **Spacebar** to start watching

**What Happens:**

- Video loads from the Melana proxy server
- Default subtitles load if available
- Selected quality level begins streaming

---

## Player Controls

### Playback Controls

Located at the bottom of the video player:

```
[Play|▶] ──[═══════●═════]── [00:45 / 02:30]
```

| Control      | Function                              |
| ------------ | ------------------------------------- |
| Play/Pause   | Start or pause playback (or Spacebar) |
| Progress Bar | Click to jump to that time            |
| Time Display | Current time / Total duration         |

### Volume Control

- **Volume Slider** - Located in the bottom-right area
- **Mute** - Click speaker icon (or press M)
- Range: 0% to 100%

### Quality Selection

**Steps:**

1. Click the **"Quality"** or **"Settings"** menu in the player
2. Available options:
   - **Auto** (Recommended) - Player chooses based on your bandwidth
   - **1080p** - Highest quality (requires 5+ Mbps)
   - **720p** - Good quality (requires 3+ Mbps)
   - **480p** - Standard (requires 1.5+ Mbps)
   - **360p** - Low quality (requires 0.5+ Mbps)

**Tips:**

- "Auto" is recommended for best experience
- Quality changes apply to _future_ segments
- Lower quality if you experience buffering
- Better quality if you have fast internet

### Subtitle Controls

**Enabling Subtitles:**

1. Click the **"Subtitles"** or **"CC"** button
2. Select a language from the dropdown:
   - English
   - Spanish
   - French
   - And more (depends on availability)
3. Subtitles appear at the bottom of the screen

**Adjusting Subtitle Timing:**

Some movies have subtitle sync issues. Fix them using the **Offset Slider**:

- **Positive offset** (+0.5s to +5s) - Delays subtitles (they appear later)
- **Negative offset** (-0.5s to -5s) - Advances subtitles (they appear earlier)
- Use the slider or arrow keys for fine adjustment

**Hiding Subtitles:**

- Click "Off" in the subtitle menu
- Or press CC button again to toggle off

### Playback Speed

**Available Speeds:**

- 0.5x - Half speed (slow motion)
- 0.75x - Three-quarter speed
- 1x - Normal (default)
- 1.25x - Slightly faster
- 1.5x - 50% faster
- 2x - Double speed

**How to Change:**

1. Click the **speed icon** in player controls
2. Select desired speed from menu
3. Takes effect immediately

**Use Cases:**

- 0.5x - Studying or detailed scenes
- 1.5x - Familiar content you've seen before
- 2x - Recaps or recap scenes

### Full-Screen Mode

**Entering Full-Screen:**

1. Click the **full-screen icon** (bottom-right)
2. Or press **F** key
3. Player expands to fill entire screen

**Controls in Full-Screen:**

- All controls remain visible
- Move mouse to show/hide controls
- Press Esc to exit full-screen

**Keyboard Shortcuts:**

| Key      | Action                       |
| -------- | ---------------------------- |
| Spacebar | Play/Pause                   |
| F        | Full-Screen                  |
| M        | Mute/Unmute                  |
| ← / →    | Seek ±5 seconds              |
| ↑ / ↓    | Volume ±10%                  |
| < / >    | Playback speed change        |
| . / ,    | Next/Previous frame (paused) |

### Exiting the Player

1. Click the **"Back"** arrow button (top-left of player)
2. Or press **Escape**
3. Returns to main movie grid

---

## Watching with Friends

### Creating a Sync Room

**Steps:**

1. Start watching a movie (see [Starting Playback](#starting-playback))
2. Look for **"Create Room"** or **"Sync"** button in player controls
3. A **Room ID** is generated automatically
4. Share this ID with friends via:
   - Chat/messaging app
   - Social media
   - Email
   - Copy-paste

**What Friends See:**

- They'll see the room waiting for them
- Other users can join while you're watching

### Joining a Sync Room

**Steps:**

1. On the main page, click **"Join Sync Room"** button
2. A dialog appears asking for:
   - **Your Name** (nickname displayed to others)
   - **Room ID** (provided by your friend)
3. Enter both fields and click **"Join"**
4. You'll be added to the room and playback will synchronize

### During Synchronized Watching

**What Happens:**

- Your playback synchronizes with the room
- When anyone plays/pauses, everyone's playback pauses
- When anyone seeks (scrubs timeline), everyone jumps to that point
- Everyone's video player stays in sync (target offset: ±0ms)

**Sync Status Indicator:**

The player shows your sync status:

- `Offset: 0 ms | Syncing…` - Perfect sync
- `Offset: +100 ms | Syncing…` - You're 100ms behind
- `⏸ Waiting for User...` - Someone is buffering

**If Someone Buffers:**

- Entire room pauses automatically
- Prevents desync during buffering
- Resumes when they're ready

**Who's in the Room:**

- Look for **user list** in the player
- Shows all members and their status
- Green dot = connected and synced
- Yellow dot = buffering

### Leaving a Sync Room

1. Click **"Back"** button to exit the player
2. You're automatically removed from the room
3. Other members are notified of your departure

**Important:**

- Leaving doesn't affect other members
- They can continue watching
- Others can rejoin later if needed

---

## Advanced Features

### Server Cache Monitoring

**Understanding the Cache Indicator:**

Located in the top-right corner of the app:

```
📊 45%
```

- **Percentage** = How much of the cache storage is being used
- **Colors:**
  - Green (0-89%) = Healthy cache usage
  - Red (90%+) = Critical (cache nearly full)

**Hovering Over Cache Indicator:**

When you hover over it, a detailed chart appears showing:

- **Entries** - Number of cached video segments
- **Current Size** - How many GB are being used
- **Max Size** - Maximum allowed cache size
- **Utilization** - Percentage chart

**Why Cache Matters:**

- Reduces server load
- Faster playback for repeated movies
- Lowers bandwidth usage

### Custom Stream URLs

**Adding a Custom Stream:**

1. Look for **"Add Custom Stream"** button
2. Enter the `.m3u8` HLS stream URL
3. Optionally enter the **Origin URL** (for authentication)
4. Click **"Play"**

**Example Use:**

- Personal media server streams
- Testing alternative sources
- Private streaming URLs

**Requirements:**

- URL must be a valid .m3u8 HLS manifest
- Stream must be accessible from your location
- Origin should match the stream's source

### Keyboard Shortcuts

**Navigation:**

- `Esc` - Exit fullscreen or go back

**Playback (in player):**

- `Spacebar` - Play/Pause
- `F` - Fullscreen toggle
- `M` - Mute/Unmute
- `< / >` - Slower/Faster playback
- `. / ,` - Next/Previous frame (paused only)

**Seeking:**

- `← / →` - Jump ±5 seconds
- `J / L` - Jump ±10 seconds (varies by player)

**Volume:**

- `↑ / ↓` - Volume up/down

---

## Troubleshooting

### Movie Won't Play

**Problem: Video player shows loading spinner indefinitely**

**Solutions:**

1. Check your internet speed (minimum 2 Mbps for SD, 5 Mbps for HD)
2. Look at cache indicator - if it says "Starting…", wait 2-5 minutes
3. Try a lower quality setting
4. Refresh the page and try again
5. Clear browser cache and cookies

### Buffering During Playback

**Problem: Video keeps stopping to load**

**Solutions:**

1. **Lower quality** - Click quality selector and choose 480p or lower
2. **Close other apps** - Stop downloads, video calls, etc.
3. **Check bandwidth** - Run a speed test (speedtest.net)
4. **Wired connection** - Use ethernet if possible (more stable than WiFi)
5. **Restart player** - Go back and click "Watch" again

### Subtitles Not Showing

**Problem: Can't see subtitles or they're in wrong language**

**Solutions:**

1. Click subtitle button and verify **not** set to "Off"
2. Select a different language
3. Check if movie has subtitle options (not all movies do)
4. Try adjusting subtitle offset
5. Refresh and try again

### Sync Not Working

**Problem: My video doesn't match others in sync room**

**Solutions:**

1. Verify **room ID** is correct (case-sensitive)
2. Check your internet connection is stable
3. Lower video quality to improve sync
4. Leave room and rejoin
5. Restart the browser

### Proxy Server Shows "Starting…"

**Problem: Cache indicator stuck on "Starting…" or grayed out**

**Solutions:**

1. This is normal on cold start - **wait 2-5 minutes**
2. Don't close the tab (let it complete)
3. Try refreshing if it takes >10 minutes
4. Check if you can access the proxy server directly at `melana.onrender.com`

### Poor Video Quality

**Problem: Video looks pixelated or blurry**

**Solutions:**

1. **Auto quality selected** but bandwidth is limited - lower manually
2. Check your internet speed (may not support HD)
3. Movie source quality is limited (no higher available)
4. Wait for cache to build (first play is sometimes lower quality)

---

## FAQ

**Q: Is Melana free?**
A: Yes, completely free to use with no account required.

**Q: Do I need to sign up?**
A: No registration, login, or account needed.

**Q: Can I download movies?**
A: No, Melana only supports streaming. Downloads aren't available.

**Q: Where do the movies come from?**
A: Movies are sourced from various streaming APIs and services.

**Q: Is my viewing history saved?**
A: No, Melana doesn't track or store your viewing history.

**Q: Can I watch offline?**
A: No, internet connection is required for streaming.

**Q: How many people can join a sync room?**
A: No strict limit, but performance may degrade with very large groups (50+).

**Q: Does video quality affect sync?**
A: Higher quality can cause sync issues if bandwidth is limited. Lower quality helps sync stay accurate.

**Q: What if I want to watch something specific?**
A: Use the search feature to find by title. Not all movies are available.

**Q: How do I report a broken stream?**
A: Currently there's no in-app reporting, but try a different quality or custom stream URL.

**Q: Why can't I access Melana from certain countries?**
A: Some regions may have restrictions due to licensing or regional blocking. The proxy should help bypass this.

**Q: Is it legal to use Melana?**
A: Check your local laws. Movie streaming legality varies by region and source.

---

## Tips & Best Practices

### For Best Streaming Quality

1. Use "Auto" quality selection
2. Stream during off-peak hours (fewer users = more bandwidth)
3. Close other bandwidth-heavy applications
4. Use wired ethernet connection if possible

### For Best Sync Experience

1. All users should have similar bandwidth
2. Host should have fastest connection
3. Use lower quality if sync is drifting
4. Minimize network latency (WiFi to ethernet)

### For Smooth Playback

1. Let the cache build (first 2 minutes of playback downloads more)
2. Don't skip around too much initially
3. Pause briefly if you see buffering (lets cache catch up)
4. Try a different quality level if problems persist

---

**Note:** This user guide has been generated with AI assistance to provide comprehensive instructions. The actual Melana application, features, and implementation are original; documentation has been drafted with AI tools.

_Last Updated: May 2026_
