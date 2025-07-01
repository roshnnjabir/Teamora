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