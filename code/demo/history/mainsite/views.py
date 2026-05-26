from django.shortcuts import render, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from .models import GameRecord
import json


def history_list(request):
    """历史记录列表页"""
    records = GameRecord.objects.all()[:50]
    return render(request, "mainsite/history_list.html", {"records": records})


def history_detail(request, record_id):
    """历史记录详情页 — 展示游戏统计 + 文化知识介绍"""
    record = get_object_or_404(GameRecord, pk=record_id)
    return render(request, "mainsite/history_detail.html", {"record": record})


def settings_page(request):
    """设置页面"""
    ctx = {
        "settings": {
            "sound": request.session.get("sound", True),
            "animation": request.session.get("animation", True),
            "highlight_hint": request.session.get("highlight_hint", True),
        }
    }
    return render(request, "mainsite/settings.html", ctx)


@require_http_methods(["POST"])
def save_settings(request):
    """保存设置到 session"""
    data = json.loads(request.body)
    request.session["sound"] = data.get("sound", True)
    request.session["animation"] = data.get("animation", True)
    request.session["highlight_hint"] = data.get("highlight_hint", True)
    return JsonResponse({"ok": True})


@require_http_methods(["POST"])
def reset_data(request):
    """重置所有数据"""
    GameRecord.objects.all().delete()
    request.session.flush()
    return JsonResponse({"ok": True})


@csrf_exempt
@require_http_methods(["POST"])
def save_result(request):
    """保存游戏结果（供前端游戏调用）"""
    data = json.loads(request.body)
    record = GameRecord.objects.create(
        theme_id=data["theme_id"],
        theme_name=data["theme_name"],
        difficulty=data["difficulty"],
        time_seconds=data["time"],
        moves=data["moves"],
        hints_used=data.get("hints_used", 0),
        score=data["score"],
        culture_title=data.get("culture_title", ""),
        culture_content=data.get("culture_content", ""),
    )
    return JsonResponse({"ok": True, "record_id": record.pk})
