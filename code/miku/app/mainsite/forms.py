from django import forms
from django.contrib.auth.models import User
from .models import UserProfile


class LoginForm(forms.Form):
    username = forms.CharField(
        label='用户名',
        max_length=50,
        widget=forms.TextInput(attrs={
            'placeholder': '请输入用户名',
            'class': 'input-field',
            'autocomplete': 'off',
        })
    )
    password = forms.CharField(
        label='密码',
        widget=forms.PasswordInput(attrs={
            'placeholder': '请输入密码',
            'class': 'input-field',
        })
    )


class RegisterForm(forms.ModelForm):
    password = forms.CharField(
        label='密码',
        min_length=6,
        widget=forms.PasswordInput(attrs={
            'placeholder': '请输入密码（至少6位）',
            'class': 'input-field',
        })
    )
    password2 = forms.CharField(
        label='确认密码',
        widget=forms.PasswordInput(attrs={
            'placeholder': '请再次输入密码',
            'class': 'input-field',
        })
    )

    class Meta:
        model = User
        fields = ['username']
        widgets = {
            'username': forms.TextInput(attrs={
                'placeholder': '请输入用户名',
                'class': 'input-field',
                'autocomplete': 'off',
            }),
        }
        labels = {'username': '用户名'}

    def clean_username(self):
        username = self.cleaned_data['username']
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError('该用户名已被注册，请换一个。')
        return username

    def clean_password2(self):
        p1 = self.cleaned_data.get('password')
        p2 = self.cleaned_data.get('password2')
        if p1 and p2 and p1 != p2:
            raise forms.ValidationError('两次密码输入不一致。')
        return p2


class ProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ['nickname']
        widgets = {
            'nickname': forms.TextInput(attrs={
                'placeholder': '设置你的昵称',
                'class': 'input-field',
            }),
        }
        labels = {'nickname': '昵称'}
