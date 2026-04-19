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
    """Generates a realistic delivery rider ping within Mumbai bounds."""
    # Approximate Mumbai Coordinates
    lat_min, lat_max = 18.90, 19.30
    lon_min, lon_max = 72.80, 72.95
    
    return {
        "timestamp": time.time(),
        "rider_id": f"rider_{random.randint(1, 1000)}",
        "latitude": random.uniform(lat_min, lat_max),
        "longitude": random.uniform(lon_min, lon_max),
        "order_value": round(random.uniform(100, 2500), 2),
        "status": random.choice(["active", "delivering", "idle"])
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