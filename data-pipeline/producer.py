import json
import time
import random
from kafka import KafkaProducer

# The address of your Docker Kafka container
KAFKA_BOOTSTRAP_SERVERS = 'localhost:9092'
TOPIC_NAME = 'logistics_events'

def get_producer():
    """Initializes the Kafka producer with optimized settings for streaming."""
    try:
        return KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            # Retries and batching for reliability
            retries=5,
            acks='all'
        )
    except Exception as e:
        print(f"❌ Failed to connect to Kafka: {e}")
        return None

def generate_mumbai_event():
    # Define 3 specific "Hubs" in Mumbai (Colaba, Bandra, Andheri)
    hubs = [
        (18.92, 72.83), # Colaba
        (19.05, 72.82), # Bandra
        (19.11, 72.86)  # Andheri
    ]
    
    # 70% of the time, pick a Hub and add a tiny bit of "noise" 
    # This creates the "Duplicate/Stacking" effect you asked for
    if random.random() < 0.7:
        center_lat, center_lon = random.choice(hubs)
        # Rounding to 3 decimal places forces riders into the same "Hexagon"
        lat = round(center_lat + random.uniform(-0.01, 0.01), 3)
        lon = round(center_lon + random.uniform(-0.01, 0.01), 3)
    else:
        # 30% of the time, stay completely random
        lat = round(random.uniform(18.90, 19.30), 3)
        lon = round(random.uniform(72.80, 72.95), 3)

    return {
        "timestamp": time.time(),
        "rider_id": f"rider_{random.randint(1, 1000)}",
        "latitude": lat,
        "longitude": lon,
        "demand_level": "normal"
    }

def run_producer():
    producer = get_producer()
    if not producer:
        return

    print(f"🚀 Producer Ignite: Streaming data to {TOPIC_NAME}...")
    
    try:
        while True:
            event_data = generate_mumbai_event()
            
            # Send data to Kafka
            producer.send(TOPIC_NAME, event_data)
            
            # Print to terminal for debugging
            print(f"📡 Event Sent: {event_data['rider_id']} at {event_data['latitude']:.4f}")
            
            # Speed: 5 pings per second (High throughput simulation)
            time.sleep(0.2) 
            
    except KeyboardInterrupt:
        print("\n🛑 Producer Stopped by User.")
    finally:
        producer.close()

if __name__ == "__main__":
    run_producer()