from django.db import models


class GameRecord(models.Model):
    theme_id = models.CharField(max_length=50, verbose_name="主题ID")
    theme_name = models.CharField(max_length=100, verbose_name="主题名称")
    difficulty = models.IntegerField(verbose_name="难度")
    time_seconds = models.IntegerField(verbose_name="用时(秒)")
    moves = models.IntegerField(verbose_name="步数")
    hints_used = models.IntegerField(default=0, verbose_name="提示次数")
    score = models.IntegerField(verbose_name="得分")
    culture_title = models.CharField(max_length=200, blank=True, default="", verbose_name="文化标题")
    culture_content = models.TextField(blank=True, default="", verbose_name="文化内容")
    completed_at = models.DateTimeField(auto_now_add=True, verbose_name="完成时间")

    class Meta:
        ordering = ["-completed_at"]
        verbose_name = "游戏记录"
        verbose_name_plural = "游戏记录"

    def __str__(self):
        return f"{self.theme_name} {self.difficulty}×{self.difficulty} — {self.score}分"

    @property
    def formatted_time(self):
        m, s = divmod(self.time_seconds, 60)
        return f"{m:02d}:{s:02d}"
