from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', verbose_name='用户')
    nickname = models.CharField(max_length=50, blank=True, verbose_name='昵称')
    total_points = models.IntegerField(default=0, verbose_name='总积分')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='注册时间')

    class Meta:
        verbose_name = '用户信息'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.user.username} 的个人信息'


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance, nickname=instance.username)


class GameRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='records', verbose_name='用户')
    theme_id = models.CharField(max_length=50, verbose_name='主题ID')
    theme_name = models.CharField(max_length=100, verbose_name='主题名称')
    subtopic_id = models.CharField(max_length=50, verbose_name='子主题ID')
    subtopic_name = models.CharField(max_length=100, verbose_name='子主题名称')
    difficulty = models.IntegerField(verbose_name='难度')
    time_spent = models.IntegerField(verbose_name='用时')
    moves = models.IntegerField(verbose_name='步数')
    hints_used = models.IntegerField(default=0, verbose_name='提示次数')
    score = models.IntegerField(verbose_name='得分')
    completed_at = models.DateTimeField(auto_now_add=True, verbose_name='完成时间')

    class Meta:
        verbose_name = '游戏记录'
        verbose_name_plural = verbose_name
        ordering = ['-completed_at']

    def __str__(self):
        return f'{self.user.username} - {self.theme_name}·{self.subtopic_name} +{self.score}'


class EarnedReward(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='earned_rewards', verbose_name='用户')
    reward_id = models.CharField(max_length=50, verbose_name='徽章ID')
    reward_name = models.CharField(max_length=100, verbose_name='徽章名称')
    earned_at = models.DateTimeField(auto_now_add=True, verbose_name='获得时间')

    class Meta:
        verbose_name = '已获徽章'
        verbose_name_plural = verbose_name
        unique_together = ['user', 'reward_id']

    def __str__(self):
        return f'{self.user.username} - {self.reward_name}'
