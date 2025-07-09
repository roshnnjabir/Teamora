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

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[
    "https://chronocrust.shop",
    "https://teamora.vercel.app",
])

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https:\/\/([a-z0-9-]+\.)?chronocrust\.shop$",
    r"^https:\/\/([a-z0-9-]+\.)?teamora\.vercel\.app$",
]

print("PRODUCTION")