import secrets

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class CustomUser(AbstractUser):
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('lunch', 'Обед'),
        ('meeting', 'На встрече'),
        ('vacation', 'Отпуск'),
    ]
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='offline'
    )
    last_status_change = models.DateTimeField(auto_now_add=True)

    organization = models.ForeignKey(
        'core.Organization',  # Строковая ссылка!
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='members'
    )

    # Добавляем уникальные related_name для групп и прав
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='customuser_set',  # Уникальное имя
        related_query_name='customuser',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='customuser_set',  # Уникальное имя
        related_query_name='customuser',
    )

    def __str__(self):
        return f"{self.username} ({self.organization})"

    class Meta:
        db_table = 'users_customuser'
class Invitation(models.Model):
    email = models.EmailField()
    token = models.CharField(max_length=64, unique=True, default=secrets.token_urlsafe(32))
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE)
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=timezone.now() + timezone.timedelta(days=3))
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"Приглашение для {self.email} в {self.organization.name}"