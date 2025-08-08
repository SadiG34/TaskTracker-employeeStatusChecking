from django.urls import path
from .views import MessageListCreateView, UnreadMessagesView

urlpatterns = [
    path('', MessageListCreateView.as_view(), name='message-list'),
    path('unread/', UnreadMessagesView.as_view(), name='unread-messages'),
]