import asyncio
import json
from datetime import datetime, timedelta
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from aiokafka import AIOKafkaConsumer
from fastapi.middleware.cors import CORSMiddleware
from collections import Counter
import numpy as np
from sklearn.cluster import KMeans

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

# A Predictable "Cluster Calculation Engine" to track demand spikes
class DemandPredictor:
    def __init__(self):
        self.history = []

    def get_ai_clusters(self):
        """
        Calculates the 3 main 'Epicenters' of demand using K-Means.
        """
        # 1. Prepare data (extract only lat/lon)
        if len(self.history) < 20: # Wait for enough data
            return []
            
        coords = np.array([[h[0], h[1]] for h in self.history])
        
        # 2. Run K-Means Clustering
        # We look for 3 clusters representing North, Central, and South hubs
        kmeans = KMeans(n_clusters=3, n_init='auto', random_state=42)
        kmeans.fit(coords)
        
        # 3. Return the centroids
        return kmeans.cluster_centers_.tolist()

    def add_data(self, lat, lon):
        self.history.append((lat, lon, datetime.now()))
        # Keep only the last 5 minutes of data for the 'Rolling' AI model
        cutoff = datetime.now() - timedelta(minutes=5)
        self.history = [h for h in self.history if h[2] > cutoff]
        
        # Keep history manageable
        if len(self.history) > 500:
            self.history = self.history[-500:]

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
        count = 0
        async for msg in consumer:
            data = msg.value
            predictor.add_data(data["latitude"], data["longitude"])
            
            # Every 10 pings, calculate the K-Means Centroids
            count += 1
            if count % 10 == 0:
                centroids = predictor.get_ai_clusters()
                data["centroids"] = centroids # Send the AI centers to the map
            
            await websocket.send_json(data)
    except Exception as e:
        print(f"Error in WebSocket: {e}")
    finally:
        await consumer.stop()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)