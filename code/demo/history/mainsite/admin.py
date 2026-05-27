from django.contrib import admin
from .models import GameRecord


@admin.register(GameRecord)
class GameRecordAdmin(admin.ModelAdmin):
    list_display = ["theme_name", "difficulty", "score", "moves", "time_seconds", "completed_at"]
    list_filter = ["theme_name", "difficulty"]
    search_fields = ["theme_name"]
