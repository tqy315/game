from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST
import json

from .forms import LoginForm, RegisterForm, ProfileForm
from .models import UserProfile, GameRecord, EarnedReward
from .data import REWARDS


def index(request):
    """首页重定向"""
    if request.user.is_authenticated:
        return redirect('menu')
    return redirect('login')


def user_login(request):
    """用户登录"""
    if request.user.is_authenticated:
        return redirect('menu')

    form = LoginForm()
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect('menu')
            else:
                messages.error(request, '用户名或密码错误，请重试。')
    return render(request, 'mainsite/login.html', {'form': form})


def user_register(request):
    """用户注册"""
    if request.user.is_authenticated:
        return redirect('menu')

    form = RegisterForm()
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password'])
            user.save()
            # 设置初始昵称
            user.profile.nickname = user.username
            user.profile.save()
            login(request, user)
            messages.success(request, f'欢迎加入国风华容道，{user.username}！')
            return redirect('menu')
    return render(request, 'mainsite/register.html', {'form': form})


def user_logout(request):
    """退出登录"""
    logout(request)
    return redirect('login')


@login_required
def menu(request):
    """主菜单"""
    profile = request.user.profile
    earned_ids = list(EarnedReward.objects.filter(
        user=request.user
    ).values_list('reward_id', flat=True))

    context = {
        'profile': profile,
        'earned_reward_ids': earned_ids,
        'total_points': profile.total_points,
    }
    return render(request, 'mainsite/menu.html', context)


@login_required
def subtopic(request):
    """子主题选择页面"""
    return render(request, 'mainsite/subtopic.html')


@login_required
def game(request):
    """游戏页面"""
    return render(request, 'mainsite/game.html')


@login_required
def complete(request):
    """完成页面"""
    return render(request, 'mainsite/complete.html')


@login_required
def history(request):
    """历史记录"""
    records = GameRecord.objects.filter(user=request.user).order_by('-completed_at')[:50]
    return render(request, 'mainsite/history.html', {'records': records})


@login_required
def settings_view(request):
    """设置"""
    return render(request, 'mainsite/settings.html')


@login_required
def profile(request):
    """个人信息"""
    profile_obj = request.user.profile
    total_completed = GameRecord.objects.filter(user=request.user).count()
    earned_rewards = EarnedReward.objects.filter(user=request.user)

    if request.method == 'POST':
        form = ProfileForm(request.POST, instance=profile_obj)
        if form.is_valid():
            form.save()

    form = ProfileForm(instance=profile_obj)

    context = {
        'profile': profile_obj,
        'form': form,
        'total_completed': total_completed,
        'earned_rewards': earned_rewards,
    }
    return render(request, 'mainsite/profile.html', context)


@login_required
@require_POST
def save_record(request):
    """保存游戏记录（AJAX）"""
    try:
        data = json.loads(request.body)
        record = GameRecord.objects.create(
            user=request.user,
            theme_id=data.get('theme_id', ''),
            theme_name=data.get('theme_name', ''),
            subtopic_id=data.get('subtopic_id', ''),
            subtopic_name=data.get('subtopic_name', ''),
            difficulty=data.get('difficulty', 3),
            time_spent=data.get('time_spent', 0),
            moves=data.get('moves', 0),
            hints_used=data.get('hints_used', 0),
            score=data.get('score', 0),
        )

        # 更新积分
        profile_obj = request.user.profile
        profile_obj.total_points += record.score
        profile_obj.save()

        # 检查徽章
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
    """获取用户进度"""
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
