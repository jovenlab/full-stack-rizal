'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface ChatMessage {
  sender: 'user' | 'rizal';
  message: string;
  timestamp: string;
}

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

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!token) router.push('/');
    else fetchHistory();
  }, [token]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/chat/history/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch {
      router.push('/');
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const fullReply = res.data.response;
      setIsTyping(true);
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
            updated[updated.length - 1].message = typed;
            return updated;
          });
        },
        () => setIsTyping(false)
      );
    } catch (err) {
      console.error('Send failed:', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    router.push('/');
  };

  const TypingDots = () => (
    <div className="flex items-center space-x-1">
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150" />
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[var(--color-beige)] font-[var(--font-pica)]">
      {/* Header */}
      <header className="flex justify-between items-center p-4 sticky top-0 z-10 bg-[var(--color-peach)]">
      <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="p-0 w-8 h-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="33" viewBox="0 0 32 33" fill="none">
              <path d="M25.3333 4.5H6.66661C5.19385 4.5 3.99994 5.69391 3.99994 7.16667V25.8333C3.99994 27.3061 5.19385 28.5 6.66661 28.5H25.3333C26.806 28.5 27.9999 27.3061 27.9999 25.8333V7.16667C27.9999 5.69391 26.806 4.5 25.3333 4.5Z" stroke="#562D18" strokeWidth="2.66667" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11.9999 4.5V28.5M21.3332 20.5L17.3332 16.5L21.3332 12.5" stroke="#562D18" strokeWidth="2.66667" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1
            className="text-center text-4xl font-normal"
            style={{ fontFamily: 'Maragsa, serif' }}
          >
            <span style={{ color: '#264888' }}>Rizal</span>
            <span style={{ color: '#BF391D' }}>GPT</span>
          </h1>
        </div>
        <button
          className="flex items-center gap-2 bg-[var(--color-brown)] text-white px-4 py-2 rounded-lg hover:bg-[#3e1f10] transition font-[var(--font-pica)]"
          onClick={() => {
            setMessages([]);
            setInput('');
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="19"
            viewBox="0 0 18 19"
            fill="none"
          >
            <path
              d="M9 2.75006H3.75C3.35218 2.75006 2.97064 2.9081 2.68934 3.1894C2.40804 3.47071 2.25 3.85224 2.25 4.25006V14.7501C2.25 15.1479 2.40804 15.5294 2.68934 15.8107C2.97064 16.092 3.35218 16.2501 3.75 16.2501H14.25C14.6478 16.2501 15.0294 16.092 15.3107 15.8107C15.592 15.5294 15.75 15.1479 15.75 14.7501V9.50006"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13.7813 2.4688C14.0797 2.17043 14.4844 2.00281 14.9063 2.00281C15.3283 2.00281 15.733 2.17043 16.0313 2.4688C16.3297 2.76717 16.4973 3.17184 16.4973 3.5938C16.4973 4.01575 16.3297 4.42043 16.0313 4.7188L9.27157 11.4793C9.09348 11.6572 8.87347 11.7875 8.63182 11.858L6.47707 12.488C6.41253 12.5069 6.34412 12.508 6.279 12.4913C6.21388 12.4746 6.15444 12.4407 6.10691 12.3932C6.05937 12.3457 6.02549 12.2862 6.0088 12.2211C5.99212 12.156 5.99325 12.0876 6.01207 12.023L6.64207 9.8683C6.71297 9.62684 6.84347 9.40709 7.02157 9.2293L13.7813 2.4688Z"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          New conversation
        </button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className="flex flex-col justify-between items-start"
          style={{
            width: '432px',
            padding: '20px 20px 40px 20px',
            background: 'rgba(255, 255, 255, 0.5)',
            alignSelf: 'stretch',
          }}
        >
<div className="w-full space-y-2 overflow-y-auto">
  <div className="relative w-full mb-4">
    <input
      type="text"
      placeholder="Search"
      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#562D18]"
      style={{
        fontFamily: '"IM FELL DW Pica", serif',
        fontSize: '18px',
        fontStyle: 'normal',
        fontWeight: 400,
        lineHeight: 'normal',
        color: '#000',
      }}
    />
    <svg
      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#999]"
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>

            {messages.filter((m) => m.sender === 'user').map((m, i) => (
              <div key={i} className="flex justify-between items-center w-full bg-white rounded p-3 text-sm shadow hover:bg-[#EEEEEE] transition truncate">
                <span className="text-[#000]">{m.message}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="text-[#999]" width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path d="M12 12h.01M19 12h.01M5 12h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ))}
          </div>

          <button onClick={logout} className="w-full mt-6 bg-[var(--color-brown)] text-white py-3 rounded-xl hover:bg-[#3e1f10]">
            Sign out
          </button>
        </aside>

        {/* Chat area */}
        <main className="flex flex-col flex-1 justify-between p-8" style={{ background: 'linear-gradient(180deg, #FDF3DF 0%, rgba(220, 148, 104, 0.34) 100%)' }}>
          <div className="overflow-y-auto space-y-4 pr-2 max-h-[75vh]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === 'rizal' ? 'justify-start' : 'justify-end'} w-full mb-4`}
              >
                <div className="flex gap-4 max-w-5xl">
                  {msg.sender === 'rizal' && (
                    <img src="/images/rizal.png" alt="Rizal icon" className="w-10 h-10 object-contain mt-1" />
                  )}

                  <div
                    className={`rounded-[20px] px-5 py-4 ${
                      msg.sender === 'rizal'
                        ? 'bg-transparent text-black w-full'
                        : 'bg-[var(--color-yellow)] text-black w-fit max-w-xl'
                    }`}
                    style={{
                      fontFamily: msg.sender === 'rizal' ? '"IM FELL DW Pica", serif' : 'var(--font-pica)',
                      fontSize: msg.sender === 'rizal' ? '18px' : undefined,
                      fontStyle: msg.sender === 'rizal' ? 'normal' : undefined,
                      fontWeight: msg.sender === 'rizal' ? 400 : undefined,
                      lineHeight: msg.sender === 'rizal' ? 'normal' : undefined,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.message}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="p-3 rounded-lg w-fit max-w-xl bg-gray-200 text-black self-start">
                <TypingDots />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div
  className="flex items-center w-full"
  style={{
    padding: '20px',
    borderRadius: '20px',
    background: '#F0E8D9',
    alignSelf: 'stretch',
    marginTop: '32px',
    justifyContent: 'space-between',
  }}
>
  <input
    type="text"
    placeholder="Ask me anything"
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
    className="flex-1 bg-transparent outline-none placeholder-[#B0AEA7]"
    style={{
      textAlign: 'center',
      fontFamily: '"IM FELL DW Pica", serif',
      fontSize: '18px',
      fontStyle: 'normal',
      fontWeight: 400,
      lineHeight: 'normal',
      color: '#595959',
      border: 'none',
      boxShadow: 'none',
      marginRight: '16px',
    }}
  />
  <button
    onClick={sendMessage}
    aria-label="Send message"
    className="flex items-center justify-center"
    style={{
      width: '44px',
      height: '44px',
      borderRadius: '100px',
      background: '#562D18',
      border: 'none',
      gap: '10px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 6px 0 rgba(0,0,0,0.04)'
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 29 29"
      fill="none"
      style={{ strokeWidth: '2px', stroke: '#FFF', display: 'block' }}
    >
      <path
        d="M12.8845 15.7836C12.6297 15.5293 12.326 15.3292 11.9917 15.1953L1.41841 10.9553C1.29216 10.9047 1.18444 10.8166 1.10968 10.703C1.03493 10.5893 0.996736 10.4555 1.00022 10.3195C1.0037 10.1836 1.0487 10.0519 1.12917 9.94223C1.20964 9.83255 1.32174 9.75012 1.45041 9.706L26.7837 1.03933C26.9019 0.996658 27.0297 0.988515 27.1523 1.01585C27.2749 1.04319 27.3872 1.10488 27.476 1.1937C27.5649 1.28252 27.6265 1.3948 27.6539 1.5174C27.6812 1.64 27.6731 1.76785 27.6304 1.886L18.9637 27.2193C18.9196 27.348 18.8372 27.4601 18.7275 27.5406C18.6178 27.621 18.4862 27.666 18.3502 27.6695C18.2142 27.673 18.0804 27.6348 17.9668 27.5601C17.8531 27.4853 17.7651 27.3776 17.7144 27.2513L13.4744 16.6753C13.34 16.3413 13.1393 16.038 12.8845 15.7836ZM12.8845 15.7836L27.4717 1.19933"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
</div>

        </main>
      </div>
    </div>
  );
}