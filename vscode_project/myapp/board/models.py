from django.db import models

class UserRegister(models.Model):
    #用户名
    username = models.CharField(max_length=50,unique=True,verbose_name="用户名")
    #密码
    password = models.CharField(max_length=100,verbose_name="密码")
    #邮箱
    email = models.CharField(max_length=50,verbose_name="邮箱")

    def __str__(self):
        return f"{self.username}\n{self.password}\n{self.email}\n"

