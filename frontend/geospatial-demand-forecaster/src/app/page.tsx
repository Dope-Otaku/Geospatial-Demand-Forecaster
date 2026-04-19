"use client";
import React, { useState, useEffect, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
// Using a sleek, dark vector style from MapTiler
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`;

export default function Home() {
  const [points, setPoints] = useState<number[][]>([]);
  const [hoverInfo, setHoverInfo] = useState<any>(null);
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
      setPoints(prev => [
        ...prev, 
        { coords: [data.longitude, data.latitude], isHigh: data.demand_level === "high" }
      ].slice(-2000));
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
      getPosition: (d: any) => d.coords, // Changed to handle object
      radius: 250,
      elevationScale: 20,
      extruded: true,
      onHover: (info) => {
        if (info.object) {
          setHoverInfo({
            x: info.x,
            y: info.y,
            count: info.object.points.length,
            // Calculate a "Status" based on the density
            status: info.object.points.length > 15 ? "CRITICAL" : "STABLE"
          });
        } else {
          setHoverInfo(null);
        }
      },
      colorRange: [[1, 152, 189], [73, 227, 206], [216, 254, 181], [254, 237, 177], [254, 173, 84], [209, 55, 78]]
    }),
    new ScatterplotLayer({
        id: 'prediction-layer',
        data: points.filter((p: any) => p.isHigh),
        getPosition: (d: any) => d.coords,
        getFillColor: [255, 0, 0, 150], // Red Glow
        getRadius: 300,
        updateTriggers: { getPosition: [points.length] }
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
      {/* Floating Tooltip */}
      {hoverInfo && (
        <div 
          className="pointer-events-none absolute z-50 p-3 bg-slate-900/90 border border-white/20 rounded-lg backdrop-blur-md shadow-xl"
          style={{ left: hoverInfo.x + 15, top: hoverInfo.y + 15 }}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full ${hoverInfo.status === 'CRITICAL' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-[9px] font-black text-white uppercase tracking-tighter">Zone Status: {hoverInfo.status}</span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              <span className="text-white font-bold">{hoverInfo.count}</span> Active Riders
            </p>
            <p className="text-[8px] text-slate-500 font-mono">LAT: {hoverInfo.y.toFixed(2)} | LON: {hoverInfo.x.toFixed(2)}</p>
          </div>
        </div>
      )}
    </main>
  );
}