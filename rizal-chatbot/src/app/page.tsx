'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RegisterModal from '@/src/components/RegisterModal';
import LoginModal from '@/src/components/LoginModal';

export default function Home() {
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('access_token');
    setIsLoggedIn(false);
    router.push('/');
  };

  return (
    <main className="p-10">
      <h1 className="text-2xl mb-4">Jose Rizal Chatbot</h1>
      {!isLoggedIn && (
        <>
          <button
            onClick={() => setShowRegister(true)}
            className="bg-green-500 text-white p-2 mr-2"
          >
            Register
          </button>
          <button
            onClick={() => setShowLogin(true)}
            className="bg-blue-500 text-white p-2"
          >
            Login
          </button>
        </>
      )}

      {isLoggedIn ? (
        <div>
          <h2>Welcome! Start chatting with Rizal.</h2>
          <button
            onClick={() => router.push('/chat')}
            className="bg-purple-500 text-white p-2 mt-4"
          >
            Go to Chat
          </button>
        </div>
      ) : (
        <p className="mt-4">Please log in to start chatting with Jose Rizal.</p>
      )}

      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSuccess={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLogin={() => {
            setIsLoggedIn(true);
            setShowLogin(false);
            router.push('/chat');
          }}
        />
      )}

      {isLoggedIn && (
        <button
          onClick={logout}
          className="bg-red-500 text-white p-2 mt-4 block"
        >
          Logout
        </button>
      )}
    </main>
  );
}
