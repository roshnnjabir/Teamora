import redis
from django.conf import settings

redis_client = redis.Redis.from_url(settings.REDIS_URL)

def set_user_online(user_id):
    redis_client.set(f"user_status:{user_id}", "online")

def set_user_offline(user_id):
    redis_client.set(f"user_status:{user_id}", "offline")

def is_user_online(user_id):
    return redis_client.get(f"user_status:{user_id}") == b"online"