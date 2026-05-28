import json
import random
from datetime import date

from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseRedirect
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import ensure_csrf_cookie

from .forms import LoginForm, RegisterForm, ProfileForm, PasswordChangeForm
from .models import GameRecord, EarnedReward

# ——— theme data ———
THEMES = [
    {
        'id': 'architecture', 'name': '传统建筑', 'icon': '🏯',
        'shortDesc': '华夏建筑 · 匠心营造',
        'subTopics': [
            {'id': 'potala-palace', 'name': '布达拉宫', 'icon': '🏰', 'desc': '西藏拉萨，世界屋脊上的宫殿'},
            {'id': 'stilted-house', 'name': '吊脚楼', 'icon': '🏚️', 'desc': '苗族传统民居，依山而建'},
            {'id': 'taihe-dian', 'name': '故宫太和殿', 'icon': '👑', 'desc': '紫禁城最高大的建筑，俗称金銮殿'},
            {'id': 'jiangnan-watertown', 'name': '江南水乡', 'icon': '🛶', 'desc': '小桥流水人家，江南古镇'},
            {'id': 'suzhou-garden', 'name': '苏州园林', 'icon': '🌿', 'desc': '咫尺之内再造乾坤'},
            {'id': 'tiantan', 'name': '天坛祈年殿', 'icon': '🙏', 'desc': '明清皇帝祭天的场所'},
            {'id': 'tulou', 'name': '土楼', 'icon': '🟤', 'desc': '福建客家圆形土堡式建筑'},
            {'id': 'summer-palace', 'name': '颐和园', 'icon': '⛲', 'desc': '中国现存最大的皇家园林'},
            {'id': 'great-wall', 'name': '长城', 'icon': '🧱', 'desc': '万里长城，世界七大奇迹之一'},
        ]
    },
    {
        'id': 'festival', 'name': '传统节日与民俗', 'icon': '🏮',
        'shortDesc': '岁时节庆 · 民俗风情',
        'subTopics': [
            {'id': 'spring-festival', 'name': '春节', 'icon': '🧧', 'desc': '农历新年，最隆重的传统佳节'},
            {'id': 'dragon-boat', 'name': '端午节', 'icon': '🐉', 'desc': '五月初五赛龙舟、吃粽子'},
            {'id': 'temple-fair', 'name': '逛庙会', 'icon': '🎪', 'desc': '热闹非凡的民俗盛会'},
            {'id': 'torch-festival', 'name': '火把节', 'icon': '🔥', 'desc': '彝族庆祝丰收的传统节日'},
            {'id': 'water-festival', 'name': '泼水节', 'icon': '💦', 'desc': '傣族新年，泼水送祝福'},
            {'id': 'dragon-lion', 'name': '舞龙舞狮', 'icon': '🦁', 'desc': '驱邪迎祥的传统表演'},
            {'id': 'lantern-festival', 'name': '元宵节', 'icon': '🏮', 'desc': '正月十五赏花灯吃元宵'},
            {'id': 'mid-autumn', 'name': '中秋节', 'icon': '🌕', 'desc': '赏月吃月饼，阖家团圆'},
            {'id': 'double-ninth', 'name': '重阳节', 'icon': '🌺', 'desc': '登高望远、赏菊敬老'},
        ]
    },
    {
        'id': 'art-opera', 'name': '传统艺术与戏曲', 'icon': '🎭',
        'shortDesc': '梨园春秋 · 艺韵流芳',
        'subTopics': [
            {'id': 'face-changing', 'name': '川剧变脸', 'icon': '🎭', 'desc': '瞬息之间变换多张脸谱'},
            {'id': 'dunhuang-art', 'name': '敦煌壁画', 'icon': '🎨', 'desc': '莫高窟飞天与佛教艺术'},
            {'id': 'erhu', 'name': '二胡', 'icon': '🎻', 'desc': '音色悠扬婉转如泣如诉'},
            {'id': 'flower-bird', 'name': '工笔花鸟画', 'icon': '🌸', 'desc': '精细描绘花鸟虫鱼'},
            {'id': 'guzheng', 'name': '古筝', 'icon': '🎶', 'desc': '余音绕梁音色清越'},
            {'id': 'huangmei', 'name': '黄梅戏', 'icon': '🎵', 'desc': '安徽地方戏曲'},
            {'id': 'beijing-opera', 'name': '京剧', 'icon': '🎪', 'desc': '国粹京剧，唱念做打'},
            {'id': 'kunqu', 'name': '昆曲', 'icon': '🎼', 'desc': '百戏之祖'},
            {'id': 'pipa', 'name': '琵琶', 'icon': '🪕', 'desc': '大珠小珠落玉盘'},
            {'id': 'landscape', 'name': '山水画', 'icon': '🏔️', 'desc': '意境悠远笔墨生韵'},
            {'id': 'yue-opera', 'name': '粤剧', 'icon': '🎤', 'desc': '粤语演唱的地方戏曲瑰宝'},
        ]
    },
    {
        'id': 'intangible', 'name': '非遗与传统工艺', 'icon': '🏺',
        'shortDesc': '匠心传承 · 巧夺天工',
        'subTopics': [
            {'id': 'embroidery', 'name': '刺绣', 'icon': '🧵', 'desc': '以针为笔以线为墨'},
            {'id': 'paper-cut', 'name': '剪纸', 'icon': '✂️', 'desc': '红纸剪出吉祥如意的图案'},
            {'id': 'facial-mask', 'name': '脸谱', 'icon': '👺', 'desc': '色彩与图案展现人物性格'},
            {'id': 'shadow-play', 'name': '皮影', 'icon': '🎬', 'desc': '光影中的古老戏剧艺术'},
            {'id': 'blue-porcelain', 'name': '青花瓷', 'icon': '🫖', 'desc': '白釉青花，中国瓷器经典'},
            {'id': 'bronze-ware', 'name': '青铜器', 'icon': '🔔', 'desc': '夏商周青铜礼器'},
            {'id': 'tang-sancai', 'name': '唐三彩', 'icon': '🏺', 'desc': '唐代三彩釉陶器'},
            {'id': 'sugar-painting', 'name': '糖画', 'icon': '🍭', 'desc': '以糖为墨的民间手工艺'},
        ]
    },
    {
        'id': 'mythology', 'name': '神话传说与历史故事', 'icon': '🐉',
        'shortDesc': '神话传说 · 历史典故',
        'subTopics': [
            {'id': 'change-fly', 'name': '嫦娥奔月', 'icon': '🌙', 'desc': '仙丹飞向月宫的美丽传说'},
            {'id': 'monkey-king', 'name': '大闹天宫', 'icon': '🐒', 'desc': '孙悟空反抗权威的英雄故事'},
            {'id': 'apology', 'name': '负荆请罪', 'icon': '🌿', 'desc': '知错能改善莫大焉'},
            {'id': 'houyi-shoot', 'name': '后羿射日', 'icon': '🏹', 'desc': '射下九个太阳拯救苍生'},
            {'id': 'jingwei', 'name': '精卫填海', 'icon': '🐦', 'desc': '衔石填海，坚韧不拔'},
            {'id': 'kong-rong', 'name': '孔融让梨', 'icon': '🍐', 'desc': '四岁让梨，谦让友爱'},
            {'id': 'cowherd-weaver', 'name': '牛郎织女', 'icon': '💫', 'desc': '鹊桥相会，七夕来源'},
            {'id': 'nuwa', 'name': '女娲补天', 'icon': '🌈', 'desc': '炼石补天的创世神话'},
            {'id': 'pangu', 'name': '盘古开天', 'icon': '🌍', 'desc': '开天辟地的创世神话'},
            {'id': 'sima-guang', 'name': '司马光砸缸', 'icon': '🪨', 'desc': '沉着冷静的智慧故事'},
        ]
    },
    {
        'id': 'food-clothing', 'name': '饮食与服饰文化', 'icon': '👘',
        'shortDesc': '舌尖中国 · 衣冠风华',
        'subTopics': [
            {'id': 'jiaozi', 'name': '饺子', 'icon': '🥟', 'desc': '形似元宝寓意吉祥如意'},
            {'id': 'mooncake', 'name': '月饼', 'icon': '🥮', 'desc': '中秋传统糕点，团圆思念'},
            {'id': 'zongzi', 'name': '粽子', 'icon': '🫔', 'desc': '糯米粽叶包裹的文化记忆'},
            {'id': 'tanghulu', 'name': '糖葫芦', 'icon': '🍡', 'desc': '酸甜可口的童年味道'},
            {'id': 'tangyuan', 'name': '汤圆', 'icon': '🍡', 'desc': '象征团团圆圆'},
            {'id': 'manhan-feast', 'name': '满汉全席', 'icon': '🍽️', 'desc': '中国饮食文化的极致体现'},
            {'id': 'hanfu-ruqun', 'name': '汉服襦裙', 'icon': '👗', 'desc': '上衣下裙飘逸优雅'},
            {'id': 'hanfu-quju', 'name': '汉服曲裾', 'icon': '👘', 'desc': '交领右衽的传统礼服'},
            {'id': 'tang-suit', 'name': '唐装', 'icon': '🥋', 'desc': '立领对襟典雅大方'},
            {'id': 'qipao', 'name': '旗袍', 'icon': '👘', 'desc': '展现东方女性之美'},
            {'id': 'miao-costume', 'name': '苗族服饰', 'icon': '👚', 'desc': '银饰与刺绣绚丽多彩'},
            {'id': 'tibetan-costume', 'name': '藏族服饰', 'icon': '🧥', 'desc': '色彩鲜明的高原特色'},
            {'id': 'mongolian-costume', 'name': '蒙古族服饰', 'icon': '🦺', 'desc': '草原民族的文化标识'},
            {'id': 'hairpin', 'name': '发簪', 'icon': '📌', 'desc': '精美手工工艺的体现'},
            {'id': 'jade-pendant', 'name': '玉佩', 'icon': '💎', 'desc': '君子佩玉的文化精髓'},
            {'id': 'sachet', 'name': '香囊', 'icon': '🎐', 'desc': '刺绣精美内含草药香料'},
            {'id': 'tiger-shoes', 'name': '虎头鞋', 'icon': '👟', 'desc': '虎头造型辟邪保平安'},
        ]
    },
    {
        'id': 'nature', 'name': '自然与风物文化', 'icon': '🏔️',
        'shortDesc': '锦绣山河 · 物华天宝',
        'subTopics': [
            {'id': 'huangshan', 'name': '黄山', 'icon': '⛰️', 'desc': '天下第一奇山'},
            {'id': 'guilin', 'name': '桂林山水', 'icon': '🏞️', 'desc': '桂林山水甲天下'},
            {'id': 'west-lake', 'name': '西湖', 'icon': '🌊', 'desc': '淡妆浓抹总相宜'},
            {'id': 'zhangjiajie', 'name': '张家界', 'icon': '🏔️', 'desc': '悬浮山般的仙境'},
            {'id': 'jiuzhaigou', 'name': '九寨沟', 'icon': '💧', 'desc': '人间瑶池童话世界'},
            {'id': 'meilan-zhuju', 'name': '梅兰竹菊', 'icon': '🌸', 'desc': '花中四君子'},
            {'id': 'peony', 'name': '牡丹', 'icon': '🌺', 'desc': '花开时节动京城'},
            {'id': 'lotus', 'name': '荷花', 'icon': '🪷', 'desc': '出淤泥而不染'},
            {'id': 'koi', 'name': '锦鲤', 'icon': '🐟', 'desc': '寓意好运与成功'},
            {'id': 'crane', 'name': '仙鹤', 'icon': '🦩', 'desc': '象征长寿与吉祥'},
            {'id': 'tea', 'name': '茶叶', 'icon': '🍵', 'desc': '茶道精神博大精深'},
            {'id': 'silk', 'name': '丝绸', 'icon': '🧣', 'desc': '丝绸之路的文化使者'},
            {'id': 'porcelain', 'name': '瓷器', 'icon': '🫖', 'desc': '景德镇的千年窑火'},
            {'id': 'wenfang-sibao', 'name': '文房四宝', 'icon': '🖌️', 'desc': '笔墨纸砚文人必备'},
        ]
    },
]

DIFFICULTIES = {
    3: {'size': 3, 'label': '入门', 'timeLimit': 180, 'moveLimit': 150, 'basePoints': 300},
    4: {'size': 4, 'label': '进阶', 'timeLimit': 360, 'moveLimit': 260, 'basePoints': 500},
}

REWARDS = [
    {'id': 'beginner', 'name': '初入江湖', 'icon': '🌟', 'points': 500, 'desc': '累计获得500积分'},
    {'id': 'enthusiast', 'name': '文化爱好者', 'icon': '📚', 'points': 1500, 'desc': '累计获得1500积分'},
    {'id': 'explorer', 'name': '文化探索者', 'icon': '🔍', 'points': 3000, 'desc': '累计获得3000积分'},
    {'id': 'scholar', 'name': '国学达人', 'icon': '🎓', 'points': 6000, 'desc': '累计获得6000积分'},
    {'id': 'master', 'name': '国风大师', 'icon': '🏅', 'points': 10000, 'desc': '累计获得10000积分'},
    {'id': 'legend', 'name': '文化传承者', 'icon': '👑', 'points': 20000, 'desc': '累计获得20000积分'},
]


def index(request):
    if request.user.is_authenticated:
        return redirect('menu')
    return redirect('login')


@ensure_csrf_cookie
def user_login(request):
    if request.user.is_authenticated:
        return redirect('menu')
    error = ''
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            user = authenticate(username=form.cleaned_data['username'], password=form.cleaned_data['password'])
            if user:
                login(request, user)
                return redirect('menu')
            error = '用户名或密码错误'
    else:
        form = LoginForm()
    return render(request, 'mainsite/login.html', {'form': form, 'error': error})


@ensure_csrf_cookie
def user_register(request):
    if request.user.is_authenticated:
        return redirect('menu')
    error = ''
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password'])
            user.save()
            login(request, user)
            return redirect('menu')
        error = '注册信息有误，请检查'
    else:
        form = RegisterForm()
    return render(request, 'mainsite/register.html', {'form': form, 'error': error})


def user_logout(request):
    logout(request)
    return redirect('login')


@login_required
def menu(request):
    # compute progress per theme
    completed_ids = set(GameRecord.objects.filter(user=request.user).values_list('subtopic_id', flat=True).distinct())
    for t in THEMES:
        t['total'] = len(t['subTopics'])
        t['done'] = sum(1 for s in t['subTopics'] if s['id'] in completed_ids)
    profile = request.user.profile
    earned_ids = list(EarnedReward.objects.filter(user=request.user).values_list('reward_id', flat=True))
    return render(request, 'mainsite/menu.html', {
        'themes': THEMES,
        'difficulties': DIFFICULTIES,
        'rewards': REWARDS,
        'profile': profile,
        'earned_reward_ids': earned_ids,
    })


@login_required
def subtopic(request):
    theme_id = request.GET.get('theme_id', '')
    theme = next((t for t in THEMES if t['id'] == theme_id), None)
    if not theme:
        return redirect('menu')
    completed_ids = set(GameRecord.objects.filter(user=request.user).values_list('subtopic_id', flat=True).distinct())
    return render(request, 'mainsite/subtopic.html', {
        'theme': theme,
        'completed_ids': completed_ids,
    })


@login_required
def game(request):
    theme_id = request.GET.get('theme_id', '')
    subtopic_id = request.GET.get('subtopic_id', '')
    difficulty = int(request.GET.get('difficulty', 3))
    theme = next((t for t in THEMES if t['id'] == theme_id), None)
    subtopic = None
    if theme:
        subtopic = next((s for s in theme['subTopics'] if s['id'] == subtopic_id), None)
    return render(request, 'mainsite/game.html', {
        'theme': theme,
        'subtopic': subtopic,
        'difficulty': difficulty,
        'diff_config': DIFFICULTIES.get(difficulty, DIFFICULTIES[3]),
    })


@login_required
def complete(request):
    return render(request, 'mainsite/complete.html')


@login_required
@require_POST
def save_record(request):
    data = json.loads(request.body)
    score = data.get('score', 0)
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
        score=score,
    )
    profile = request.user.profile
    profile.total_points += score
    profile.total_games += 1
    if data.get('time_spent', 0) < profile.best_time or profile.best_time == 0:
        profile.best_time = data.get('time_spent', 0)
    if data.get('moves', 0) < profile.best_moves or profile.best_moves == 0:
        profile.best_moves = data.get('moves', 0)
    profile.save()

    # check new badges
    new_badges = []
    for r in REWARDS:
        if profile.total_points >= r['points'] and not EarnedReward.objects.filter(user=request.user, reward_id=r['id']).exists():
            EarnedReward.objects.create(user=request.user, reward_id=r['id'])
            new_badges.append(r['name'])

    return JsonResponse({'ok': True, 'total_points': profile.total_points, 'new_badges': new_badges})


@login_required
def get_progress(request):
    completed_ids = list(GameRecord.objects.filter(user=request.user).values_list('subtopic_id', flat=True).distinct())
    earned_ids = list(EarnedReward.objects.filter(user=request.user).values_list('reward_id', flat=True))
    return JsonResponse({
        'completed_subtopics': completed_ids,
        'total_points': request.user.profile.total_points,
        'earned_reward_ids': earned_ids,
    })


@login_required
def leaderboard(request):
    from django.contrib.auth.models import User
    from .models import UserProfile
    profiles = UserProfile.objects.filter(total_points__gt=0).order_by('-total_points')[:50]
    return render(request, 'mainsite/leaderboard.html', {'profiles': profiles})


@login_required
def profile(request):
    profile_obj = request.user.profile
    earned = EarnedReward.objects.filter(user=request.user)
    earned_ids = list(earned.values_list('reward_id', flat=True))
    earned_badges = []
    for r in REWARDS:
        if r['id'] in earned_ids:
            earned_badges.append(r)

    if request.method == 'POST':
        if 'avatar_data' in request.POST:
            profile_obj.avatar_data = request.POST['avatar_data']
            profile_obj.save()
        elif 'nickname' in request.POST:
            form = ProfileForm(request.POST)
            if form.is_valid():
                profile_obj.nickname = form.cleaned_data['nickname']
                profile_obj.save()
        return redirect('profile')

    records = GameRecord.objects.filter(user=request.user)
    total_3 = records.filter(difficulty=3).count()
    total_4 = records.filter(difficulty=4).count()
    return render(request, 'mainsite/profile.html', {
        'profile': profile_obj,
        'earned_badges': earned_badges,
        'total_3': total_3,
        'total_4': total_4,
        'rewards': REWARDS,
    })


@login_required
def settings_view(request):
    msg = ''
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            request.user.set_password(form.cleaned_data['new_password'])
            request.user.save()
            from django.contrib.auth import update_session_auth_hash
            update_session_auth_hash(request, request.user)
            msg = '密码修改成功'
        else:
            msg = '修改失败，请检查输入'
    else:
        form = PasswordChangeForm(request.user)
    return render(request, 'mainsite/settings.html', {'form': form, 'msg': msg})


@login_required
def history(request):
    base = GameRecord.objects.filter(user=request.user)
    records = base.order_by('-completed_at')[:60]
    total = base.count()
    total_3 = base.filter(difficulty=3).count()
    total_4 = base.filter(difficulty=4).count()
    return render(request, 'mainsite/history.html', {
        'records': records,
        'total': total,
        'total_3': total_3,
        'total_4': total_4,
    })


@login_required
def daily_challenge(request):
    today = date.today()
    seed = today.year * 10000 + today.month * 100 + today.day
    rng = random.Random(seed)
    theme = rng.choice(THEMES)
    subtopic = rng.choice(theme['subTopics'])
    difficulty = rng.choice([3, 4])
    return render(request, 'mainsite/daily.html', {
        'theme': theme,
        'subtopic': subtopic,
        'difficulty': difficulty,
        'diff_config': DIFFICULTIES.get(difficulty, DIFFICULTIES[3]),
        'today': today,
    })
