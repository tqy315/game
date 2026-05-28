from django.contrib import admin
from .models import UserProfile, GameRecord, EarnedReward

admin.site.register(UserProfile)
admin.site.register(GameRecord)
admin.site.register(EarnedReward)
