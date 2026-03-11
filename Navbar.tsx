import { Link } from 'react-router-dom';
import { BookOpen, LogOut, User, Settings } from 'lucide-react';

export default function Navbar({ user, onLogout }: { user: any, onLogout: () => void }) {
  return (
    <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">EduPlatform Pro</span>
          </Link>
          
          <div className="flex items-center gap-6">
            {user.role === 'admin' && (
              <>
                <Link to="/exams" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                  Exámenes
                </Link>
                <Link to="/admin" className="flex items-center gap-1 text-sm font-medium text-white/70 hover:text-white transition-colors">
                  <Settings className="w-4 h-4" />
                  Panel Admin
                </Link>
              </>
            )}
            
            <div className="flex items-center gap-4 pl-6 border-l border-white/20">
              <div className="flex items-center gap-2">
                <div className="bg-white/10 p-1.5 rounded-full">
                  <User className="w-4 h-4 text-white/70" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white leading-none">{user.name}</span>
                  <span className="text-xs text-white/50 capitalize">{user.role}</span>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
