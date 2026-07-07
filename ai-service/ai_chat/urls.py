from django.urls import path
from . import views

urlpatterns = [
    path('message', views.chat_message, name='chat_message'),
    path('history/<int:session_id>', views.chat_history, name='chat_history'),
]
