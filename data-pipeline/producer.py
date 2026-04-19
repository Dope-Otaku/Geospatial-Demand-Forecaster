import time
import json
import random
from kafka import KafkaProducer

# The 3 "Demand Hubs" our AI focuses on
HUBS = [
    {"name": "Colaba", "lat": 18.92, "lon": 72.83},
    {"name": "Bandra", "lat": 19.05, "lon": 72.82},
    {"name": "Andheri", "lat": 19.11, "lon": 72.86}
]

class Rider:
    def __init__(self, id):
        self.id = f"rider_{id}"
        # Start riders at random spots in Mumbai
        self.lat = random.uniform(18.90, 19.20)
        self.lon = random.uniform(72.80, 72.95)
        # Assign a random hub as their "Delivery Destination"
        self.target = random.choice(HUBS)

    def move(self):
        # Calculate step size (very small for smooth movement)
        step = 0.0005 
        
        # Move Latitude toward target
        if self.lat < self.target["lat"]: self.lat += step
        else: self.lat -= step
            
        # Move Longitude toward target
        if self.lon < self.target["lon"]: self.lon += step
        else: self.lon -= step

        # If they reach the hub, give them a new random target
        if abs(self.lat - self.target["lat"]) < 0.001:
            self.target = random.choice(HUBS)

    def to_dict(self):
        return {
            "rider_id": self.id,
            "latitude": round(self.lat, 4),
            "longitude": round(self.lon, 4),
            "timestamp": time.time()
        }

# Initialize Kafka
producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# Create a fleet of 100 riders
fleet = [Rider(i) for i in range(100)]

print("🚀 Simulation Started: Riders are moving toward AI Hubs...")

while True:
    for rider in fleet:
        rider.move()
        producer.send('logistics_events', rider.to_dict())
    
    producer.flush()
    # Slow down so we can see the movement on the map
    time.sleep(0.5)