from django.urls import path
from .views import ChatAPIView, RegisterView, ChatHistoryAPIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('chat/', ChatAPIView.as_view(), name='chat'),
    path('register/', RegisterView.as_view()),
    path('token/', TokenObtainPairView.as_view()),        # login
    path('token/refresh/', TokenRefreshView.as_view()),   # refresh
    path('chat/history/', ChatHistoryAPIView.as_view(), name='chat-history'),
]
