import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, Square, Play, AlertTriangle, Clock } from 'lucide-react';

export default function TakeExam({ user }: { user: any }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordingQuestionId, setRecordingQuestionId] = useState<string | null>(null);

  useEffect(() => {
    fetchExam();
    
    // Anti-copy measures
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    
    document.addEventListener('copy', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu);
    
    // Attempt full screen
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => console.log("Fullscreen blocked"));
    }

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('contextmenu', handleContextMenu);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log("Exit fullscreen error"));
      }
    };
  }, [id]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev! - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchExam = async () => {
    try {
      const res = await fetch(`/api/exams/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setExam(data);
        if (data.time_limit) {
          setTimeLeft(data.time_limit * 60);
        }
      } else {
        setError(data.error || 'Error al cargar el examen');
      }
    } catch (err) {
      console.error('Error fetching exam', err);
      setError('Error de conexión');
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const startRecording = async (questionId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result;
          handleAnswerChange(questionId, { type: 'audio', data: base64data });
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingQuestionId(questionId);
      setAudioChunks([]);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordingQuestionId(null);
    }
  };

  const handleSubmit = async () => {
    if (!exam) return;
    
    // Format answers for API
    const formattedAnswers = exam.questions
      .filter((q: any) => q.type !== 'info')
      .map((q: any) => {
      const ans = answers[q.id];
      return {
        question_id: q.id,
        answer_text: ans?.type !== 'audio' ? (typeof ans === 'object' ? JSON.stringify(ans) : ans) : null,
        answer_media_url: ans?.type === 'audio' ? ans.data : null
      };
    });

    try {
      const res = await fetch(`/api/exams/${id}/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ answers: formattedAnswers })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => console.log(err));
        }
        navigate(`/results/${data.attemptId}`);
      }
    } catch (err) {
      console.error('Error submitting exam', err);
    }
  };

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-20 glass-card p-8 text-center border-red-500/20">
        <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
        <p className="text-white/70 mb-6">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  if (!exam) return <div className="text-center py-20 text-white">Cargando examen...</div>;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto glass-card p-8 select-none">
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white">{exam.title}</h1>
          <p className="text-white/50 text-sm mt-1">{exam.description}</p>
        </div>
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold backdrop-blur-md border ${timeLeft < 300 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'}`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 px-4 py-3 rounded-xl mb-8 flex items-start gap-3 text-sm backdrop-blur-sm">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <p><strong>Modo Seguro Activado:</strong> Copiar, pegar y el clic derecho están deshabilitados. Se recomienda mantener la pantalla completa.</p>
      </div>

      <div className="space-y-10">
        {exam.questions.map((q: any, index: number) => {
          const questionNumber = exam.questions.slice(0, index + 1).filter((q: any) => q.type !== 'info').length;
          
          return (
          <div key={q.id} className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-medium text-white mb-4">
              {q.type !== 'info' && <span className="text-indigo-400 font-bold mr-2">{questionNumber}.</span>}
              {q.text}
            </h3>
            
            {q.media_url && (
              <div className="mb-6 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                {q.media_type === 'image' && <img src={q.media_url} alt="Question media" className="max-w-full h-auto max-h-64 object-contain mx-auto" />}
                {q.media_type === 'audio' && <audio src={q.media_url} controls className="w-full [color-scheme:dark]" />}
                {q.media_type === 'video' && <video src={q.media_url} controls className="w-full max-h-64" />}
                {q.media_type === 'text' && (
                  <div className="p-6 bg-white/5 text-white/80 whitespace-pre-wrap font-medium">
                    {q.media_url}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              {q.type === 'multiple_choice' && q.options && (
                <div className="space-y-3">
                  {JSON.parse(q.options).map((opt: string, i: number) => (
                    <label key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/30 cursor-pointer transition-colors group">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="w-4 h-4 text-indigo-500 focus:ring-indigo-500 border-white/20 bg-transparent"
                      />
                      <span className="text-white/80 group-hover:text-white">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'true_false' && (
                <div className="flex gap-4">
                  {['Verdadero', 'Falso'].map((opt) => (
                    <label key={opt} className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/30 cursor-pointer transition-colors group">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="w-4 h-4 text-indigo-500 focus:ring-indigo-500 border-white/20 bg-transparent"
                      />
                      <span className="font-medium text-white/80 group-hover:text-white">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {(q.type === 'open' || q.type === 'fill_blanks') && (
                <textarea
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y min-h-[100px]"
                  placeholder="Escribe tu respuesta aquí..."
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                />
              )}

              {q.type === 'oral' && (
                <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
                  {answers[q.id]?.type === 'audio' ? (
                    <div className="space-y-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-2">
                        <Play className="w-8 h-8 text-emerald-400 ml-1" />
                      </div>
                      <p className="text-emerald-400 font-medium">Audio grabado con éxito</p>
                      <audio src={answers[q.id].data} controls className="w-full max-w-md mx-auto [color-scheme:dark]" />
                      <button
                        onClick={() => handleAnswerChange(q.id, null)}
                        className="text-sm text-red-400 hover:underline font-medium mt-2"
                      >
                        Eliminar y grabar de nuevo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isRecording && recordingQuestionId === q.id ? (
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                            <Mic className="w-8 h-8 text-red-400" />
                          </div>
                          <p className="text-red-400 font-medium mb-4">Grabando...</p>
                          <button
                            onClick={stopRecording}
                            className="bg-red-600 text-white px-6 py-2 rounded-full font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                          >
                            <Square className="w-4 h-4" /> Detener Grabación
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                            <Mic className="w-8 h-8 text-white/60" />
                          </div>
                          <p className="text-white/60 mb-4">Haz clic para comenzar a grabar tu respuesta oral.</p>
                          <button
                            onClick={() => startRecording(q.id)}
                            disabled={isRecording}
                            className={`px-6 py-2 rounded-full font-medium flex items-center gap-2 transition-colors ${
                              isRecording 
                                ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                          >
                            <Mic className="w-4 h-4" /> Iniciar Grabación
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )})}
      </div>

      <div className="mt-10 pt-6 border-t border-white/10 flex justify-end">
        <button
          onClick={handleSubmit}
          className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          {exam.type === 'practice' ? 'Finalizar Práctica' : 'Finalizar Examen'}
        </button>
      </div>
    </div>
  );
}
