import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Lock, Mail, LogIn } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Errore: " + error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-indigo-600 p-3 rounded-xl text-white mb-4"><Lock size={32} /></div>
          <h1 className="text-2xl font-bold text-slate-900">QualiCARE Admin</h1>
          <p className="text-slate-500 text-sm">Gestione Monitoraggio Questionari</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="admin@esempio.it" required />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
          </div>
          <button disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg flex justify-center items-center gap-2">
            {loading ? 'Accesso...' : <><LogIn size={18}/> Entra nel Sistema</>}
          </button>
        </form>
      </div>
    </div>
  );
}