from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.db.models import Sum, Min, Count, Q
import json, random
from datetime import date

from .forms import LoginForm, RegisterForm, ProfileForm, PasswordChangeForm
from .models import UserProfile, GameRecord, EarnedReward
from .data import REWARDS, THEMES


def index(request):
    if request.user.is_authenticated:
        return redirect('menu')
    return redirect('login')


# ===== 认证 =====

def user_login(request):
    if request.user.is_authenticated:
        return redirect('menu')
    form = LoginForm()
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            user = authenticate(
                request,
                username=form.cleaned_data['username'],
                password=form.cleaned_data['password']
            )
            if user is not None:
                login(request, user)
                return redirect('menu')
            else:
                messages.error(request, '用户名或密码错误，请重试。')
    return render(request, 'mainsite/login.html', {'form': form})


def user_register(request):
    if request.user.is_authenticated:
        return redirect('menu')
    form = RegisterForm()
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password'])
            user.save()
            user.profile.nickname = user.username
            user.profile.save()
            login(request, user)
            messages.success(request, f'欢迎加入国风华容道，{user.username}！')
            return redirect('menu')
    return render(request, 'mainsite/register.html', {'form': form})


def user_logout(request):
    logout(request)
    return redirect('login')


# ===== 主页面 =====

@login_required
def menu(request):
    profile = request.user.profile
    earned_ids = list(EarnedReward.objects.filter(
        user=request.user
    ).values_list('reward_id', flat=True))

    # 计算各主题完成进度
    records = GameRecord.objects.filter(user=request.user)
    completed_ids = set(records.values_list('subtopic_id', flat=True))
    theme_progress = []
    for t in THEMES:
        done = sum(1 for s in t['subTopics'] if s['id'] in completed_ids)
        theme_progress.append({
            'id': t['id'],
            'name': t['name'],
            'done': done,
            'total': len(t['subTopics']),
            'percent': round(done / len(t['subTopics']) * 100) if t['subTopics'] else 0,
        })

    # 每日挑战种子
    today = date.today()
    seed = today.year * 10000 + today.month * 100 + today.day

    return render(request, 'mainsite/menu.html', {
        'profile': profile,
        'earned_reward_ids': earned_ids,
        'total_points': profile.total_points,
        'theme_progress': theme_progress,
        'daily_seed': seed,
    })


@login_required
def subtopic(request):
    return render(request, 'mainsite/subtopic.html')


@login_required
def game(request):
    return render(request, 'mainsite/game.html')


@login_required
def complete(request):
    return render(request, 'mainsite/complete.html')


# ===== 记录与积分 =====

@login_required
@require_POST
def save_record(request):
    try:
        data = json.loads(request.body)
        time_spent = data.get('time_spent', 0)
        moves = data.get('moves', 0)
        score = data.get('score', 0)

        record = GameRecord.objects.create(
            user=request.user,
            theme_id=data.get('theme_id', ''),
            theme_name=data.get('theme_name', ''),
            subtopic_id=data.get('subtopic_id', ''),
            subtopic_name=data.get('subtopic_name', ''),
            difficulty=data.get('difficulty', 3),
            time_spent=time_spent,
            moves=moves,
            hints_used=data.get('hints_used', 0),
            score=score,
        )

        profile_obj = request.user.profile
        profile_obj.total_points += score
        profile_obj.total_games += 1

        # 更新最佳记录
        if profile_obj.best_time == 0 or (time_spent > 0 and time_spent < profile_obj.best_time):
            profile_obj.best_time = time_spent
        if profile_obj.best_moves == 0 or (moves > 0 and moves < profile_obj.best_moves):
            profile_obj.best_moves = moves

        profile_obj.save()

        # 检查成就
        new_badges = []
        for r in REWARDS:
            if profile_obj.total_points >= r['points']:
                _, created = EarnedReward.objects.get_or_create(
                    user=request.user,
                    reward_id=r['id'],
                    defaults={'reward_name': r['name']}
                )
                if created:
                    new_badges.append(r['name'])

        return JsonResponse({
            'ok': True,
            'total_points': profile_obj.total_points,
            'new_badges': new_badges,
        })
    except Exception as e:
        return JsonResponse({'ok': False, 'error': str(e)})


@login_required
def get_progress(request):
    records = GameRecord.objects.filter(user=request.user)
    completed_subtopics = list(records.values_list('subtopic_id', flat=True))
    earned_ids = list(EarnedReward.objects.filter(
        user=request.user
    ).values_list('reward_id', flat=True))
    return JsonResponse({
        'completed_subtopics': completed_subtopics,
        'total_points': request.user.profile.total_points,
        'earned_reward_ids': earned_ids,
    })


# ===== 排行榜 =====

@login_required
def leaderboard(request):
    top_players = UserProfile.objects.select_related('user').order_by('-total_points')[:30]
    my_rank = UserProfile.objects.filter(total_points__gt=request.user.profile.total_points).count() + 1
    return render(request, 'mainsite/leaderboard.html', {
        'top_players': top_players,
        'my_rank': my_rank,
        'my_profile': request.user.profile,
    })


# ===== 个人信息 =====

@login_required
def profile(request):
    profile_obj = request.user.profile
    total_completed = GameRecord.objects.filter(user=request.user).count()
    earned_rewards = EarnedReward.objects.filter(user=request.user)

    if request.method == 'POST':
        if 'avatar_data' in request.POST:
            # 头像更新
            profile_obj.avatar_data = request.POST['avatar_data']
            profile_obj.save()
            messages.success(request, '头像已更新！')
        elif 'nickname' in request.POST:
            form = ProfileForm(request.POST, instance=profile_obj)
            if form.is_valid():
                form.save()
                messages.success(request, '昵称已更新！')
        return redirect('profile')

    form = ProfileForm(instance=profile_obj)

    # 统计数据
    records = GameRecord.objects.filter(user=request.user)
    best_3 = records.filter(difficulty=3).aggregate(best=Min('time_spent'))['best']
    best_4 = records.filter(difficulty=4).aggregate(best=Min('time_spent'))['best']

    def fmt_time(t):
        if not t:
            return '—'
        m, s = divmod(t, 60)
        return f'{m:02d}:{s:02d}'

    return render(request, 'mainsite/profile.html', {
        'profile': profile_obj,
        'form': form,
        'total_completed': total_completed,
        'earned_rewards': earned_rewards,
        'best_3_time': fmt_time(best_3),
        'best_4_time': fmt_time(best_4),
    })


# ===== 设置（含密码修改） =====

@login_required
def settings_view(request):
    pw_form = PasswordChangeForm()
    if request.method == 'POST':
        pw_form = PasswordChangeForm(request.POST)
        if pw_form.is_valid():
            user = request.user
            if user.check_password(pw_form.cleaned_data['old_password']):
                user.set_password(pw_form.cleaned_data['new_password'])
                user.save()
                update_session_auth_hash(request, user)
                messages.success(request, '密码修改成功！')
                return redirect('settings')
            else:
                messages.error(request, '当前密码不正确。')
    return render(request, 'mainsite/settings.html', {'pw_form': pw_form})


# ===== 历史记录 =====

@login_required
def history(request):
    base = GameRecord.objects.filter(user=request.user)
    records = base.order_by('-completed_at')[:60]

    # 统计数据
    total = base.count()
    total_3 = base.filter(difficulty=3).count()
    total_4 = base.filter(difficulty=4).count()

    return render(request, 'mainsite/history.html', {
        'records': records,
        'total': total,
        'total_3': total_3,
        'total_4': total_4,
    })


# ===== 每日挑战 =====

@login_required
def daily_challenge(request):
    today_seed = date.today().year * 10000 + date.today().month * 100 + date.today().day
    random.seed(today_seed)

    theme = random.choice(THEMES)
    subtopic = random.choice(theme['subTopics'])
    difficulty = random.choice([3, 4])

    return render(request, 'mainsite/daily.html', {
        'theme': theme,
        'subtopic': subtopic,
        'difficulty': difficulty,
        'today': date.today(),
    })
