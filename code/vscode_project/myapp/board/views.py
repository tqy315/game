from django.shortcuts import render,redirect
from django.http import HttpResponse
from .models import UserRegister
from django.contrib.auth.hashers import make_password

def register_page(request):
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")

        if not username or not email or not password:
            return HttpResponse("请填写完整信息！<a href='/board/register/'>返回注册</a>") 

        if UserRegister.objects.filter(username=username).exists():
            return HttpResponse("用户名已存在！<a href='/'>返回注册</a>")
    
        UserRegister.objects.create(username=username,email=email,password=make_password(password))
        return redirect("register_success")


    return render(request,"board/register.html")

def register_success(request):
    return render(request,"board/success.html")




