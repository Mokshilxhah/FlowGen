from django.urls import path
from . import views

urlpatterns = [
    path('tasks/suggest-assignee', views.suggest_assignee),
    path('tasks/estimate-duration', views.estimate_duration),
    path('meetings/suggest-time', views.suggest_meeting_time),
    path('meetings/generate-agenda', views.generate_meeting_agenda),
    path('analytics/productivity-forecast', views.productivity_forecast),
]
