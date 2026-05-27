from django.shortcuts import render
from .models import PuzzleLevel

def puzzle_game(request, level=1):
    # 自动创建关卡
    PuzzleLevel.objects.get_or_create(level=level)

    # 自动加载 0-8 图片
    imgs = []
    for i in range(9):
        imgs.append(f"/static/puzzle/level_{level}/{i}.png")

    return render(request, "home.html", {
        "imgs": imgs,
        "level": level
    })