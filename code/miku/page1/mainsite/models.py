from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    nickname = models.CharField(max_length=50, default='', blank=True)
    avatar_data = models.TextField(default='', blank=True)  # base64 avatar image
    total_points = models.IntegerField(default=0)
    total_games = models.IntegerField(default=0)
    best_time = models.IntegerField(default=0)  # best completion time in seconds
    best_moves = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def best_time_display(self):
        if not self.best_time:
            return '—'
        m, s = divmod(self.best_time, 60)
        return f'{m:02d}:{s:02d}'

    def avg_moves(self):
        if not self.total_games:
            return '—'
        records = self.user.records.all()
        total = sum(r.moves for r in records)
        return round(total / len(records), 1)

    def __str__(self):
        return self.user.username


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
