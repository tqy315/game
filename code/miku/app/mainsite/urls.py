from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('login/', views.user_login, name='login'),
    path('register/', views.user_register, name='register'),
    path('logout/', views.user_logout, name='logout'),
    path('menu/', views.menu, name='menu'),
    path('subtopic/', views.subtopic, name='subtopic'),
    path('game/', views.game, name='game'),
    path('complete/', views.complete, name='complete'),
    path('history/', views.history, name='history'),
    path('settings/', views.settings_view, name='settings'),
    path('profile/', views.profile, name='profile'),
    path('api/save-record/', views.save_record, name='save_record'),
    path('api/get-progress/', views.get_progress, name='get_progress'),
]
