import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PlayCircle, FileText, Headphones, BookOpen, ArrowLeft, RefreshCw } from 'lucide-react';

export default function Reinforcement({ user }: { user: any }) {
  const { examId } = useParams();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMaterials();
  }, [examId]);

  const fetchMaterials = async () => {
    try {
      const res = await fetch(`/api/reinforcement/${examId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Error fetching materials');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-white">Cargando material de refuerzo...</div>;
  if (error) return <div className="text-center py-20 text-red-400">{error}</div>;

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlayCircle className="w-8 h-8 text-blue-400" />;
      case 'pdf': return <FileText className="w-8 h-8 text-red-400" />;
      case 'audio': return <Headphones className="w-8 h-8 text-amber-400" />;
      case 'exercise': return <BookOpen className="w-8 h-8 text-emerald-400" />;
      default: return <FileText className="w-8 h-8 text-white/40" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
      </Link>

      <div className="glass-card p-8 mb-8 text-center">
        <div className="bg-amber-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Material de Refuerzo</h1>
        <p className="text-white/60 max-w-2xl mx-auto">
          Hemos seleccionado este material específicamente para ayudarte a dominar los temas del examen. Revisa cada recurso cuidadosamente antes de intentar la evaluación nuevamente.
        </p>
      </div>

      {materials.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/10">
          <p className="text-white/40">No hay material de refuerzo disponible para este examen.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {materials.map((mat) => (
            <div key={mat.id} className="glass-card p-6 hover:bg-white/10 transition-all flex items-start gap-4">
              <div className="bg-white/5 p-3 rounded-xl shrink-0">
                {getIcon(mat.type)}
              </div>
              <div className="flex-grow w-full overflow-hidden">
                <h3 className="text-lg font-bold text-white mb-1">{mat.title}</h3>
                <p className="text-sm text-white/50 mb-4">{mat.description}</p>
                
                {mat.type === 'video' && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-white/10 bg-black">
                    <video src={mat.url} controls className="w-full max-h-64 object-contain" />
                  </div>
                )}
                
                {mat.type === 'audio' && (
                  <div className="mb-4">
                    <audio src={mat.url} controls className="w-full [color-scheme:dark]" />
                  </div>
                )}

                <a 
                  href={mat.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {mat.type === 'video' || mat.type === 'audio' ? 'Abrir en nueva pestaña' : 'Descargar / Abrir recurso'} <ArrowLeft className="w-4 h-4 rotate-135" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <p className="text-white/60 mb-4">¿Te sientes listo para intentarlo de nuevo?</p>
        <Link 
          to={`/exams/${examId}/take`}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <RefreshCw className="w-5 h-5" />
          Reintentar Examen
        </Link>
      </div>
    </div>
  );
}
