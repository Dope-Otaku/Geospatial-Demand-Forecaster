# 🌍 Geospatial Demand Forecaster (Real-Time AI Logistics)

A high-performance, real-time demand forecasting engine that predicts urban logistics "Hot Zones" using streaming data and Machine Learning.

## 🚀 The Problem
Logistics companies often react to demand rather than anticipating it. This project solves that by processing thousands of live coordinate pings to predict where deliveries will spike in the next 10–30 minutes.

## 🛠 Tech Stack
- **Frontend:** Next.js 15 (App Router), Deck.gl, Mapbox GL JS, Tailwind CSS.
- **Backend:** FastAPI (Python), WebSockets.
- **Data Pipeline:** Apache Kafka (Event-driven architecture).
- **Machine Learning:** Scikit-Learn (Random Forest/XGBoost), H3 (Geospatial Indexing).
- **DevOps:** Docker, Docker Compose.

## 🏗 Workflow & Architecture
1. **Producer:** A Python script simulates live delivery pings and pushes to **Kafka**.
2. **Stream Processor:** FastAPI consumes the Kafka topic and groups coordinates into **H3 Hexagons**.
3. **Inference:** A pre-trained ML model predicts the demand intensity for each hexagon.
4. **Visualization:** **Next.js** receives the predictions via WebSockets and renders a 3D heatmap using **Deck.gl** at 60FPS.

## 🔧 Installation & Setup

### Prerequisites
- Docker & Docker Compose
- Mapbox Public Token (Free)

### 1. Clone & Set Environment
```bash
git clone [https://github.com/yourusername/geospatial-demand-forecaster.git](https://github.com/yourusername/geospatial-demand-forecaster.git)
cd geospatial-demand-forecaster
cp .env.example .env # Add your Mapbox Token here