import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';

export default function ExamResults({ user }: { user: any }) {
  const { id } = useParams();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [id]);

  const fetchResult = async () => {
    try {
      const res = await fetch(`/api/results/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Error fetching result', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-white">Cargando resultados...</div>;
  if (!result) return <div className="text-center py-20 text-red-400">Resultado no encontrado.</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
      </Link>

      <div className="glass-card overflow-hidden mb-8">
        <div className={`p-8 text-center text-white ${result.passed ? 'bg-emerald-600/40' : 'bg-red-600/40'} backdrop-blur-md`}>
          {result.passed ? (
            <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-90" />
          ) : (
            <XCircle className="w-16 h-16 mx-auto mb-4 opacity-90" />
          )}
          <h1 className="text-3xl font-bold mb-2">
            {result.exam_type === 'practice' 
              ? (result.passed ? '¡Práctica Completada!' : 'Práctica Finalizada')
              : (result.passed ? '¡Examen Aprobado!' : 'Examen Reprobado')}
          </h1>
          <p className="text-lg opacity-90">{result.exam_title}</p>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center border-b border-white/10">
          <div>
            <p className="text-sm text-white/50 font-medium mb-1 uppercase tracking-wider">Puntaje Obtenido</p>
            <p className="text-3xl font-bold text-white">{result.score}</p>
          </div>
          <div className="border-l border-r border-white/10">
            <p className="text-sm text-white/50 font-medium mb-1 uppercase tracking-wider">Puntaje Mínimo</p>
            <p className="text-3xl font-bold text-white">{result.min_score}</p>
          </div>
          <div>
            <p className="text-sm text-white/50 font-medium mb-1 uppercase tracking-wider">Fecha</p>
            <p className="text-lg font-semibold text-white mt-2">{new Date(result.completed_at).toLocaleDateString()}</p>
          </div>
        </div>

        {!result.passed && (
          <div className="p-8 bg-amber-500/10 border-b border-white/10 flex flex-col items-center text-center backdrop-blur-sm">
            <div className="bg-amber-500/20 p-3 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-amber-200 mb-2">Necesitas Refuerzo Académico</h3>
            <p className="text-amber-100/70 mb-6 max-w-lg">
              No has alcanzado el puntaje mínimo requerido. Hemos preparado material de estudio específico para ayudarte a mejorar en los temas donde tuviste dificultades.
            </p>
            <Link 
              to={`/reinforcement/${result.exam_id}`}
              className="bg-amber-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              Acceder al Material de Refuerzo
            </Link>
          </div>
        )}

        <div className="p-8">
          <h3 className="text-xl font-bold text-white mb-6">Detalle de Respuestas</h3>
          <div className="space-y-6">
            {result.answers.map((ans: any, index: number) => (
              <div key={ans.id} className="bg-white/5 p-5 rounded-xl border border-white/10">
                <div className="flex items-start justify-between mb-3">
                  <p className="font-medium text-white pr-4">
                    <span className="text-white/40 mr-2">{index + 1}.</span>
                    {ans.question_text}
                  </p>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${
                    ans.is_correct ? 'bg-emerald-500/20 text-emerald-400' : 
                    (ans.question_type === 'open' || ans.question_type === 'oral') ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {ans.is_correct ? `+${ans.points_awarded} pts` : 
                     (ans.question_type === 'open' || ans.question_type === 'oral') ? 'Pendiente' : '0 pts'}
                  </span>
                </div>
                
                <div className="mt-3 pl-6 border-l-2 border-white/10">
                  <p className="text-sm text-white/40 mb-1">Tu respuesta:</p>
                  {ans.answer_media_url ? (
                    <audio src={ans.answer_media_url} controls className="h-10 mt-2 [color-scheme:dark]" />
                  ) : (
                    <p className={`font-medium ${ans.is_correct ? 'text-emerald-400' : 'text-white/80'}`}>
                      {ans.answer_text || <span className="text-white/30 italic">Sin responder</span>}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
