from django import forms
from django.contrib.auth.models import User


class LoginForm(forms.Form):
    username = forms.CharField(max_length=50, label='用户名')
    password = forms.CharField(widget=forms.PasswordInput(), label='密码')


class RegisterForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput(), min_length=6, label='密码')
    password2 = forms.CharField(widget=forms.PasswordInput(), label='确认密码')

    class Meta:
        model = User
        fields = ['username']

    def clean_password2(self):
        p1 = self.cleaned_data.get('password')
        p2 = self.cleaned_data.get('password2')
        if p1 and p2 and p1 != p2:
            raise forms.ValidationError('两次密码不一致')
        return p2


class ProfileForm(forms.Form):
    nickname = forms.CharField(max_length=50, required=False, label='昵称')


class PasswordChangeForm(forms.Form):
    old_password = forms.CharField(widget=forms.PasswordInput(), label='当前密码')
    new_password = forms.CharField(widget=forms.PasswordInput(), min_length=6, label='新密码')
    new_password2 = forms.CharField(widget=forms.PasswordInput(), label='确认新密码')

    def __init__(self, user, *args, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)

    def clean_old_password(self):
        pwd = self.cleaned_data.get('old_password')
        if not self.user.check_password(pwd):
            raise forms.ValidationError('当前密码不正确')
        return pwd

    def clean_new_password2(self):
        p1 = self.cleaned_data.get('new_password')
        p2 = self.cleaned_data.get('new_password2')
        if p1 and p2 and p1 != p2:
            raise forms.ValidationError('两次密码不一致')
        return p2
