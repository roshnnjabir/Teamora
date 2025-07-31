from .base import *

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=['localhost'])

DATABASES = {
    "default": {
        "ENGINE": env("POSTGRES_DB_ENGINE"),
        "NAME": env("POSTGRES_DB"),
        "USER": env("POSTGRES_USER"),
        "PASSWORD": env("POSTGRES_PASSWORD"),
        "HOST": env("POSTGRES_HOST", default="db"),
        "PORT": env("POSTGRES_PORT", default="5432"),
    }
}

DEBUG = env.bool("DEBUG", default=True)

CSRF_TRUSTED_ORIGINS = [f"https://{host}" for host in ALLOWED_HOSTS]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://bigco.localhost:5173",
    "http://acme.localhost:5173",
    "http://brototype.localhost:5173",
    "http://britco.localhost:5173",
    "http://luminar.localhost:5173",
    "http://openai.localhost:5173",
    "http://microsoft.localhost:5173",
    "http://greenpeace.localhost:5173",
    "http://singlebridge.localhost:5173",
    "http://amazon.localhost:5173",
    "http://flipkart.localhost:5173",
    "http://iphone.localhost:5173",
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
]

SESSION_COOKIE_DOMAIN = ".localhost"
CSRF_COOKIE_DOMAIN = ".localhost"

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,  # important for Celery to log
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',  # or 'DEBUG' if needed
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'celery': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

SESSION_COOKIE_SAMESITE = None
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SAMESITE = "None"
CSRF_COOKIE_SECURE = False

SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header',
            'description': 'JWT Authorization header using the Bearer scheme. Example: "Bearer <your token>"',
        }
    },
    'USE_SESSION_AUTH': False,
}

REDIS_URL = env("REDIS_URL", default="redis://redis:6379")

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [REDIS_URL],
        },
    },
}

print("LOCAL")
