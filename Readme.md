# Geo-Demand AI: Real-Time Geospatial Logistics Simulator

Geo-Demand AI is a high-performance, full-stack **Event-Driven Digital Twin** of an urban delivery network. It simulates a live fleet of riders moving through Mumbai, using machine learning to identify high-density demand centers in real-time.

---

## 🛠️ The Tech Stack: Why these tools?

* **Next.js 15 (App Router):** The foundation for a production-grade, SEO-friendly, and high-performance UI.
* **Apache Kafka:** Acts as the high-throughput "nervous system," buffering thousands of GPS pings per second.
* **FastAPI:** A high-speed asynchronous bridge that streams data from Kafka to the browser via WebSockets.
* **Deck.gl + MapLibre:** A WebGL2-powered engine that enables 3D rendering of 2,000+ moving objects at 60fps.
* **Scikit-Learn (K-Means):** The "AI Brain" in the backend that mathematically clusters rider positions to find market epicenters.

---

## 🧠 The Architecture (The Pipeline)



1.  **Ingestion (Agent Simulation):** A Python-based `producer.py` creates **Stateful Rider Agents**. These riders aren't random; they have "memory" and intentionally navigate toward specific hubs (Colaba, Bandra, Andheri).
2.  **Processing (The AI Bridge):** Kafka buffers these events, and the FastAPI backend consumes them. Every 10 messages, the backend runs a **K-Means Clustering** algorithm to find the 3 most important coordinates (Centroids) based on current density.
3.  **Visualization (The Frontend):** The UI receives this combined stream via WebSockets and renders a layered 3D experience.

---

## 📊 The Dashboard: How to Track Data

The UI is a glassmorphism "Mission Control" HUD that tracks the system's health and the city's pulse:

### **1. Real-Time Metrics**
* **Active Fleet:** The total number of live riders currently being tracked in the browser's state.
* **AI Hotspots:** A calculated indicator of how many zones have exceeded a "Critical" density threshold.
* **System Stability:**
    * `CALIBRATING...`: The AI is gathering data to find patterns.
    * `OPTIMIZED`: K-Means has locked onto the 3 main market epicenters.

### **2. Visual Layers**
* **White Dots (Individual Riders):** Real-time position of every bike on the road.
* **3D Hexagons (Demand Pillars):** Semi-transparent pillars where **Height = Density**. They represent the "Now."
* **Green Rings (AI Centroids):** Large neon rings showing where the AI predicts the "Heart" of the demand is shifting. They represent the "Where."

### **3. Interactive Tooltips**
Hovering over a 3D pillar provides a dynamic readout of:
* **Zone Status:** `STABLE` vs. `CRITICAL`.
* **Rider Count:** The exact number of riders "binned" into that 200m hexagon.
* **Coordinates:** Live Lat/Lon tracking of that specific zone.

---

## 🚀 Getting Started

### 1. Infrastructure
```bash
# Start Kafka and Zookeeper (KRaft Mode)
docker-compose up -d
```

### 2. Backend & ML
```bash
# start your backend server (FastApi)
cd backend
pip install -r requirements.txt
python main.py
```

### 3. Simulator (Data wise)
```bash
# start your real time random data simulator 
cd data-pipeline
python producer.py
```

### 4. Frontend
```bash
# start your real time dashboard
cd frotend
npm run dev
```

## Geo-Demand AI: Final Overview

Open [http://localhost:3000](http://localhost:3000) to view the live simulation.

---

## 🛠️ Development Principles

* **Performance:** All **Deck.gl** layers are wrapped in `useMemo` to prevent unnecessary re-renders and UI lag during high-frequency Kafka streams.
* **Coordinate Standard:** The system strictly uses `[Longitude, Latitude]` (LNG/LAT) globally to maintain compatibility with **MapLibre** and **Deck.gl** standards.
* **Layering:** Hexagon pillars are rendered with `0.7 opacity` and `0.8 coverage`. This visual hierarchy ensures that the **AI Rings** (Centroids) remain visible even when high-density pillars are stacked above them.

---

**Created by @CodedInPajamas** | *Senior Data Analyst & Full-Stack Developer | Side Project*