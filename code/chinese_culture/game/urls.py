from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('theme/<str:theme_id>/', views.theme_detail, name='theme_detail'),
    path('puzzle/<str:theme_id>/<int:item_index>/', views.puzzle, name='puzzle'),

    # Auth
    path('register/', views.register_page, name='register'),
    path('login/', views.login_page, name='login'),
    path('logout/', views.logout_page, name='logout'),

    # User pages
    path('history/', views.history_page, name='history'),
    path('settings/', views.settings_page, name='settings'),

    # API
    path('api/save-result/', views.save_result, name='save_result'),
]
