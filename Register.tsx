import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, GraduationCap, Presentation } from 'lucide-react';

export default function Register({ onRegister, isAdminRoute = false }: { onRegister: (user: any, token: string) => void, isAdminRoute?: boolean }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>(isAdminRoute ? 'admin' : 'student');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setRole(isAdminRoute ? 'admin' : 'student');
    setError('');
  }, [isAdminRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (res.ok) {
        // Auto login after register
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role }),
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          onRegister(loginData.user, loginData.token);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error connecting to server');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 glass-card p-8">
      <div className="flex justify-center mb-6">
        <div className={`p-3 rounded-full ${role === 'student' ? 'bg-indigo-500/20' : 'bg-emerald-500/20'}`}>
          {role === 'student' ? <GraduationCap className="w-8 h-8 text-indigo-400" /> : <Presentation className="w-8 h-8 text-emerald-400" />}
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center mb-6 text-white">
        Registro de {role === 'student' ? 'Estudiante' : 'Profesor'}
      </h2>

      {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">
            {role === 'student' ? 'Nombre Completo del Estudiante' : 'Nombre Completo del Docente'}
          </label>
          <input
            type="text"
            required
            placeholder={role === 'student' ? 'Ej. Juan Pérez' : 'Ej. Prof. María Gómez'}
            className={`w-full px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 outline-none ${role === 'student' ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500'}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
          <input
            type="email"
            required
            placeholder="correo@ejemplo.com"
            className={`w-full px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 outline-none ${role === 'student' ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500'}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Contraseña</label>
          <input
            type="password"
            required
            placeholder="••••••••"
            className={`w-full px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 outline-none ${role === 'student' ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500'}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className={`w-full text-white font-medium py-2 rounded-xl transition-all active:scale-95 ${role === 'student' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          Crear cuenta de {role === 'student' ? 'Estudiante' : 'Profesor'}
        </button>
      </form>
      <p className="text-center mt-6 text-sm text-white/60">
        ¿Ya tienes cuenta? <Link to={isAdminRoute ? "/teacher-login" : "/login"} className={`hover:underline ${role === 'student' ? 'text-indigo-400' : 'text-emerald-400'}`}>Inicia Sesión</Link>
      </p>
    </div>
  );
}
