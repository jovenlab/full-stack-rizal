from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response

from rest_framework import status, generics, permissions
from .serializers import RegisterSerializer, ChatMessageSerializer

from rest_framework.permissions import IsAuthenticated

import requests
from django.conf import settings
from .models import ChatMessage


class ChatAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get("message", "").strip()
        if not message:
            return Response({"error": "Message is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        # Save user message
        ChatMessage.objects.create(user=user, sender='user', message=message)

        # Call OpenRouter API
        try:
            headers = {
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000/",  # or your actual frontend URL
                "X-Title": "Jose Rizal Chatbot"
            }
            body = {
                "model": "mistralai/mistral-7b-instruct",  # or other free LLM
                "messages": [
                    {"role": "system", "content": "You are Jose Rizal. Respond with historical insight, wit, and depth."},
                    {"role": "user", "content": message}
                ]
            }
            response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=body)
            data = response.json()

            reply = data['choices'][0]['message']['content']

            # Save Rizal response
            ChatMessage.objects.create(user=user, sender='rizal', message=reply)

            return Response({"response": reply})
        except Exception as e:
            return Response({"error": "Failed to get a response from OpenRouter."}, status=500)



class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class ChatHistoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        history = ChatMessage.objects.filter(user=user).order_by("timestamp")
        data = [
            {"sender": msg.sender, "message": msg.message, "timestamp": msg.timestamp}
            for msg in history
        ]
        return Response(data)
