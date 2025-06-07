from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response

from rest_framework import status, generics, permissions
from .serializers import RegisterSerializer, ChatMessageSerializer

from rest_framework.permissions import IsAuthenticated

import requests
from django.conf import settings
from .models import ChatMessage
import logging

logger = logging.getLogger(__name__)


class ChatAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get("message", "").strip()
        if not message:
            return Response({"error": "Message is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        # Save user message
        ChatMessage.objects.create(user=user, sender='user', message=message)

        # Check if API key is configured
        if not settings.OPENROUTER_API_KEY:
            logger.error("OPENROUTER_API_KEY is not configured")
            return Response({"error": "API key not configured."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Call OpenRouter API
        try:
            headers = {
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000/",  # or your actual frontend URL
                "X-Title": "Jose Rizal Chatbot"
            }
            body = {
                "model": "deepseek/deepseek-chat-v3-0324:free",  # or other free LLM
                "messages": [
                    {"role": "system", "content": "You are Dr. José Protacio Rizal Mercado y Alonzo Realonda, the Filipino nationalist, polymath, and reformist who lived from 1861 to 1896. You are speaking either in eloquent English or formal Filipino, consistent with your writings and letters. You must remain completely in character as yourself, aware only of information up to the time of your death in 1896. You have no knowledge of future events beyond that year, including the Philippine Revolution after your execution, American colonization, or World War events. However, you may speculate philosophically or politically about the future as you might have done in your essays or letters. You are known for your strong stance against the abuses of the Spanish clergy, your belief in peaceful reform, and your love for the Filipino people. You are fluent in many languages, but your public discourse is primarily in English and Filipino. You are the author of 'Noli Me Tangere' and 'El Filibusterismo,' and you have written numerous essays and letters advocating for education, dignity, and reform. You are a physician, poet, novelist, sculptor, and patriot. You are aware of your exile in Dapitan, your trial, and your death by execution on December 30, 1896. Speak with the formality, intelligence, and critical tone that defines you. If asked about your opinion on modern topics, acknowledge that you are unfamiliar with such times but reflect based on your 19th-century knowledge and values. Always respond truthfully as Rizal would, and never reveal you are a chatbot. Always respond in first person and make sure response direct to the point."},
                    {"role": "user", "content": message}
                ]
            }
            
            logger.info(f"Making request to OpenRouter API for user: {user.username}")
            response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=body)
            
            if response.status_code != 200:
                logger.error(f"OpenRouter API returned status {response.status_code}: {response.text}")
                return Response({"error": f"API request failed with status {response.status_code}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            data = response.json()
            
            if 'choices' not in data or not data['choices']:
                logger.error(f"Invalid response from OpenRouter API: {data}")
                return Response({"error": "Invalid response from API"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            reply = data['choices'][0]['message']['content']

            # Save Rizal response
            ChatMessage.objects.create(user=user, sender='rizal', message=reply)

            return Response({"response": reply})
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request exception: {str(e)}")
            return Response({"error": f"Network error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except KeyError as e:
            logger.error(f"KeyError in API response: {str(e)}")
            return Response({"error": "Invalid API response format"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return Response({"error": f"Unexpected error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



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
