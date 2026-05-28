from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    nickname = models.CharField(max_length=50, blank=True, verbose_name='昵称')
    avatar = models.CharField(max_length=10, default='🧩', verbose_name='头像')
    points = models.IntegerField(default=0, verbose_name='积分')
    sound_enabled = models.BooleanField(default=True, verbose_name='音效')
    animation_enabled = models.BooleanField(default=True, verbose_name='动画')
    highlight_enabled = models.BooleanField(default=True, verbose_name='高亮提示')

    def __str__(self):
        return f'{self.nickname or self.user.username} - {self.points}分'


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance, nickname=instance.username)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()


class CulturalKnowledge(models.Model):
    theme_name = models.CharField(max_length=100, verbose_name='主题名称')
    item_name = models.CharField(max_length=100, verbose_name='条目名称')
    title = models.CharField(max_length=200, verbose_name='展示标题')
    content = models.TextField(verbose_name='文化介绍')

    class Meta:
        unique_together = ['theme_name', 'item_name']
        verbose_name = '文化知识'
        verbose_name_plural = '文化知识'

    def __str__(self):
        return f'{self.theme_name} - {self.item_name}'


class GameRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='game_records', null=True, blank=True)
    theme_id = models.CharField(max_length=50)
    theme_name = models.CharField(max_length=100)
    item_name = models.CharField(max_length=100)
    difficulty = models.CharField(max_length=20)
    time_seconds = models.IntegerField()
    moves = models.IntegerField()
    hints_used = models.IntegerField(default=0)
    points_earned = models.IntegerField(default=0)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-completed_at']

    @property
    def formatted_time(self):
        m = self.time_seconds // 60
        s = self.time_seconds % 60
        return f'{m:02d}:{s:02d}'
