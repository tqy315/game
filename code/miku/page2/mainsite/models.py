from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    nickname = models.CharField(max_length=50, default='', blank=True)
    avatar_data = models.TextField(default='', blank=True)
    total_points = models.IntegerField(default=0)
    total_games = models.IntegerField(default=0)
    best_time = models.IntegerField(default=0)
    best_moves = models.IntegerField(default=0)

    def __str__(self):
        return self.nickname or self.user.username


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance, nickname=instance.username)


class GameRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='records')
    theme_id = models.CharField(max_length=50)
    theme_name = models.CharField(max_length=50)
    subtopic_id = models.CharField(max_length=50)
    subtopic_name = models.CharField(max_length=50)
    difficulty = models.IntegerField()
    time_spent = models.IntegerField()
    moves = models.IntegerField()
    hints_used = models.IntegerField(default=0)
    score = models.IntegerField()
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-completed_at']


class EarnedReward(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='earned_rewards')
    reward_id = models.CharField(max_length=50)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'reward_id']
