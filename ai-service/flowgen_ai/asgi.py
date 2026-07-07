import os
from django.core.asgi import get_asgi_application
from fastapi import FastAPI
from fastapi.middleware.wsgi import WSGIMiddleware

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flowgen_ai.settings')

django_app = get_asgi_application()
fastapi_app = FastAPI()

@fastapi_app.get("/fastapi-health")
async def health():
    return {"status": "ok", "service": "FastAPI AI"}

# In a real hybrid setup, we'd mount FastAPI apps or use it for specific high-perf routes
# For now, we'll proxy everything to Django application
application = django_app
