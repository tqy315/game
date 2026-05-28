from django.contrib import admin
from .models import GameRecord


@admin.register(GameRecord)
class GameRecordAdmin(admin.ModelAdmin):
    list_display = ['theme_name', 'item_name', 'difficulty', 'time_seconds', 'moves', 'completed_at']
    list_filter = ['theme_name', 'difficulty']
    search_fields = ['theme_name', 'item_name']
