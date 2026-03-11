import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Trash2, Save, ArrowLeft, Image, Mic, Video, FileText, BookOpen } from 'lucide-react';

export default function CreateExam() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('exam');
  const [minScore, setMinScore] = useState(60);
  const [timeLimit, setTimeLimit] = useState(60);
  const [questions, setQuestions] = useState<any[]>([]);
  const [reinforcements, setReinforcements] = useState<any[]>([]);

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (id: string, file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        updateReinforcement(id, 'url', data.url);
      } else {
        alert('Error al subir el archivo');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Error al subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuestionFileUpload = async (id: string, file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        updateQuestion(id, 'media_url', data.url);
      } else {
        alert('Error al subir el archivo');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Error al subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const addReinforcement = () => {
    setReinforcements([
      ...reinforcements,
      {
        id: Date.now().toString(),
        title: '',
        description: '',
        type: 'pdf',
        url: ''
      }
    ]);
  };

  const updateReinforcement = (id: string, field: string, value: any) => {
    setReinforcements(reinforcements.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeReinforcement = (id: string) => {
    setReinforcements(reinforcements.filter(r => r.id !== id));
  };

  const addQuestion = (type: string) => {
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        type,
        text: '',
        points: 10,
        options: type === 'multiple_choice' ? ['', '', '', ''] : null,
        correct_answer: type === 'true_false' ? 'Verdadero' : '',
        media_url: '',
        media_type: ''
      }
    ]);
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const updateOption = (qId: string, index: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOptions = [...q.options];
        newOptions[index] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title,
          description,
          type,
          min_score: minScore,
          time_limit: timeLimit,
          questions,
          reinforcements
        })
      });
      
      if (res.ok) {
        navigate('/admin');
      } else {
        alert('Error al crear el examen');
      }
    } catch (err) {
      console.error('Error creating exam', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/admin')} className="p-2 bg-white/5 rounded-full shadow-sm hover:bg-white/10 transition-colors border border-white/10">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Crear Nuevo Examen</h1>
          <p className="text-white/60 mt-1">Diseña una evaluación interactiva y multimedia.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="glass-card p-8 space-y-6">
          <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4">Configuración General</h2>
          
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Título del Examen</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Evaluación Final de Matemáticas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Tipo de Evaluación</label>
            <select
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none [color-scheme:dark]"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="exam">Examen Formal (Requiere Programación)</option>
              <option value="practice">Quiz / Actividad de Práctica (Libre Acceso)</option>
            </select>
            <p className="text-xs text-white/40 mt-1">Los exámenes formales deben ser programados para cada estudiante. Las actividades de práctica están siempre disponibles.</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Descripción</label>
            <textarea
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instrucciones o detalles sobre el examen..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Puntaje Mínimo Aprobatorio</label>
              <input
                type="number"
                required
                min="0"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Límite de Tiempo (minutos)</label>
              <input
                type="number"
                min="0"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                placeholder="0 para sin límite"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Preguntas ({questions.length})</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => addQuestion('multiple_choice')} className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2 shadow-sm">
                <PlusCircle className="w-4 h-4" /> Opción Múltiple
              </button>
              <button type="button" onClick={() => addQuestion('true_false')} className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2 shadow-sm">
                <PlusCircle className="w-4 h-4" /> Verdadero/Falso
              </button>
              <button type="button" onClick={() => addQuestion('open')} className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2 shadow-sm">
                <FileText className="w-4 h-4" /> Texto Libre
              </button>
              <button type="button" onClick={() => addQuestion('oral')} className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2 shadow-sm">
                <Mic className="w-4 h-4" /> Respuesta Oral
              </button>
              <button type="button" onClick={() => addQuestion('info')} className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2 shadow-sm">
                <Image className="w-4 h-4" /> Bloque Info
              </button>
            </div>
          </div>

          {questions.map((q, index) => {
            const questionNumber = questions.slice(0, index + 1).filter((q: any) => q.type !== 'info').length;
            
            return (
            <div key={q.id} className="glass-card p-6 relative group">
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => removeQuestion(q.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                {q.type !== 'info' ? (
                  <span className="bg-indigo-500/20 text-indigo-400 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                    {questionNumber}
                  </span>
                ) : (
                  <span className="bg-blue-500/20 text-blue-400 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                    <Image className="w-4 h-4" />
                  </span>
                )}
                <span className="text-xs font-medium text-white/50 uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  {q.type === 'multiple_choice' ? 'Opción Múltiple' : q.type === 'true_false' ? 'Verdadero / Falso' : q.type === 'open' ? 'Texto Libre' : q.type === 'info' ? 'Bloque Informativo' : 'Respuesta Oral'}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Enunciado de la pregunta</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    value={q.text}
                    onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                    placeholder="Escribe la pregunta aquí..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Puntos</label>
                    <input
                      type="number"
                      required
                      min="0"
                      disabled={q.type === 'info'}
                      className={`w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${q.type === 'info' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      value={q.type === 'info' ? 0 : q.points}
                      onChange={(e) => updateQuestion(q.id, 'points', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Multimedia (Opcional)</label>
                    <div className="flex gap-2">
                      <select
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none [color-scheme:dark]"
                        value={q.media_type}
                        onChange={(e) => updateQuestion(q.id, 'media_type', e.target.value)}
                      >
                        <option value="">Ninguno</option>
                        <option value="image">Imagen URL</option>
                        <option value="audio">Audio URL</option>
                        <option value="video">Video URL</option>
                        <option value="text">Texto Largo</option>
                      </select>
                      {q.media_type && q.media_type !== 'text' && (
                        <div className="flex-grow flex gap-2 items-center">
                          <input
                            type="text"
                            className="flex-grow px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            value={q.media_url}
                            onChange={(e) => updateQuestion(q.id, 'media_url', e.target.value)}
                            placeholder="https://... o sube archivo"
                          />
                          <div className="relative">
                            <input
                              type="file"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleQuestionFileUpload(q.id, e.target.files[0]);
                                }
                              }}
                              disabled={isUploading}
                              accept={q.media_type === 'video' ? 'video/*' : q.media_type === 'audio' ? 'audio/*' : q.media_type === 'image' ? 'image/*' : '*/*'}
                            />
                            <button 
                              type="button" 
                              disabled={isUploading}
                              className="bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-xl font-medium border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors whitespace-nowrap"
                            >
                              {isUploading ? '...' : 'Subir'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {q.media_type === 'text' && (
                      <textarea
                        className="w-full mt-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y min-h-[100px]"
                        value={q.media_url}
                        onChange={(e) => updateQuestion(q.id, 'media_url', e.target.value)}
                        placeholder="Escribe el texto largo aquí (ej. lectura de comprensión)..."
                      />
                    )}
                  </div>
                </div>

                {q.type === 'multiple_choice' && (
                  <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <label className="block text-sm font-medium text-white/70 mb-3">Opciones de Respuesta</label>
                    <div className="space-y-3">
                      {q.options.map((opt: string, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correct_answer === opt && opt !== ''}
                            onChange={() => updateQuestion(q.id, 'correct_answer', opt)}
                            className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 border-white/20 bg-transparent"
                            title="Marcar como respuesta correcta"
                          />
                          <input
                            type="text"
                            required
                            className={`flex-grow px-4 py-2 bg-white/5 border rounded-xl focus:ring-2 outline-none transition-colors text-white ${
                              q.correct_answer === opt && opt !== '' 
                                ? 'border-emerald-500 focus:ring-emerald-500 bg-emerald-500/10' 
                                : 'border-white/10 focus:ring-indigo-500 focus:border-indigo-500'
                            }`}
                            value={opt}
                            onChange={(e) => {
                              updateOption(q.id, i, e.target.value);
                              if (q.correct_answer === opt) {
                                updateQuestion(q.id, 'correct_answer', e.target.value);
                              }
                            }}
                            placeholder={`Opción ${i + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-white/40 mt-3 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Selecciona el botón de radio para marcar la respuesta correcta.
                    </p>
                  </div>
                )}

                {q.type === 'true_false' && (
                  <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <label className="block text-sm font-medium text-white/70 mb-3">Respuesta Correcta</label>
                    <div className="flex gap-4">
                      {['Verdadero', 'Falso'].map((opt) => (
                        <label key={opt} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                          q.correct_answer === opt 
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-medium' 
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }`}>
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            value={opt}
                            checked={q.correct_answer === opt}
                            onChange={(e) => updateQuestion(q.id, 'correct_answer', e.target.value)}
                            className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 border-white/20 bg-transparent"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                {q.type === 'open' && (
                  <div className="mt-4 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-start gap-3">
                    <FileText className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-indigo-200">
                      El estudiante responderá a esta pregunta escribiendo texto libre. La calificación deberá realizarse manualmente.
                    </p>
                  </div>
                )}

                {q.type === 'info' && (
                  <div className="mt-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-start gap-3">
                    <Image className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-200">
                      Este bloque solo mostrará información (texto, imagen, video, etc.) y no requiere respuesta del estudiante. No tiene puntos.
                    </p>
                  </div>
                )}

                {q.type === 'oral' && (
                  <div className="mt-4 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-start gap-3">
                    <Mic className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-indigo-200">
                      Esta pregunta requerirá que el estudiante grabe su respuesta usando el micrófono. La calificación deberá realizarse manualmente por un docente.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )})}

          {questions.length === 0 && (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
              <p className="text-white/40 mb-4">No has agregado ninguna pregunta al examen.</p>
              <button type="button" onClick={() => addQuestion('multiple_choice')} className="bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-white/10 transition-colors inline-flex items-center gap-2 shadow-sm">
                <PlusCircle className="w-5 h-5" /> Agregar Primera Pregunta
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Material de Repaso ({reinforcements.length})</h2>
            <button type="button" onClick={addReinforcement} className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2 shadow-sm">
              <PlusCircle className="w-4 h-4" /> Agregar Material
            </button>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 px-4 py-3 rounded-xl flex items-start gap-3 text-sm">
            <BookOpen className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p>Este material se mostrará a los estudiantes que no aprueben el examen para ayudarles a repasar los temas.</p>
          </div>

          {reinforcements.map((r, index) => (
            <div key={r.id} className="glass-card p-6 relative group">
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => removeReinforcement(r.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-amber-500/20 text-amber-400 font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <span className="text-xs font-medium text-white/50 uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  Material de Repaso
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Título del Material</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      value={r.title}
                      onChange={(e) => updateReinforcement(r.id, 'title', e.target.value)}
                      placeholder="Ej: Video explicativo sobre fracciones"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Tipo de Material</label>
                    <select
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none [color-scheme:dark]"
                      value={r.type}
                      onChange={(e) => updateReinforcement(r.id, 'type', e.target.value)}
                    >
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                      <option value="pdf">Documento (PDF/Texto)</option>
                      <option value="exercise">Ejercicio Interactivo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Archivo o URL del Material</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      required
                      className="flex-grow px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      value={r.url}
                      onChange={(e) => updateReinforcement(r.id, 'url', e.target.value)}
                      placeholder="https://... o sube un archivo"
                    />
                    <div className="relative">
                      <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(r.id, e.target.files[0]);
                          }
                        }}
                        disabled={isUploading}
                        accept={r.type === 'video' ? 'video/*' : r.type === 'audio' ? 'audio/*' : r.type === 'pdf' ? '.pdf,.doc,.docx' : '*/*'}
                      />
                      <button 
                        type="button" 
                        disabled={isUploading}
                        className="bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-xl font-medium border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors whitespace-nowrap"
                      >
                        {isUploading ? 'Subiendo...' : 'Subir Archivo'}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Descripción (Opcional)</label>
                  <textarea
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y min-h-[80px]"
                    value={r.description}
                    onChange={(e) => updateReinforcement(r.id, 'description', e.target.value)}
                    placeholder="Breve descripción de lo que el estudiante aprenderá con este material..."
                  />
                </div>
              </div>
            </div>
          ))}

          {reinforcements.length === 0 && (
            <div className="text-center py-8 bg-white/5 rounded-2xl border border-dashed border-white/10">
              <p className="text-white/40 mb-4">No has agregado material de repaso.</p>
              <button type="button" onClick={addReinforcement} className="bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-white/10 transition-colors inline-flex items-center gap-2 shadow-sm">
                <PlusCircle className="w-5 h-5" /> Agregar Material
              </button>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-[#1e40af]/80 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg z-10">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <p className="text-white/60 font-medium">
              Total preguntas: <span className="text-white font-bold">{questions.length}</span>
            </p>
            <button
              type="submit"
              disabled={questions.length === 0}
              className={`px-8 py-3 rounded-xl font-bold text-lg flex items-center gap-2 transition-colors shadow-sm ${
                questions.length === 0 
                  ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <Save className="w-5 h-5" /> Guardar Examen
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
