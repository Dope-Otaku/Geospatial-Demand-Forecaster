"use client";
import React, { useState, useEffect, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`;

export default function Home() {
  const [points, setPoints] = useState<any[]>([]);
  const [centroids, setCentroids] = useState<number[][]>([]);
  const [stats, setStats] = useState({ highDemandZones: 0, totalRiders: 0 });
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const [viewState, setViewState] = useState({
    longitude: 72.8777,
    latitude: 19.0760,
    zoom: 11,
    pitch: 45,
    bearing: 0
  });

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws/stream');
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPoints(prev => {
        const newPoint = { 
          coords: [data.longitude, data.latitude],
        };
        
        const newPoints = [...prev, newPoint].slice(-2000);
        const mockHotspots = newPoints.length > 500 ? Math.floor(newPoints.length / 20) : 0;

        setStats({
          totalRiders: newPoints.length,
          highDemandZones: mockHotspots // This will now show a number!
        });
        
        return newPoints;
      });

      if (data.centroids) {
        setCentroids(data.centroids);
      }
    };
    
    return () => socket.close();
  }, []);

  const layers = useMemo(() => {
    if (!points || points.length === 0) return [];

    return [
    // 1. BASE LAYER: Individual Riders (The "Pulse")
    new ScatterplotLayer({
      id: 'individual-riders',
      data: points,
      getPosition: (d: any) => d.coords,
      getFillColor: [255, 255, 255, 200], // Brighter white
      getRadius: 40, 
      opacity: 0.8,
    }),

    // 2. MIDDLE LAYER: AI Hubs (Moving Rings)
    // We move this BEFORE the hexagons so they sit on the ground
    new ScatterplotLayer({
      id: 'ai-centroids',
      data: centroids.map((c, i) => ({ coords: [c[1], c[0]], id: i + 1 })),
      getPosition: (d: any) => d.coords,
      getFillColor: [0, 255, 150, 80],
      getRadius: 1500, // Made it bigger to act as a "Zone"
      pickable: true,
      onHover: (info) => {
        if (info.object) {
          setHoverInfo({
            x: info.x, y: info.y,
            count: "AI CLUSTER CENTER",
            status: `HUB #${info.object.id}`
          });
        }
      }
    }),

    // 3. TOP LAYER: Transparent Heatmap Pillars
    new HexagonLayer({
      id: 'heatmap-layer',
      data: points,
      getPosition: (d: any) => d.coords,
      radius: 200,
      elevationScale: 15,
      extruded: true,
      pickable: true,
      autoHighlight: true,
      opacity: 0.3, // Very transparent so you see through to the dots and rings
      coverage: 0.7, // Slimmer pillars so they don't look like a solid wall
      onHover: (info) => {
        if (info.object) {
          const actualRiderCount = info.object.points?.length || 0;
          setHoverInfo({
            x: info.x, y: info.y,
            count: actualRiderCount,
            status: actualRiderCount > 15 ? "CRITICAL" : "STABLE"
          });
        } else {
          setHoverInfo(null);
        }
      },
      colorRange: [[1, 152, 189], [73, 227, 206], [216, 254, 181], [254, 237, 177], [254, 173, 84], [209, 55, 78]]
    })
  ];
    // Added centroids to dependencies so the rings actually update!
  }, [points, centroids]);

  return (
    <main className="h-screen w-full relative bg-[#020617]">
      {/* HUD Control Panel */}
      <div className="absolute top-6 left-6 z-20 w-80 p-6 bg-slate-950/85 border border-white/10 rounded-2xl backdrop-blur-md shadow-2xl">
        <h1 className="text-xl font-black text-white italic tracking-tighter uppercase">
          Geo-Demand <span className="text-emerald-500">AI</span>
        </h1>
        
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Fleet</span>
            <span className="text-emerald-400 font-mono font-bold">{stats.totalRiders}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">AI Hotspots</span>
            <span className="text-rose-500 font-mono font-bold">{stats.highDemandZones}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">System Stability</span>
            <span className="text-blue-400 font-mono font-bold">
              {centroids.length > 0 ? "OPTIMIZED" : "CALIBRATING..."}
            </span>
          </div>

          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${Math.min((stats.highDemandZones / 50) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <DeckGL
        initialViewState={viewState}
        onViewStateChange={e => setViewState(e.viewState as any)}
        controller={true}
        layers={layers}
        parameters={{ depthTest: true, blend: true }}
      >
        <Map mapStyle={MAP_STYLE} />
      </DeckGL>

      {hoverInfo && (
        <div 
          className="pointer-events-none absolute z-50 p-3 bg-slate-900/90 border border-white/20 rounded-lg backdrop-blur-md shadow-xl"
          style={{ left: hoverInfo.x + 15, top: hoverInfo.y + 15 }}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full ${hoverInfo.status.includes('CRITICAL') ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-[9px] font-black text-white uppercase tracking-tighter">Zone Status: {hoverInfo.status}</span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              <span className="text-white font-bold">{hoverInfo.count}</span>
            </p>
          </div>
        </div>
      )}
    </main>
  );
}