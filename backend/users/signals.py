from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from .models import CustomUser

@receiver(post_save, sender=CustomUser)
def send_welcome_email(sender, instance, created, **kwargs):
    if created:
        send_mail(
            'Добро пожаловать!',
            'Вы были добавлены в организацию. Установите пароль: http://...',
            'admin@statusapp.com',
            [instance.email],
        )