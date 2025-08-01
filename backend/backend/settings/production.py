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

DEBUG = env.bool("DEBUG", default=False)

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[
    ".teamora.website",
])

CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[
    "https://*.teamora.website",
])

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[
    "https://teamora.website",
    "https://www.teamora.website",
])

CORS_ALLOWED_ORIGIN_REGEXES = env.list("CORS_ALLOWED_ORIGIN_REGEXES", default=[
    r"^https:\/\/([a-z0-9-]+\.)?teamora\.website$",
])

SECURE_SSL_REDIRECT = True                # forces all http to https
SESSION_COOKIE_SECURE = True            
CSRF_COOKIE_SECURE = True

SECURE_HSTS_SECONDS = 31536000            # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True     # (HSTS): tells browsers “always use HTTPS for this domain for X seconds.”
SECURE_HSTS_PRELOAD = True                # allows your domain to be hard-coded into Chrome/Firefox preload lists.

SESSION_COOKIE_SAMESITE = "Lax"           # default case
CSRF_COOKIE_SAMESITE = "Lax"

X_FRAME_OPTIONS = "DENY"                  # prevent clickjacking
SECURE_CONTENT_TYPE_NOSNIFF = True        # block MIME sniffing
SECURE_REFERRER_POLICY = "same-origin"    # hide tenant URLs when leaving site

CSRF_COOKIE_HTTPONLY = True               # Makes CSRF cookie unreadable by JavaScript.

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

SESSION_COOKIE_DOMAIN = ".teamora.website"
CSRF_COOKIE_DOMAIN = ".teamora.website"

SIMPLE_JWT.update({
    "AUTH_COOKIE": "access_token",        # name of access cookie
    "AUTH_COOKIE_REFRESH": "refresh_token",
    "AUTH_COOKIE_SECURE": True,
    "AUTH_COOKIE_HTTP_ONLY": True,
    "AUTH_COOKIE_PATH": "/",
    "AUTH_COOKIE_SAMESITE": "None",       # to allow subdomains
})

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
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

REDIS_URL = env("REDIS_URL")

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [REDIS_URL],
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