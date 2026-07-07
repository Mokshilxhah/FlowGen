from django.contrib import admin
from .models import ChatSession, ChatMessage


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_id', 'organization_id', 'created_at']
    list_filter = ['created_at', 'organization_id']
    search_fields = ['user_id', 'organization_id']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'role', 'intent', 'confidence', 'created_at']
    list_filter = ['role', 'intent', 'created_at']
    search_fields = ['content']
