from django.shortcuts import render,redirect
from .models import UserRegister
from django.contrib.auth.hashers import make_password,check_password


def register_page(request):
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")


        if not username or not email or not password:
            return render(request,"board/register.html",{"error":"请填写完整信息！"})

        if UserRegister.objects.filter(username=username).exists():
            return render(request,"board/register.html",{"error":"用户名已存在！"})
    
        UserRegister.objects.create(username=username,email=email,password=make_password(password))
        return redirect("register_success")


    return render(request,"board/register.html")

def register_success(request):
    return render(request,"board/success.html")

def login_page(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        
        if not username or not password:
            return render(request,"board/login.html",{"error":"请填写用户名和密码！"})
        
        user = UserRegister.objects.filter(username=username).first()
        
        if not user:
            return render(request,"board/login.html",{"error":"用户名不存在！"})
        
        if not check_password(password,user.password):
            return render(request,"board/login.html",{"error":"密码错误！"})
        
        return redirect("register_success")
    
    return render(request,"board/login.html")




