<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
# Project Context: Geo-Demand AI (Real-Time Geospatial Pipeline)

## Core Tech Stack
- **Framework:** Next.js 15+ (App Router)
- **Visualization:** Deck.gl + MapLibre GL (Vector-based 3D rendering)
- **Real-time:** WebSockets (FastAPI backend bridge to Apache Kafka)
- **State Management:** React `useState`/`useMemo` for high-frequency data (2,000+ points)
- **Styling:** Tailwind CSS + Lucide React (Glassmorphism HUD)

## Development Principles
1. **Performance First:** - Always wrap Deck.gl layers in `useMemo`. 
   - Dependencies MUST include both `points` and `centroids`.
   - Never trigger a full re-render for individual data pings; batch updates using `.slice(-2000)`.

2. **Geospatial Conventions:**
   - **Coordinates:** ALWAYS use `[longitude, latitude]` (LNG/LAT) format for Deck.gl and MapLibre. 
   - **Picking:** Interaction logic must happen in `onHover` or `onClick` via the Deck.gl Picking Engine (`info.object`).
   - **Nesting:** Data in `HexagonLayer` is binned; access raw points via `info.object.points`.

3. **System Architecture:**
   - **Event-Driven:** The frontend is a consumer of a Kafka-backed stream. 
   - **AI Integration:** Centroids are calculated in the Python backend via K-Means and sent via the same WebSocket.
   - **Agent-Based Simulation:** The `producer.py` simulates real movement toward targets; do not treat data as static.

## UI/UX Standards
- **Theme:** Ultra-dark mode (`bg-[#020617]`).
- **HUD:** Absolute-positioned glassmorphism panels with `backdrop-blur-md`.
- **Tooltips:** Must use `pointer-events-none` to avoid blocking the picking radius of the 3D layers.

## Common Pitfalls to Avoid
- **Syntax Errors:** Ensure `if` conditions in hover logic are properly parenthesized.
- **Coordinate Inversion:** Do not swap Lat and Lon.
- **Z-Index:** DeckGL must maintain `zIndex: 1` relative to the MapLibre base map.
<!-- END:nextjs-agent-rules -->
