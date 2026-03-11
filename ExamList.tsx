import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, Award, PlayCircle, PlusCircle } from 'lucide-react';

export default function ExamList({ user }: { user: any }) {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExams(data);
      }
    } catch (err) {
      console.error('Error fetching exams', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-white">Cargando exámenes...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Exámenes Disponibles</h1>
          <p className="text-white/70 mt-2">Selecciona un examen para comenzar tu evaluación.</p>
        </div>
        {user.role === 'admin' && (
          <Link to="/admin/exams/create" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
            <PlusCircle className="w-5 h-5" /> Crear Examen
          </Link>
        )}
      </div>

      {exams.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">No hay exámenes</h3>
          <p className="text-white/50">Aún no se han publicado exámenes en la plataforma.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div key={exam.id} className="glass-card p-6 hover:bg-white/10 transition-all flex flex-col h-full group">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-indigo-500/20 p-3 rounded-xl">
                  <FileText className="w-6 h-6 text-indigo-400" />
                </div>
                <span className="bg-white/10 text-white/50 text-xs font-medium px-2.5 py-1 rounded-full">
                  {new Date(exam.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{exam.title}</h3>
              <p className="text-white/60 text-sm mb-6 line-clamp-3 flex-grow">{exam.description || 'Sin descripción'}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Clock className="w-4 h-4 text-white/40" />
                  <span>{exam.time_limit ? `${exam.time_limit} min` : 'Sin límite'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Mínimo: {exam.min_score}</span>
                </div>
              </div>
              
              <Link 
                to={`/exams/${exam.id}/take`}
                className="w-full bg-white/10 text-white font-medium py-2.5 rounded-xl hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 mt-auto"
              >
                <PlayCircle className="w-5 h-5" />
                Comenzar Examen
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


