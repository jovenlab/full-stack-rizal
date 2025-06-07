from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.username} - {self.title or 'Untitled Chat'}"

    def save(self, *args, **kwargs):
        # Auto-generate title from first user message if empty
        if not self.title and self.pk:
            first_message = self.messages.filter(sender='user').first()
            if first_message:
                self.title = first_message.message[:50] + ('...' if len(first_message.message) > 50 else '')
        super().save(*args, **kwargs)

class ChatMessage(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    sender = models.CharField(max_length=10)  # 'user' or 'rizal'
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender}: {self.message[:30]}"
    
    def save(self, *args, **kwargs):
        # Auto-create session for messages without one (for existing data)
        if not self.session and self.user:
            # Try to find an existing session or create a new one
            existing_session = ChatSession.objects.filter(user=self.user).first()
            if not existing_session:
                existing_session = ChatSession.objects.create(
                    user=self.user,
                    title="Legacy Chat Session"
                )
            self.session = existing_session
        super().save(*args, **kwargs)

