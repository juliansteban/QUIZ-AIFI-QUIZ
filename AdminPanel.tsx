import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Users, FileText, BarChart2, PlusCircle, Edit, Trash2, AlertCircle, CheckCircle, UserPlus, X, Calendar } from 'lucide-react';

export default function AdminPanel() {
  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [scheduledExams, setScheduledExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state for creating a teacher
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherError, setTeacherError] = useState('');
  const [teacherSuccess, setTeacherSuccess] = useState('');

  // Modal state for scheduling an exam
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleExamId, setScheduleExamId] = useState('');
  const [scheduleStudentId, setScheduleStudentId] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [examsRes, resultsRes, studentsRes, scheduleRes] = await Promise.all([
        fetch('/api/exams', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/results/all', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/auth/students', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/schedule', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      ]);
      
      if (examsRes.ok) setExams(await examsRes.json());
      if (resultsRes.ok) setResults(await resultsRes.json());
      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (scheduleRes.ok) setScheduledExams(await scheduleRes.json());
    } catch (err) {
      console.error('Error fetching data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError('');
    setTeacherSuccess('');
    
    try {
      const res = await fetch('/api/auth/register-teacher', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: teacherName, email: teacherEmail, password: teacherPassword }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setTeacherSuccess('Docente creado exitosamente');
        setTeacherName('');
        setTeacherEmail('');
        setTeacherPassword('');
        setTimeout(() => {
          setShowTeacherModal(false);
          setTeacherSuccess('');
        }, 2000);
      } else {
        setTeacherError(data.error || 'Error al crear docente');
      }
    } catch (err) {
      setTeacherError('Error de conexión');
    }
  };

  const handleScheduleExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError('');
    setScheduleSuccess('');
    
    if (!scheduleExamId || !scheduleStudentId || !scheduleDate) {
      setScheduleError('Todos los campos son obligatorios');
      return;
    }

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          exam_id: scheduleExamId, 
          student_id: scheduleStudentId, 
          scheduled_date: scheduleDate 
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setScheduleSuccess('Examen programado exitosamente');
        setScheduleExamId('');
        setScheduleStudentId('');
        setScheduleDate('');
        
        // Refresh scheduled exams
        const scheduleRes = await fetch('/api/schedule', { 
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
        });
        if (scheduleRes.ok) setScheduledExams(await scheduleRes.json());

        setTimeout(() => {
          setShowScheduleModal(false);
          setScheduleSuccess('');
        }, 2000);
      } else {
        setScheduleError(data.error || 'Error al programar examen');
      }
    } catch (err) {
      setScheduleError('Error de conexión');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta programación?')) return;
    
    try {
      const res = await fetch(`/api/schedule/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (res.ok) {
        setScheduledExams(scheduledExams.filter(s => s.id !== id));
      } else {
        alert('Error al eliminar la programación');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  if (loading) return <div className="text-center py-20 text-white">Cargando panel...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-indigo-400" />
            Panel de Administración
          </h1>
          <p className="text-white/70 mt-2">Gestiona usuarios, exámenes y estadísticas de la plataforma.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowScheduleModal(true)}
            className="bg-white/10 text-white border border-white/20 px-6 py-2.5 rounded-xl font-medium hover:bg-white/20 transition-colors shadow-sm flex items-center gap-2 backdrop-blur-sm"
          >
            <Calendar className="w-5 h-5" /> Programar Examen
          </button>
          <button 
            onClick={() => setShowTeacherModal(true)}
            className="bg-white/10 text-emerald-400 border border-emerald-500/30 px-6 py-2.5 rounded-xl font-medium hover:bg-white/20 transition-colors shadow-sm flex items-center gap-2 backdrop-blur-sm"
          >
            <UserPlus className="w-5 h-5" /> Registrar Docente
          </button>
          <Link to="/admin/exams/create" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
            <PlusCircle className="w-5 h-5" /> Nuevo Examen
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="bg-indigo-500/20 p-4 rounded-xl">
            <FileText className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/50 uppercase tracking-wider">Total Exámenes</p>
            <p className="text-3xl font-bold text-white">{exams.length}</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="bg-emerald-500/20 p-4 rounded-xl">
            <Users className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/50 uppercase tracking-wider">Intentos Registrados</p>
            <p className="text-3xl font-bold text-white">{results.length}</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="bg-amber-500/20 p-4 rounded-xl">
            <BarChart2 className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/50 uppercase tracking-wider">Tasa de Aprobación</p>
            <p className="text-3xl font-bold text-white">
              {results.length > 0 ? Math.round((results.filter(r => r.passed).length / results.length) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Exámenes Recientes */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Exámenes Recientes</h2>
            <Link to="/exams" className="text-sm font-medium text-indigo-400 hover:underline">Ver todos</Link>
          </div>
          
          {exams.length === 0 ? (
            <div className="text-center py-12 bg-white/5">
              <p className="text-white/50">No hay exámenes creados aún.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-sm text-white/50 border-b border-white/10">
                    <th className="px-6 py-3 font-medium">Título</th>
                    <th className="px-6 py-3 font-medium">Tipo</th>
                    <th className="px-6 py-3 font-medium">Puntaje Min.</th>
                    <th className="px-6 py-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{exam.title}</td>
                      <td className="px-6 py-4">
                        {exam.type === 'practice' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">
                            Práctica
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300">
                            Examen Formal
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white/70">
                          {exam.min_score} pts
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button className="text-white/40 hover:text-indigo-400 transition-colors" title="Editar">
                            <Edit className="w-5 h-5" />
                          </button>
                          <button className="text-white/40 hover:text-red-400 transition-colors" title="Eliminar">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resultados de Estudiantes */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Resultados de Estudiantes</h2>
          </div>
          
          {results.length === 0 ? (
            <div className="text-center py-12 bg-white/5">
              <p className="text-white/50">No hay resultados registrados aún.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-sm text-white/50 border-b border-white/10">
                    <th className="px-6 py-3 font-medium">Estudiante</th>
                    <th className="px-6 py-3 font-medium">Examen</th>
                    <th className="px-6 py-3 font-medium">Tipo</th>
                    <th className="px-6 py-3 font-medium">Puntaje</th>
                    <th className="px-6 py-3 font-medium text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {results.map((result) => (
                    <tr key={result.id} className="border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{result.student_name}</p>
                        <p className="text-xs text-white/50">{result.student_email}</p>
                      </td>
                      <td className="px-6 py-4 text-white/70">{result.exam_title}</td>
                      <td className="px-6 py-4">
                        {result.exam_type === 'practice' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-300">
                            Práctica
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-300">
                            Formal
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{result.score} pts</td>
                      <td className="px-6 py-4 text-center">
                        {result.passed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">
                            <CheckCircle className="w-3 h-3" /> Aprobado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
                            <AlertCircle className="w-3 h-3" /> Reprobado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Programaciones */}
      <div className="glass-card overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Exámenes Programados</h2>
        </div>
        
        {scheduledExams.length === 0 ? (
          <div className="text-center py-12 bg-white/5">
            <p className="text-white/50">No hay exámenes programados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-sm text-white/50 border-b border-white/10">
                  <th className="px-6 py-3 font-medium">Estudiante</th>
                  <th className="px-6 py-3 font-medium">Examen</th>
                  <th className="px-6 py-3 font-medium">Fecha</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {scheduledExams.map((schedule) => (
                  <tr key={schedule.id} className="border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{schedule.student_name}</p>
                      <p className="text-xs text-white/50">{schedule.student_email}</p>
                    </td>
                    <td className="px-6 py-4 text-white/70">{schedule.exam_title}</td>
                    <td className="px-6 py-4 font-medium text-white">{new Date(schedule.scheduled_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {schedule.status === 'pending' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300">
                          Pendiente
                        </span>
                      ) : schedule.status === 'completed' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">
                          Completado
                        </span>
                      ) : schedule.status === 'failed_once' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300">
                          Fallido (Reintento Disp.)
                        </span>
                      ) : schedule.status === 'failed_final' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
                          Reprobado Definitivo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
                          Perdido
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="text-white/40 hover:text-red-400 transition-colors" 
                        title="Eliminar Programación"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Docente */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-md w-full overflow-hidden border-white/20">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-emerald-500/10">
              <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                <UserPlus className="w-5 h-5" /> Registrar Nuevo Docente
              </h3>
              <button 
                onClick={() => setShowTeacherModal(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {teacherError && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{teacherError}</p>}
              {teacherSuccess && <p className="text-emerald-400 text-sm mb-4 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {teacherSuccess}</p>}
              
              <form onSubmit={handleCreateTeacher} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Contraseña</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                  />
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTeacherModal(false)}
                    className="px-4 py-2 text-white/70 font-medium hover:bg-white/10 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Crear Docente
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Modal Programar Examen */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-md w-full overflow-hidden border-white/20">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-indigo-500/10">
              <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Programar Examen
              </h3>
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {scheduleError && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{scheduleError}</p>}
              {scheduleSuccess && <p className="text-emerald-400 text-sm mb-4 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {scheduleSuccess}</p>}
              
              <form onSubmit={handleScheduleExam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Estudiante</label>
                  <select
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none"
                    value={scheduleStudentId}
                    onChange={(e) => setScheduleStudentId(e.target.value)}
                  >
                    <option value="" className="bg-slate-900">Seleccionar estudiante...</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id} className="bg-slate-900">{student.name} ({student.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Examen</label>
                  <select
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none"
                    value={scheduleExamId}
                    onChange={(e) => setScheduleExamId(e.target.value)}
                  >
                    <option value="" className="bg-slate-900">Seleccionar examen...</option>
                    {exams.filter(e => e.type !== 'practice').map(exam => (
                      <option key={exam.id} value={exam.id} className="bg-slate-900">{exam.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Fecha Programada</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none [color-scheme:dark]"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 text-white/70 font-medium hover:bg-white/10 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Programar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
