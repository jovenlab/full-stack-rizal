'use client';
import { useState } from 'react';
import API from '@/lib/api';

export default function LoginModal({ onClose, onLogin }: any) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const login = async () => {
    try {
      const res = await API.post('token/', form);
      localStorage.setItem('access_token', res.data.access);
      onLogin(); // proceed to chat page or dashboard
    } catch (err: any) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="modal bg-white p-4 shadow-md rounded">
      <h2 className="text-xl mb-2">Login</h2>
      <input
        placeholder="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        className="border p-2 w-full mb-2"
      />
      <input
        placeholder="Password"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="border p-2 w-full mb-2"
      />
      {error && <p className="text-red-500">{error}</p>}
      <button className="bg-blue-500 text-white p-2 mt-2" onClick={login}>Login</button>
      <button className="text-sm text-blue-600 mt-2" onClick={onClose}>Cancel</button>
    </div>
  );
}
