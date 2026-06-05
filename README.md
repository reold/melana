# Melana Frontend

A modern, responsive web interface for the Melana movie streaming platform. Built with Svelte, TypeScript, and Vite for a fast, interactive user experience.

## Overview

Melana Frontend is a single-page application that provides users with:

- 🎬 Movie discovery and search with TMDB integration
- 🎥 Advanced video player with HLS adaptive streaming
- 📊 Real-time quality and subtitle controls
- 👥 Synchronized watching with friends (watch-together rooms)
- 💾 Server cache health monitoring
- ⚙️ Custom stream URL support

For detailed user information, see [USER_GUIDE.md](USER_GUIDE.md).

## Quick Start

### Prerequisites

- Node.js 18+ or Bun runtime
- npm, yarn, pnpm, or bun package manager

### Development

```bash
# Install dependencies
bun install

# Run development server
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
# Create production build
bun run build

# Preview production build locally
bun run preview
```

## Project Structure

```
src/
├── components/          # Svelte UI components
│   ├── Header.svelte       # Navigation and search
│   ├── MovieGrid.svelte    # Movie browsing grid
│   ├── MoviePopup.svelte   # Movie details modal
│   ├── Watch.svelte        # Video player with HLS support
│   ├── CacheIndicator.svelte  # Server cache monitor
│   ├── SortDropdown.svelte    # Movie sorting controls
│   ├── Dropdown.svelte        # Generic dropdown component
│   ├── SearchAutocomplete.svelte  # Search suggestions
│   ├── JoinRoomDialog.svelte      # Sync room dialog
│   ├── CustomStreamDialog.svelte   # Custom URL dialog
│   └── ...
├── lib/
│   ├── tmdb.ts         # TMDB API integration
│   ├── videasy.ts      # Stream discovery API
│   ├── proxy.ts        # Proxy server communication
│   └── utils.ts        # Utility functions
├── styles/
│   ├── global.css      # Global styles
│   └── app.css         # App-specific styles
├── App.svelte          # Root component
└── main.ts             # Application entry point
```

## Key Features

### Movie Discovery

- Search by title with autocomplete suggestions
- Browse popular/trending movies
- Sort by rating, name, or release date
- View detailed movie information (cast, plot, ratings)

### Video Player

- **Quality Control** - Switch between available quality levels
- **Subtitles** - Multi-language subtitle support with timing offset
- **Playback Speed** - Adjust speed from 0.5x to 2x
- **Full-Screen** - Immersive full-screen playback
- **Adaptive Streaming** - HLS.js with automatic bitrate selection

### Watch Together

- Create or join synchronized viewing rooms
- Real-time playback synchronization (target: ±0ms)
- Automatic buffer coordination
- User presence tracking

### Server Monitoring

- Real-time cache utilization display
- Detailed cache statistics (entries, size, GB)
- Service health status
- Critical warning at 90%+ cache usage

## Technology Stack

- **Framework** - Svelte 5
- **Language** - TypeScript
- **Build Tool** - Vite
- **Video Player** - HLS.js
- **Animation** - GSAP (GreenSock)
- **Styling** - CSS with CSS variables

## FOSS Dependencies

- **[XMB Background](https://github.com/fchavonet/creative_coding-xmb_wave_background)** - Beautiful animated wave background used in the home screen. Thanks to the developer for this wonderful creation!

## API Integration

### External APIs

- **TMDB API** - Movie metadata, search, credits
- **Videasy API** - Stream discovery and URLs
- **Melana Proxy** - Stream proxying and caching

### Internal APIs

- **Cloudflare Workers** - Room synchronization via WebSocket
- **FastAPI Backend** - Proxy server and cache management

## Development

### Code Style

- TypeScript for type safety
- Svelte components with reactive declarations
- Utility functions in `lib/` folder
- Component-scoped styling

### Building Components

Components follow Svelte best practices:

```svelte
<script lang="ts">
  import type { Movie } from '../lib/tmdb';

  export let movie: Movie;

  let isLoading = false;
</script>

<div class="component">
  <!-- Template -->
</div>

<style>
  /* Component styles */
</style>
```

### Hot Module Replacement (HMR)

Vite provides instant HMR for development. Component state is preserved automatically during development.

## Performance Considerations

- **Lazy Loading** - Heavy components (Watch, MoviePopup) load after first paint
- **Debouncing** - Search queries debounced at 300ms to reduce API calls
- **Image Optimization** - Movie posters load with lazy loading
- **Code Splitting** - Router-based code splitting for faster initial load

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with WebSocket support

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) extension

## Troubleshooting

### Dev Server Won't Start

```bash
# Clear cache and reinstall
rm -rf node_modules
bun install
bun run dev
```

### Port Already in Use

Change the port in `vite.config.ts`:

```ts
export default defineConfig({
  server: {
    port: 3000,
  },
});
```

### API Connection Issues

Ensure proxy server is running at `https://melana.onrender.com` and TMDB API is accessible.

## Deployment

Build for production:

```bash
bun run build
```

Output is in the `dist/` folder. Deploy to any static host (Vercel, Netlify, GitHub Pages, etc.).

---

**Note:** This project documentation has been generated with AI assistance. The implementation, architecture, and codebase are original work; documentation has been drafted with AI tools to provide comprehensive guides.

_Last Updated: May 2026_
