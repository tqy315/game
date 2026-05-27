import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .data import THEMES
from .models import GameRecord, UserProfile

POINTS_PER_PUZZLE = {
    '3': 100,
    '4': 200,
}


def index(request):
    return render(request, 'game/index.html', {'themes': THEMES})


def theme_detail(request, theme_id):
    theme = None
    for t in THEMES:
        if t['id'] == theme_id:
            theme = t
            break
    if theme is None:
        return render(request, 'game/index.html', {'themes': THEMES, 'error': '未找到该主题'})
    return render(request, 'game/theme_detail.html', {'theme': theme, 'themes': THEMES})


def puzzle(request, theme_id, item_index):
    theme = None
    for t in THEMES:
        if t['id'] == theme_id:
            theme = t
            break
    if theme is None:
        return render(request, 'game/index.html', {'themes': THEMES, 'error': '未找到该主题'})

    try:
        idx = int(item_index)
    except (ValueError, TypeError):
        idx = 0
    if idx < 0 or idx >= len(theme['items']):
        idx = 0

    item = theme['items'][idx]
    total_items = len(theme['items'])

    return render(request, 'game/puzzle.html', {
        'theme': theme,
        'item': item,
        'item_index': idx,
        'total_items': total_items,
        'prev_index': idx - 1 if idx > 0 else None,
        'next_index': idx + 1 if idx < total_items - 1 else None,
    })


# ========== 用户认证 ==========

def register_page(request):
    if request.user.is_authenticated:
        return redirect('index')
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '').strip()
        password2 = request.POST.get('password2', '').strip()
        nickname = request.POST.get('nickname', '').strip()

        if not username or not password:
            messages.error(request, '用户名和密码不能为空')
        elif password != password2:
            messages.error(request, '两次输入的密码不一致')
        elif User.objects.filter(username=username).exists():
            messages.error(request, '用户名已存在')
        elif len(password) < 4:
            messages.error(request, '密码长度至少4位')
        else:
            user = User.objects.create_user(username=username, password=password)
            user.profile.nickname = nickname or username
            user.profile.save()
            login(request, user)
            messages.success(request, f'欢迎加入，{user.profile.nickname}！')
            return redirect('index')

    return render(request, 'game/register.html')


def login_page(request):
    if request.user.is_authenticated:
        return redirect('index')
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, f'欢迎回来，{user.profile.nickname}！')
            next_url = request.GET.get('next', 'index')
            return redirect(next_url)
        else:
            messages.error(request, '用户名或密码错误')
    return render(request, 'game/login.html')


def logout_page(request):
    logout(request)
    messages.success(request, '已退出登录')
    return redirect('index')


# ========== 历史记录 ==========

@login_required
def history_page(request):
    records = request.user.game_records.all()[:50]
    return render(request, 'game/history.html', {'records': records})


# ========== 设置 ==========

AVATAR_OPTIONS = ['🧩', '🐉', '🏯', '🏮', '🎭', '🏺', '⛰️', '👘', '🐼', '🌸', '⭐', '🎋', '🦊', '🐲', '🌙', '☀️']

SETTING_LABELS = {
    'sound_enabled': '音效',
    'animation_enabled': '动画',
    'highlight_enabled': '高亮提示',
}


@login_required
def settings_page(request):
    profile = request.user.profile
    if request.method == 'POST':
        action = request.POST.get('action', '')

        if action == 'update_profile':
            nickname = request.POST.get('nickname', '').strip()
            avatar = request.POST.get('avatar', '').strip()
            if nickname:
                profile.nickname = nickname
            if avatar and avatar in AVATAR_OPTIONS:
                profile.avatar = avatar
            profile.save()
            messages.success(request, '个人资料已更新')

        elif action == 'update_settings':
            profile.sound_enabled = request.POST.get('sound_enabled') == 'on'
            profile.animation_enabled = request.POST.get('animation_enabled') == 'on'
            profile.highlight_enabled = request.POST.get('highlight_enabled') == 'on'
            profile.save()
            messages.success(request, '设置已保存')

        elif action == 'reset_data':
            request.user.game_records.all().delete()
            profile.points = 0
            profile.save()
            messages.success(request, '数据已重置')

        return redirect('settings')

    return render(request, 'game/settings.html', {
        'profile': profile,
        'avatar_options': AVATAR_OPTIONS,
        'setting_labels': SETTING_LABELS,
    })


# ========== API ==========

@csrf_exempt
@require_POST
def save_result(request):
    if not request.user.is_authenticated:
        return JsonResponse({'ok': False, 'error': '请先登录'})

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'ok': False, 'error': '数据格式错误'})

    theme_id = data.get('theme_id', '')
    theme_name = data.get('theme_name', '')
    item_name = data.get('item_name', '')
    difficulty = data.get('difficulty', '3')
    time_seconds = data.get('time_seconds', 0)
    moves = data.get('moves', 0)
    hints_used = data.get('hints_used', 0)

    base_points = POINTS_PER_PUZZLE.get(difficulty, 100)
    # Bonus: faster time, fewer moves, no hints
    time_bonus = max(0, 30 - time_seconds) * 2 if difficulty == '3' else max(0, 60 - time_seconds)
    hint_penalty = hints_used * 20
    points_earned = max(10, base_points + time_bonus - hint_penalty)

    GameRecord.objects.create(
        user=request.user,
        theme_id=theme_id,
        theme_name=theme_name,
        item_name=item_name,
        difficulty=f'{difficulty}×{difficulty}',
        time_seconds=time_seconds,
        moves=moves,
        hints_used=hints_used,
        points_earned=points_earned,
    )

    profile = request.user.profile
    profile.points += points_earned
    profile.save()

    return JsonResponse({
        'ok': True,
        'points_earned': points_earned,
        'total_points': profile.points,
    })
