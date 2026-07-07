from django.contrib import admin
from django.urls import path, include
from ai_chat.views import health_check

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health', health_check, name='health'),
    path('api/ai/chat/', include('ai_chat.urls')),
    path('api/ai/', include('analytics_ml.urls')),
]

