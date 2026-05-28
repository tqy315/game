import json
import os
from django.conf import settings
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from urllib.parse import quote
from .data import THEMES
from .models import GameRecord, UserProfile, CulturalKnowledge

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

    # Fetch cultural knowledge from database
    try:
        knowledge = CulturalKnowledge.objects.get(theme_name=theme['name'], item_name=item['name'])
        culture_title = knowledge.title
        culture_content = knowledge.content
    except CulturalKnowledge.DoesNotExist:
        culture_title = item['name']
        culture_content = item['desc']

    # Detect puzzle images
    image_data = {}
    static_base = os.path.join(settings.BASE_DIR, 'game', 'static', 'game', 'puzzle_images')

    for diff_label, diff_folder in [('3', '3×3'), ('4', '4×4')]:
        img_dir = os.path.join(static_base, diff_folder, theme['name'], item['name'])
        if os.path.isdir(img_dir):
            pieces = sorted([
                f for f in os.listdir(img_dir)
                if f.endswith('.jpg') and f.split('.')[0].isdigit()
            ], key=lambda x: int(x.split('.')[0]))
            expected = 9 if diff_label == '3' else 16
            if len(pieces) >= expected:
                url_prefix = f'/static/game/puzzle_images/{quote(diff_folder)}/{quote(theme["name"])}/{quote(item["name"])}'
                # Check for reference image (.jpeg, .png, or .jpg)
                ref_url = ''
                for ext in ['.jpeg', '.png', '.jpg']:
                    ref_name = f'{item["name"]}{ext}'
                    if os.path.exists(os.path.join(img_dir, ref_name)):
                        ref_url = f'{url_prefix}/{quote(ref_name)}'
                        break
                image_data[diff_label] = {
                    'urls': [f'{url_prefix}/{p}' for p in pieces[:expected]],
                    'reference_url': ref_url,
                }

    return render(request, 'game/puzzle.html', {
        'theme': theme,
        'item': item,
        'item_index': idx,
        'total_items': total_items,
        'prev_index': idx - 1 if idx > 0 else None,
        'next_index': idx + 1 if idx < total_items - 1 else None,
        'culture_title': culture_title,
        'culture_content': culture_content,
        'image_data': image_data,
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


# ========== 成就 ==========

@login_required
def achievements_page(request):
    records = request.user.game_records.all().order_by('theme_name', '-completed_at')

    # Group records by theme
    grouped = {}
    for r in records:
        if r.theme_name not in grouped:
            grouped[r.theme_name] = {
                'theme': None,
                'records': [],
            }
        grouped[r.theme_name]['records'].append(r)

    # Match themes and enrich records with cultural knowledge
    theme_items_map = {}
    for t in THEMES:
        theme_items_map[t['name']] = {}
        for item in t['items']:
            theme_items_map[t['name']][item['name']] = item

    for theme_name, group in grouped.items():
        # Find matching theme from THEMES
        for t in THEMES:
            if t['name'] == theme_name:
                group['theme'] = t
                break

        # Enrich each record with cultural knowledge
        for r in group['records']:
            try:
                knowledge = CulturalKnowledge.objects.get(
                    theme_name=theme_name, item_name=r.item_name
                )
                r.culture_title = knowledge.title
                r.culture_content = knowledge.content
            except CulturalKnowledge.DoesNotExist:
                item_info = theme_items_map.get(theme_name, {}).get(r.item_name, {})
                r.culture_title = item_info.get('name', r.item_name)
                r.culture_content = item_info.get('desc', '')

    # Sort groups by number of records (most completed first)
    sorted_groups = sorted(
        grouped.items(),
        key=lambda x: len(x[1]['records']),
        reverse=True,
    )

    return render(request, 'game/achievements.html', {
        'grouped_achievements': sorted_groups,
        'total_count': records.count(),
    })


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


@csrf_exempt
@require_POST
def get_hint_api(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'ok': False, 'error': '数据格式错误'})

    state_1d = data.get('state', [])
    size = int(data.get('size', 3))

    if size not in (3, 4):
        return JsonResponse({'ok': False, 'error': '无效的尺寸'})

    # Convert 1D state to 2D board for klotski
    board = []
    for i in range(size):
        row = []
        for j in range(size):
            row.append(int(state_1d[i * size + j]))
        board.append(row)

    # Call klotski A* solver
    if size == 3:
        from . import klotski3
        hint_num = klotski3.get_hint(board)
    else:
        from . import klotski4
        hint_num = klotski4.get_hint(board)

    if hint_num is None:
        return JsonResponse({'ok': False, 'error': '无法计算提示'})

    # Find the index of hint_num in the 1D state
    try:
        hint_index = state_1d.index(hint_num)
    except ValueError:
        return JsonResponse({'ok': False, 'error': '提示数字不在状态中'})

    return JsonResponse({
        'ok': True,
        'hint_num': hint_num,
        'hint_index': hint_index,
    })
