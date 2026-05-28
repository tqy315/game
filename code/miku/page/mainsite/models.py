from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    nickname = models.CharField(max_length=50, default='', blank=True)
    total_points = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance, nickname=instance.username)


class GameRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='records')
    theme_id = models.CharField(max_length=50)
    theme_name = models.CharField(max_length=100)
    subtopic_id = models.CharField(max_length=50)
    subtopic_name = models.CharField(max_length=100)
    difficulty = models.IntegerField(default=3)
    time_spent = models.IntegerField(default=0)
    moves = models.IntegerField(default=0)
    hints_used = models.IntegerField(default=0)
    score = models.IntegerField(default=0)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-completed_at']


class EarnedReward(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='earned_rewards')
    reward_id = models.CharField(max_length=50)
    reward_name = models.CharField(max_length=100)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'reward_id']
