from django.urls import path
from . import views

urlpatterns = [
    path("history/", views.history_list, name="history_list"),
    path("history/<int:record_id>/", views.history_detail, name="history_detail"),
    path("settings/", views.settings_page, name="settings"),
    path("api/save-settings/", views.save_settings, name="save_settings"),
    path("api/reset-data/", views.reset_data, name="reset_data"),
    path("api/save-result/", views.save_result, name="save_result"),
]
