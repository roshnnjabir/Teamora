from .base import *

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
]

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

print("LOCAL")
