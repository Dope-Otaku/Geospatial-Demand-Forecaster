"use client";
import React, { useState, useEffect, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
// Using a sleek, dark vector style from MapTiler
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`;

export default function Home() {
  const [points, setPoints] = useState<number[][]>([]);
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
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Append [lon, lat] and keep only the last 2000 points for performance
      setPoints(prev => [...prev, [data.longitude, data.latitude]].slice(-2000));
    };
    socket.onerror = (error) => console.error("❌ WebSocket Error:", error);
    
    return () => socket.close();
  }, []);

  // Performance Optimization: Only re-render the layer when points change
const layers = useMemo(() => {
  // Safety Check: If no points, it doesn't render
  if (!points || points.length === 0) return [];

  return [
    new HexagonLayer({
      id: 'heatmap-layer',
      data: points,
      // do Data Sanitization: Ensure d is a valid array before accessing indices
      getPosition: (d: any) => {
        if (!d || d.length < 2) return [0, 0];
        return d;
      },
      radius: 250,
      elevationScale: 20, 
      extruded: true,
      pickable: true,
      updateTriggers: {
        getPosition: [points.length]
      },
      colorRange: [
        [1, 152, 189], [73, 227, 206], [216, 254, 181],
        [254, 237, 177], [254, 173, 84], [209, 55, 78]
      ]
    })
  ];
}, [points]);

  return (
    <main className="h-screen w-full relative bg-[#020617]">
      {/* The Floating UI Control Panel */}
      <div className="absolute top-6 left-6 z-20 w-80 p-6 bg-slate-950/90 border border-slate-800 rounded-2xl backdrop-blur-xl shadow-2xl">
        <h1 className="text-xl font-black text-white italic tracking-tight">GEO-DEMAND AI</h1>
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
              Live Kafka Feed: {points.length} Events
            </p>
          </div>
          <div className="p-2 bg-slate-900/50 rounded border border-slate-800">
             <p className="text-[9px] text-slate-500 font-bold uppercase">Region: Greater Mumbai</p>
          </div>
        </div>
      </div>

      <DeckGL
        initialViewState={viewState}
        onViewStateChange={e => setViewState(e.viewState as any)}
        controller={true}
        layers={layers}
        parameters={{
          depthTest: true,
          blend: true,
        }}
      >
        <Map mapStyle={MAP_STYLE} />
      </DeckGL>
    </main>
  );
}