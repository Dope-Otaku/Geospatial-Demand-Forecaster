import asyncio
import json
from datetime import datetime, timedelta
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from aiokafka import AIOKafkaConsumer
from fastapi.middleware.cors import CORSMiddleware
from collections import Counter

app = FastAPI()

# Security Measure: Allow your Next.js frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

KAFKA_BOOTSTRAP_SERVERS = "localhost:9092"
KAFKA_TOPIC = "logistics_events"

# A simple "Inference Engine" to track demand spikes
class DemandPredictor:
    def __init__(self):
        self.history = []

    def predict_hotzone(self, lat, lon):
        # Round coordinates to create "buckets" (approx 500m blocks)
        lat_bin = round(lat, 3)
        lon_bin = round(lon, 3)
        self.history.append((lat_bin, lon_bin, datetime.now()))
        
        # Keep only last 2 minutes of history
        cutoff = datetime.now() - timedelta(minutes=2)
        self.history = [h for h in self.history if h[2] > cutoff]
        
        # Count occurrences in this bin
        counts = Counter([(h[0], h[1]) for h in self.history])
        current_density = counts[(lat_bin, lon_bin)]
        
        # AI Logic: If density > 10 in 2 mins, mark as a "High Demand" cluster
        return "high" if current_density > 10 else "normal"

predictor = DemandPredictor()

@app.get("/")
async def root():
    return {"status": "FastAPI is running"}

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Frontend connected to WebSocket for streaming!")
    
    # Initialize Asynchronous Kafka Consumer
    consumer = AIOKafkaConsumer(
        KAFKA_TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_deserializer=lambda v: json.loads(v.decode('utf-8'))
    )
    
    await consumer.start()
    try:
        async for msg in consumer:
            data = msg.value
            # Inject our "AI" prediction
            data["demand_level"] = predictor.predict_hotzone(data["latitude"], data["longitude"])
            await websocket.send_json(data)
    except WebSocketDisconnect:
        print("Frontend failed to sync!")
    finally:
        await consumer.stop()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)