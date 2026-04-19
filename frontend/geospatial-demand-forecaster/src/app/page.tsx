"use client";
import React, { useState } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
// Using a sleek, dark vector style from MapTiler
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`;

export default function Home() {
  const [viewState, setViewState] = useState({
    longitude: 72.8777, // Mumbai
    latitude: 19.0760,
    zoom: 11,
    pitch: 45,
    bearing: 0
  });

  // WebSocket connection to receive real-time rider data from the backend
  React.useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws/stream');
    
    socket.onopen = () => console.log("✅ Map connected to Backend WebSocket");
    socket.onmessage = (event) => console.log("📍 New Rider Data:", JSON.parse(event.data));
    socket.onerror = (error) => console.error("❌ WebSocket Error:", error);
    
    return () => socket.close();
  }, []);

  return (
    <main className="h-screen w-full relative bg-[#020617]">
      {/* UI Overlay */}
      <div className="absolute top-6 left-6 z-20 w-80 p-6 bg-slate-950/90 border border-slate-800 rounded-2xl backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black text-white tracking-tighter italic">GEO-DEMAND</h1>
          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20">OPEN-SOURCE</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">Stream: Active</p>
          </div>
          
          <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Inference Engine (MapLibre)</p>
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Geospatial Engine */}
      <DeckGL
        initialViewState={viewState}
        onViewStateChange={e => setViewState(e.viewState)}
        controller={true}
        layers={[]} 
      >
        <Map mapStyle={MAP_STYLE} />
      </DeckGL>
    </main>
  );
}