'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

function typeBotReply(fullText: string, onUpdate: (typedText: string) => void, onComplete: () => void) {
  let index = 0;
  const interval = setInterval(() => {
    index++;
    onUpdate(fullText.slice(0, index));
    if (index === fullText.length) {
      clearInterval(interval);
      onComplete();
    }
  }, 20); 
  return () => clearInterval(interval);
}

interface ChatMessage {
  sender: 'user' | 'rizal';
  message: string;
  timestamp: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const router = useRouter();

  const [displayedMessages, setDisplayedMessages] = useState<ChatMessage[]>([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const bottomRef = useRef<HTMLDivElement>(null);
  // Scroll to bottom on messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/chat/history/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching chat history:', err);
      router.push('/'); // Redirect to login if unauthorized
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: ChatMessage = {
      sender: 'user',
      message: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const res = await axios.post(
        'http://localhost:8000/api/chat/',
        { message: input },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Start typing animation for bot reply
      const fullReply = res.data.response;

      const emptyBotMessage: ChatMessage = {
        sender: 'rizal',
        message: '',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, emptyBotMessage]);

      typeBotReply(
        fullReply,
        (typed) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], message: typed };
            return updated;
          });
        },
        () => {
          // Typing finished
        }
      );
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };


  const logout = () => {
    localStorage.removeItem('access_token');
    router.push('/');
  };

  useEffect(() => {
    if (!token) router.push('/');
    else fetchHistory();
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/4 border-r p-4 bg-gray-100">
        <h2 className="text-lg font-semibold mb-4">Past Messages</h2>
        <div className="space-y-2 overflow-y-auto h-full">
          {messages
            .filter((msg) => msg.sender === 'user')
            .map((msg, index) => (
              <div
                key={index}
                className="p-2 bg-white rounded shadow text-sm truncate"
              >
                {msg.message}
              </div>
            ))}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col justify-between p-4">
        <div 
            className="overflow-y-auto space-y-4 mb-4 max-h-[80vh] pr-2"
            style={{ overflowY: 'auto' }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg w-fit max-w-xl ${
                msg.sender === 'user'
                  ? 'bg-blue-500 text-white self-end ml-auto'
                  : 'bg-gray-200 text-black self-start'
              }`}
            >
              <p>{msg.message}</p>
            </div>
          ))}

          {/* This empty div is used to scroll into view */}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 border rounded px-4 py-2"
          />
          <button
            onClick={sendMessage}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Send
          </button>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
