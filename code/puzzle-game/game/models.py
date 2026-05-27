from django.db import models

class PuzzleLevel(models.Model):
    level = models.IntegerField(unique=True)

    def __str__(self):
        return f"第{self.level}关"