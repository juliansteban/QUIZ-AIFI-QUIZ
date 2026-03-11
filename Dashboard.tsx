import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle, XCircle, Clock, ArrowRight, Settings, PlusCircle, PlayCircle } from 'lucide-react';

export default function Dashboard({ user }: { user: any }) {
  const [results, setResults] = useState<any[]>([]);
  const [scheduledExams, setScheduledExams] = useState<any[]>([]);
  const [practiceExams, setPracticeExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user.role === 'student') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [resultsRes, scheduledRes, practiceRes] = await Promise.all([
        fetch('/api/results/my', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/schedule', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/exams/practice', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      if (resultsRes.ok) {
        setResults(await resultsRes.json());
      }
      if (scheduledRes.ok) {
        setScheduledExams(await scheduledRes.json());
      }
      if (practiceRes.ok) {
        setPracticeExams(await practiceRes.json());
      }
    } catch (err) {
      console.error('Error fetching data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20">Cargando...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Bienvenido, {user.name}</h1>
        <p className="text-white/60 mt-2">Panel de control principal de EduPlatform Pro</p>
      </div>

      {user.role === 'admin' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/admin" className="glass-card p-6 hover:bg-white/20 transition-all group">
            <div className="bg-indigo-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-500/30 transition-colors">
              <Settings className="w-6 h-6 text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-white">Panel de Administración</h2>
            <p className="text-white/60 mb-4">Gestiona exámenes, preguntas y material de refuerzo.</p>
            <div className="flex items-center text-indigo-400 font-medium">
              Ir al panel <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
          <Link to="/admin/exams/create" className="glass-card p-6 hover:bg-white/20 transition-all group">
            <div className="bg-emerald-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500/30 transition-colors">
              <PlusCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-white">Crear Nuevo Examen</h2>
            <p className="text-white/60 mb-4">Diseña una nueva evaluación con preguntas multimedia y orales.</p>
            <div className="flex items-center text-emerald-400 font-medium">
              Crear examen <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Scheduled Exams Section */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-white">
              <Clock className="w-5 h-5 text-indigo-400" />
              Exámenes Programados
            </h2>
            
            {scheduledExams.filter(s => s.status === 'pending' || s.status === 'failed_once').length === 0 ? (
              <div className="text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10">
                <p className="text-white/50">No tienes exámenes programados pendientes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scheduledExams.filter(s => s.status === 'pending' || s.status === 'failed_once').map((schedule) => {
                  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
                  const isToday = schedule.scheduled_date === today;
                  
                  return (
                    <div key={schedule.id} className="bg-white/5 p-5 rounded-xl border border-white/10 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-white text-lg">{schedule.exam_title}</h3>
                          {schedule.status === 'failed_once' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
                              Reintento
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/60 mb-4 line-clamp-2">{schedule.exam_description}</p>
                        <div className="flex items-center gap-2 text-sm font-medium text-white/70 mb-4">
                          <Clock className="w-4 h-4" />
                          Fecha programada: {new Date(schedule.scheduled_date + 'T12:00:00').toLocaleDateString()}
                        </div>
                      </div>
                      
                      {isToday ? (
                        <Link 
                          to={`/exams/${schedule.exam_id}/take`}
                          className="w-full bg-indigo-600 text-white text-center py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                        >
                          Presentar Examen Ahora
                        </Link>
                      ) : (
                        <button 
                          disabled
                          className="w-full bg-white/5 text-white/30 text-center py-2.5 rounded-xl font-medium cursor-not-allowed"
                        >
                          Disponible el {new Date(schedule.scheduled_date + 'T12:00:00').toLocaleDateString()}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Practice Exams Section */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-white">
              <PlayCircle className="w-5 h-5 text-emerald-400" />
              Quizzes y Actividades de Práctica
            </h2>
            
            {practiceExams.length === 0 ? (
              <div className="text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10">
                <p className="text-white/50">No hay actividades de práctica disponibles en este momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {practiceExams.map((exam) => (
                  <div key={exam.id} className="bg-white/5 p-5 rounded-xl border border-white/10 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-white text-lg mb-1">{exam.title}</h3>
                      <p className="text-sm text-white/60 mb-4 line-clamp-2">{exam.description}</p>
                      <div className="flex items-center gap-2 text-sm font-medium text-white/70 mb-4">
                        <Clock className="w-4 h-4" />
                        Tiempo límite: {exam.time_limit ? `${exam.time_limit} min` : 'Sin límite'}
                      </div>
                    </div>
                    
                    <Link 
                      to={`/exams/${exam.id}/take`}
                      className="w-full bg-emerald-600 text-white text-center py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                    >
                      Practicar Ahora
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Mi Historial Académico
              </h2>
            </div>
            
            {results.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/10">
                <p className="text-white/50">Aún no has presentado ningún examen.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-sm text-white/50">
                      <th className="pb-3 font-medium">Examen</th>
                      <th className="pb-3 font-medium">Tipo</th>
                      <th className="pb-3 font-medium">Fecha</th>
                      <th className="pb-3 font-medium">Puntaje</th>
                      <th className="pb-3 font-medium">Estado</th>
                      <th className="pb-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {results.map((result) => (
                      <tr key={result.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="py-4 font-medium text-white">{result.exam_title}</td>
                        <td className="py-4">
                          {result.exam_type === 'practice' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400">
                              Práctica
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-400">
                              Formal
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-white/70">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(result.completed_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="font-semibold text-white">{result.score}</span>
                          <span className="text-white/40 text-xs ml-1">/ {result.min_score} min</span>
                        </td>
                        <td className="py-4">
                          {result.passed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                              <CheckCircle className="w-3.5 h-3.5" /> Aprobado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                              <XCircle className="w-3.5 h-3.5" /> Reprobado
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Link to={`/results/${result.id}`} className="text-indigo-400 hover:text-indigo-300 font-medium">
                              Ver Detalles
                            </Link>
                            {!result.passed && (
                              <Link to={`/reinforcement/${result.exam_id}`} className="text-amber-400 hover:text-amber-300 font-medium ml-4">
                                Material de Refuerzo
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


