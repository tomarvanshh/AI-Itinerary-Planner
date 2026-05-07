import redis
import json
import os

class RedisClient:
    def __init__(self):
        try:
            self.client = redis.Redis(
                host=os.getenv("REDIS_HOST", "localhost"),
                port=int(os.getenv("REDIS_PORT", 6379)),
                decode_responses=True
            )
            # Test connection
            self.client.ping()
            print("✅ Redis connected")
        except Exception as e:
            print("⚠️ Redis connection failed:", e)
            self.client = None

    def get(self, key):
        if not self.client:
            return None
        try:
            data = self.client.get(key)
            if data:
                print(f"⚡ CACHE HIT: {key}")
                return json.loads(data)
            print(f"❌ CACHE MISS: {key}")
            return None
        except Exception as e:
            print("Redis GET error:", e)
            return None

    def set(self, key, value, ttl):
        if not self.client:
            return
        try:
            self.client.setex(
                key,
                ttl,
                json.dumps(value)
            )
        except Exception as e:
            print("Redis SET error:", e)


# Singleton instance
redis_client = RedisClient()