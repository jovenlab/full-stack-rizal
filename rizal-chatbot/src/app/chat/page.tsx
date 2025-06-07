"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import TypingSpinner from "@/src/components/TypingSpinner";
import {
  setupAxiosInterceptors,
  getAuthHeaders,
  clearTokens,
} from "@/lib/axios";
import ChatInput from "./chat_input";

function typeBotReply(
  fullText: string,
  onUpdate: (typedText: string) => void,
  onComplete: () => void,
) {
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
  sender: "user" | "rizal";
  message: string;
  timestamp: string;
}

interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message?: {
    sender: string;
    message: string;
    timestamp: string;
  };
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [currentTypingCleanup, setCurrentTypingCleanup] = useState<
    (() => void) | null
  >(null);
  const router = useRouter();

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/sessions/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(res.data);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      router.push("/");
    }
  };

  const fetchSessionMessages = async (sessionId: number) => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/sessions/${sessionId}/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Only update if this is still the current session (prevent race conditions)
      setCurrentSession((prevSession) => {
        if (prevSession?.id === sessionId) {
          setMessages(res.data.messages || []);
          return res.data;
        }
        return prevSession;
      });
    } catch (err) {
      console.error("Error fetching session messages:", err);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const selectSession = (session: ChatSession) => {
    // Cancel any ongoing typing animation
    if (currentTypingCleanup) {
      currentTypingCleanup();
      setCurrentTypingCleanup(null);
    }

    // Clear current state first to prevent carryover
    setIsTyping(false);
    setMessages([]);
    setIsLoadingSession(true);
    setCurrentSession(session);

    // Then fetch the session messages
    fetchSessionMessages(session.id);
  };

  const startNewSession = () => {
    // Cancel any ongoing typing animation
    if (currentTypingCleanup) {
      currentTypingCleanup();
      setCurrentTypingCleanup(null);
    }

    setCurrentSession(null);
    setMessages([]);
    setIsTyping(false);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: ChatMessage = {
      sender: "user",
      message: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsFetching(true);

    try {
      const payload: any = { message: input };
      if (currentSession) {
        payload.session_id = currentSession.id;
      }

      const res = await axios.post("http://localhost:8000/api/chat/", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // If we didn't have a current session, this is a new one
      if (!currentSession) {
        const newSession: ChatSession = {
          id: res.data.session_id,
          title: res.data.session_title || input.slice(0, 50),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          message_count: 2, // user + rizal message
        };
        setCurrentSession(newSession);
        setSessions((prev) => [newSession, ...prev]);
      } else {
        // Update existing session in the list
        setSessions((prev) =>
          prev.map((session) =>
            session.id === currentSession.id
              ? {
                  ...session,
                  updated_at: new Date().toISOString(),
                  message_count: messages.length + 2,
                }
              : session,
          ),
        );
      }

      // Start typing animation for bot reply
      const fullReply = res.data.response;
      const sessionIdForThisResponse =
        currentSession?.id || res.data.session_id;
      setIsFetching(false);
      setIsTyping(true);

      const emptyBotMessage: ChatMessage = {
        sender: "rizal",
        message: "",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, emptyBotMessage]);

      const cleanup = typeBotReply(
        fullReply,
        (typed) => {
          // Only update if we're still in the same session
          setCurrentSession((currentSessionState) => {
            if (
              currentSessionState?.id === sessionIdForThisResponse ||
              (!currentSessionState && !sessionIdForThisResponse)
            ) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  message: typed,
                };
                return updated;
              });
            }
            return currentSessionState;
          });
        },
        () => {
          // Only complete if we're still in the same session
          setCurrentSession((currentSessionState) => {
            if (
              currentSessionState?.id === sessionIdForThisResponse ||
              (!currentSessionState && !sessionIdForThisResponse)
            ) {
              setIsTyping(false);
            }
            return currentSessionState;
          });
          setCurrentTypingCleanup(null);
        },
      );

      setCurrentTypingCleanup(() => cleanup);
    } catch (err) {
      setIsFetching(false);
      console.error("Failed to send message:", err);
    }
  };

  const deleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat session?")) return;

    try {
      await axios.delete(`http://localhost:8000/api/sessions/${sessionId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));

      if (currentSession?.id === sessionId) {
        startNewSession();
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/");
  };

  const TypingDots = () => (
    <div
      className="
        flex
        space-x-1
        items-center
      "
    >
      <div
        className="
          w-2 h-2
          bg-gray-500
          rounded-full
          animate-bounce
          [animation-delay:0s]
        "
      ></div>
      <div
        className="
          w-2 h-2
          bg-gray-500
          rounded-full
          animate-bounce
          [animation-delay:0.2s]
        "
      ></div>
      <div
        className="
          w-2 h-2
          bg-gray-500
          rounded-full
          animate-bounce
          [animation-delay:0.4s]
        "
      ></div>
    </div>
  );

  useEffect(() => {
    if (!token) {
      router.push("/");
    } else {
      fetchSessions();
    }
  }, [token]);

  return (
    <div
      className="
        flex
        h-screen
      "
    >
      {/* Sidebar */}
      <div
        className="
          flex flex-col
          w-1/4
          p-4
          bg-gray-100
          border-r
        "
      >
        <div
          className="
            flex
            mb-4
            items-center justify-between
          "
        >
          <h2
            className="
              text-lg font-semibold
            "
          >
            Chat Sessions
          </h2>
          <button
            onClick={startNewSession}
            className="
              px-3 py-1
              text-white text-sm
              bg-blue-600
              rounded hover:bg-blue-700
            "
          >
            New Chat
          </button>
        </div>

        <div
          className="
            overflow-y-auto flex-1
            space-y-2
          "
        >
          {/* Current new session */}
          {!currentSession && messages.length === 0 && (
            <div
              className="
                p-3
                bg-blue-100
                border-l-4 border-blue-500
                rounded
              "
            >
              <div
                className="
                  font-medium text-blue-800
                "
              >
                New Chat
              </div>
              <div
                className="
                  text-sm text-blue-600
                "
              >
                Start a conversation with Rizal
              </div>
            </div>
          )}

          {/* Existing sessions */}
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => selectSession(session)}
              className={`
                p-3
                cursor-pointer
                rounded group relative
                ${
                currentSession?.id === session.id
                ? "bg-blue-200 border-l-4 border-blue-500"
                : "bg-white hover:bg-gray-50"
                }
              `}
            >
              <div
                className="
                  flex
                  items-start justify-between
                "
              >
                <div
                  className="
                    flex-1
                    min-w-0
                  "
                >
                  <div
                    className="
                      font-medium text-sm
                      truncate
                    "
                  >
                    {session.title || "Untitled Chat"}
                  </div>
                </div>
                <button
                  onClick={(e) => deleteSession(session.id, e)}
                  title="Delete session"
                  className="
                    ml-2 p-1
                    text-red-500
                    opacity-0
                    group-hover:opacity-100 hover:text-red-700 rounded
                  "
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div
        className="
          flex-1 flex flex-col
          h-screen
        "
      >
        {/* Chat Header */}
        <div
          className="
            flex-shrink-0
            pb-4 p-4
            border-b
          "
        >
          <div
            className="
              flex
              items-center justify-between
            "
          >
            <div>
              <h1
                className="
                  text-xl font-semibold
                "
              >
                {currentSession
                  ? currentSession.title
                  : "New Chat with José Rizal"}
              </h1>
              <p
                className="
                  text-sm text-gray-600
                "
              >
                {currentSession
                  ? `Started ${new Date(currentSession.created_at).toLocaleDateString()}`
                  : "Start a new conversation"}
              </p>
            </div>
            <button
              onClick={logout}
              className="
                px-4 py-2
                text-white
                bg-red-600
                rounded hover:bg-red-700
              "
            >
              Logout
            </button>
          </div>
        </div>

        {/* Messages - Takes up all available space */}
        <div
          className="
            flex-1 overflow-y-auto
            p-4 space-y-4
          "
        >
          {isLoadingSession ? (
            <div
              className="
                py-8
                text-center text-gray-500
              "
            >
              <div
                className="
                  h-8 w-8
                  mx-auto mb-4
                  rounded-full border-b-2 border-blue-600
                  animate-spin
                "
              ></div>
              <p>Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div
              className="
                py-8
                text-center text-gray-500
              "
            >
              <h3
                className="
                  mb-2
                  text-xl font-semibold
                "
              >
                Welcome to the José Rizal Chatbot
              </h3>
              <p>
                Start a conversation with the Filipino national hero. Ask him
                about his life, writings, or thoughts on reform and education.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`
                  w-fit max-w-xl
                  p-3
                  rounded-lg
                  ${
                  msg.sender === "user"
                  ? "bg-[#FAD02B] text-white self-end ml-auto"
                  : "bg-gray-200 text-black self-start"
                  }
                `}
              >
                <p>{msg.message}</p>
              </div>
            ))
          )}

          {isTyping && !isLoadingSession && (
            <div
              className="
                w-fit max-w-xl
                p-3
                text-black
                bg-gray-200
                rounded-lg
                self-start
              "
            >
              <TypingDots />
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input - Fixed at bottom */}
        <div
          className="
            p-4
          "
        >
          {/* <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message to José Rizal..."
            className="flex-1 border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button> */}

          <ChatInput
            placeholder="Type your message to José Rizal..."
            value={input}
            onChange={(value) => setInput(value)}
            onClick={sendMessage}
          />
        </div>
      </div>
    </div>
  );
}
