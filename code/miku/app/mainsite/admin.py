from django.contrib import admin
from .models import UserProfile, GameRecord, EarnedReward


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'nickname', 'total_points', 'created_at']
    search_fields = ['user__username', 'nickname']


@admin.register(GameRecord)
class GameRecordAdmin(admin.ModelAdmin):
    list_display = ['user', 'theme_name', 'subtopic_name', 'difficulty', 'score', 'completed_at']
    list_filter = ['difficulty', 'completed_at']
    search_fields = ['user__username', 'theme_name', 'subtopic_name']


@admin.register(EarnedReward)
class EarnedRewardAdmin(admin.ModelAdmin):
    list_display = ['user', 'reward_name', 'earned_at']
    search_fields = ['user__username', 'reward_name']
