from django.urls import path
from . import views

urlpatterns = [
    path("register/",views.register_page,name="register"),
    path("register/success/",views.register_success,name="register_success"),
]