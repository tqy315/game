from django.contrib import admin
from django.urls import path
from game import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.puzzle_game, name='home'),
    path('puzzle/<int:level>/', views.puzzle_game),
]