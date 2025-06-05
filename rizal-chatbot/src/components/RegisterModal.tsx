'use client';
import { useState } from 'react';
import API from '@/lib/api';

export default function RegisterModal({ onClose, onSuccess }: any) {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');

  const register = async () => {
    try {
      await API.post('register/', form);
      onSuccess(); // switch to login
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div className="modal bg-white p-4 shadow-md rounded">
      <h2 className="text-xl mb-2">Register</h2>
      <input
        placeholder="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        className="border p-2 w-full mb-2"
      />
      <input
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
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
      <button className="bg-green-500 text-white p-2 mt-2" onClick={register}>Register</button>
      <button className="text-sm text-blue-600 mt-2" onClick={onClose}>Cancel</button>
    </div>
  );
}
