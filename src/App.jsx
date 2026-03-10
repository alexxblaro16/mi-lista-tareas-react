import { useState, useMemo, useEffect, useRef } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import useDebounce from './hooks/useDebounce' 
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react'

// --- DICCIONARIO DE TRADUCCIONES ---
const translations = {
  es: {
    name: "Español", flag: "🇪🇸", title: "FOCUS", subtitle: "NÚCLEO CUÁNTICO",
    progress: "SINCRONIZACIÓN DEL SISTEMA", active: "MISIONES ACTIVAS", placeholder: "¿Cuál es tu misión hoy?",
    add: "DESPLEGAR", search: "Escanear base de datos...", hide: "Ocultar Finalizadas",
    status: "ESTADO", done: "LOGRADO", total: "Tasks", wipe: "BORRADO TOTAL",
    confirm: "¿Someter sistema a purga total?", priority: "Prioridad",
    low: "BAJA", medium: "MEDIA", high: "ALTA",
    helpTitle: "Manual de Operaciones",
    helpIntro: "Protocolos de sistema activos. Bienvenido al centro de control de FOCUS:",
    helpConcept1: "Memoria Persistente: Implementación de LocalStorage de alta fidelidad. Tus misiones se cifran y guardan localmente al instante, garantizando la persistencia de datos tras reinicios del sistema.",
    helpConcept2: "Filtro de Ruido (Debounce): Motor de búsqueda optimizado que reduce la carga computacional, procesando el escaneo de la base de datos solo tras pausas en la entrada del usuario.",
    helpConcept3: "Interfaz Aero-3D: Entorno inmersivo con física de inclinación adaptativa. Los paneles táctiles reaccionan a la posición del puntero para generar una respuesta física y profundidad real.",
    helpConcept4: "Confirmación Visual: Sincronización validada por ciclos de núcleo. Indicadores LED notifican en tiempo real cada guardado exitoso y cambio en el estado del sistema.",
    cloudActive: "NUBE ACTIVA", cloudConnecting: "CONECTANDO...",
    empty: "ESCANEO COMPLETADO. SIN MISIONES ACTIVAS.",
    syncing: "SYNCING", saved: "OK",
    devBy: "FOCUS — DESARROLLADO POR ALEXXBLARO"
  },
  en: {
    name: "English", flag: "🇺🇸", title: "FOCUS", subtitle: "QUANTUM CORE",
    progress: "SYSTEM SYNC RATE", active: "ACTIVE MISSIONS", placeholder: "What is your directive?",
    add: "DEPLOY", search: "Scanning database...", hide: "Hide Completed",
    status: "STATUS", done: "DONE", total: "Tasks", wipe: "FULL WIPE",
    confirm: "Confirm full system purge?", priority: "Priority",
    low: "GAMMA", medium: "BETA", high: "ALFA",
    helpTitle: "Operations Manual",
    helpIntro: "System protocols active. Welcome to the FOCUS control center:",
    helpConcept1: "Persistent Memory: High-fidelity LocalStorage implementation. Your missions are saved locally instantly, ensuring data survives system reboots.",
    helpConcept2: "Noise Filter (Debounce): Optimized search engine that reduces computational load by processing scans only after user input pauses.",
    helpConcept3: "Aero-3D Interface: Immersive environment with adaptive Tilt physics. Touch panels react to pointer position for real depth and physical feedback.",
    helpConcept4: "Visual Confirmation: Core-validated sync cycles. LED indicators notify in real-time of every successful save and state change.",
    cloudActive: "CLOUD ACTIVE", cloudConnecting: "CONNECTING...",
    empty: "SCAN COMPLETE. NO ACTIVE DIRECTIVES.",
    syncing: "SYNCING", saved: "OK",
    devBy: "FOCUS — DEVELOPED BY ALEXXBLARO"
  }
}

// --- COMPONENTE: BARRA DE PROGRESO LÍQUIDA ---
const LiquidProgressBar = ({ percent, theme }) => (
  <div className={`w-full h-4 rounded-full overflow-hidden relative ${theme === 'dark' ? 'bg-black/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]' : 'bg-slate-200 shadow-inner'}`}>
    <motion.div 
      initial={{ width: 0 }} animate={{ width: `${percent}%` }}
      transition={{ type: "spring", stiffness: 50, damping: 15 }}
      className="h-full bg-gradient-to-r from-indigo-700 via-indigo-500 to-cyan-400 relative overflow-hidden rounded-full shadow-[0_0_15px_rgba(79,102,241,0.3)]"
    >
      <motion.svg animate={{ x: [-100, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="absolute -top-[100%] left-0 h-[300%] w-[200%] opacity-30 fill-white" viewBox="0 0 100 20" preserveAspectRatio="none">
        <path d="M0 10 Q 25 5 50 10 T 100 10 V 20 H 0 Z" />
      </motion.svg>
    </motion.div>
  </div>
)

// --- COMPONENTE TILT 3D ---
function TiltCard({ children, theme, priority }) {
  const x = useMotionValue(0); const y = useMotionValue(0);
  const rotateX = useTransform(y, [-60, 60], [12, -12]);
  const rotateY = useTransform(x, [-60, 60], [-12, 12]);

  const priorityStyles = {
    high: theme === 'dark' ? 'border-l-rose-500 shadow-rose-500/10' : 'border-l-rose-600 shadow-rose-100',
    medium: theme === 'dark' ? 'border-l-amber-500 shadow-amber-500/10' : 'border-l-amber-500 shadow-amber-100',
    low: theme === 'dark' ? 'border-l-sky-500 shadow-sky-500/10' : 'border-l-sky-500 shadow-sky-100'
  }

  return (
    <motion.div style={{ perspective: 1200 }} onMouseMove={(e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      x.set(e.clientX - rect.left - rect.width / 2); y.set(e.clientY - rect.top - rect.height / 2);
    }} onMouseLeave={() => { x.set(0); y.set(0); }}>
      <motion.div style={{ rotateX, rotateY }} className={`relative group flex items-center gap-5 p-6 border rounded-[2rem] transition-all duration-500 shadow-2xl ${
          theme === 'dark' ? 'bg-white/[0.04] border-white/10 backdrop-blur-md' : 'bg-white border-slate-200 shadow-sm'
        } border-l-[6px] ${priorityStyles[priority]}`}>
        {children}
      </motion.div>
    </motion.div>
  );
}

function App() {
  const [tasks, setTasks] = useLocalStorage('tasks-ultra-v16', [])
  const [lang, setLang] = useState('es'); const [theme, setTheme] = useState('dark')
  const [isHelpOpen, setIsHelpOpen] = useState(false) 
  const [taskText, setTaskText] = useState(''); const [priority, setPriority] = useState('medium')
  const [search, setSearch] = useState(''); const [hideCompleted, setHideCompleted] = useState(false)
  const [isSaved, setIsSaved] = useState(false); const [isCloudActive, setIsCloudActive] = useState(false)
  const [cloudStatus, setCloudStatus] = useState('idle')

  const t = translations[lang]; const debouncedSearch = useDebounce(search, 300)
  const helpRef = useRef(null)

  const mouseX = useMotionValue(0); const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 });

  useEffect(() => {
    const handleMove = (e) => { mouseX.set(e.clientX); mouseY.set(e.clientY); };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  const toggleCloud = async () => {
    if (!isCloudActive) {
      setCloudStatus('connecting');
      try {
        await fetch('https://jsonplaceholder.typicode.com/todos/1'); 
        setTimeout(() => { setIsCloudActive(true); setCloudStatus('online'); }, 1200);
      } catch (err) { setCloudStatus('idle'); }
    } else { setIsCloudActive(false); setCloudStatus('idle'); }
  }

  useEffect(() => {
    setIsSaved(true); const timeout = setTimeout(() => setIsSaved(false), 800);
  }, [tasks])

  const addTask = (e) => {
    e.preventDefault(); if (!taskText.trim()) return;
    setTasks([{ id: crypto.randomUUID(), text: taskText, completed: false, priority, createdAt: new Date().toLocaleTimeString() }, ...tasks])
    setTaskText('')
  }

  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id))
  
  const filteredTasks = tasks
    .filter(task => task.text.toLowerCase().includes(debouncedSearch.toLowerCase()))
    .filter(task => hideCompleted ? !task.completed : true)

  const stats = useMemo(() => {
    const total = tasks.length; const completed = tasks.filter(t => t.completed).length;
    return { total, completed, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
  }, [tasks])

  return (
    <div className={`min-h-screen transition-all duration-1000 font-sans relative overflow-hidden ${
      theme === 'dark' ? 'bg-[#010208] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* FONDO MAGNÉTICO */}
      <motion.div style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }} className="fixed w-[600px] h-[600px] pointer-events-none z-0">
        <div className={`w-full h-full rounded-full blur-[130px] opacity-20 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-indigo-400'}`} />
      </motion.div>

      {/* FLASH PUESTA DE SOL */}
      <AnimatePresence>
        <motion.div key={theme} initial={{ opacity: 0, x: '-100%' }} animate={{ opacity: [0, 1, 0], x: '100%' }} transition={{ duration: 0.6 }} className="fixed inset-0 z-[100] pointer-events-none bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      </AnimatePresence>

      <div className="max-w-4xl mx-auto relative z-10 p-6 pt-16">
        
        <header className="flex justify-between items-end mb-16 px-4 relative">
          <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <h1 className="text-6xl font-black italic tracking-tighter">{t.title}<span className="text-indigo-600">.</span></h1>
            <p className="text-indigo-500/60 text-[10px] font-black uppercase tracking-[0.5em] mt-2">{t.subtitle}</p>
          </motion.div>
          
          <div className="flex flex-col items-end gap-2">
            <div className={`px-6 py-2 rounded-full border flex items-center gap-3 transition-all ${isCloudActive ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-white/5 bg-white/5'}`}>
               <div className={`w-2 h-2 rounded-full ${isCloudActive ? 'bg-indigo-400 shadow-[0_0_15px_#818cf8]' : 'bg-slate-600'}`} />
               <span className={`text-[9px] font-black tracking-widest uppercase ${isCloudActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                {isCloudActive ? t.cloudActive : 'LOCAL MODE'}
               </span>
            </div>
          </div>

          <AnimatePresence>
            {isHelpOpen && (
              <motion.div ref={helpRef} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`absolute top-full right-0 w-full max-w-lg p-12 rounded-[3rem] border shadow-3xl backdrop-blur-[60px] z-[120] mt-6 ${theme === 'dark' ? 'bg-slate-900/95 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                <div className="flex justify-between items-center mb-8">
                  <h4 className="text-3xl font-black tracking-tighter text-indigo-500">{t.helpTitle}</h4>
                  <button onClick={() => setIsHelpOpen(false)} className="text-xl opacity-50 hover:opacity-100 transition-opacity">✕</button>
                </div>
                <div className="space-y-6">
                  {[t.helpConcept1, t.helpConcept2, t.helpConcept3, t.helpConcept4].map((concept, i) => (
                    <p key={i} className="text-sm font-medium opacity-70 border-l-2 border-indigo-500 pl-4">{concept}</p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* DASHBOARD */}
        <section className={`p-10 rounded-[3.5rem] border backdrop-blur-3xl mb-12 ${theme === 'dark' ? 'bg-white/[0.03] border-white/10 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
          <div className="flex justify-between items-end mb-8 relative z-10">
            <div>
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest block mb-2">{t.progress}</span>
              <h2 className="text-7xl font-black tracking-tighter">{stats.percent}<span className="text-indigo-600 text-3xl">%</span></h2>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest block mb-1">{t.active}</span>
              <span className="text-4xl font-black text-indigo-500">{stats.total - stats.completed}</span>
            </div>
          </div>
          <LiquidProgressBar percent={stats.percent} theme={theme} />
        </section>

        {/* BOTONES FLOTANTES */}
        <div className="fixed top-8 right-8 flex gap-4 z-50">
          <motion.button whileHover={{ scale: 1.1 }} onClick={toggleCloud} className={`w-14 h-14 rounded-full border backdrop-blur-xl transition-all ${isCloudActive ? 'bg-indigo-600 text-white shadow-indigo-500/50' : 'bg-white/5 border-white/10 text-slate-400'}`}>
            {cloudStatus === 'connecting' ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto animate-spin" /> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mx-auto"><path d="M17.5 19c2.5 0 4.5-2 4.5-4.5 0-2.4-1.9-4.3-4.3-4.5-.4-3.4-3.3-6-6.7-6-2.5 0-4.7 1.4-5.9 3.5C2.5 8 1 10.1 1 12.5 1 15.5 3.5 18 6.5 18H17.5"></path></svg>}
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.1 }} 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            className="w-14 h-14 rounded-full border bg-white/5 border-white/10 flex items-center justify-center text-xl shadow-2xl overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.span key={theme} initial={{ y: 20, rotate: -90, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} exit={{ y: -20, rotate: 90, opacity: 0 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                {theme === 'dark' ? '☀️' : '🌙'}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          <motion.button whileHover={{ scale: 1.1 }} onClick={() => setLang(lang === 'es' ? 'en' : 'es')} className="w-14 h-14 rounded-full border bg-white/5 border-white/10 font-black text-xs">{lang.toUpperCase()}</motion.button>
          
          <button onClick={() => setIsHelpOpen(!isHelpOpen)} className="w-14 h-14 rounded-full border bg-indigo-600 border-indigo-400 flex items-center justify-center font-black text-2xl text-white shadow-indigo-500/40 shadow-2xl hover:scale-110 transition-transform">?</button>
        </div>

        {/* --- BUSCADOR ADAPTATIVO (ESTILO MEJORADO) --- */}
        <div className="mb-8 px-4">
          <div className={`relative flex items-center group px-6 py-4 border-2 rounded-2xl transition-all duration-500 ${
            theme === 'dark' 
              ? 'bg-white/[0.03] border-white/10 focus-within:border-indigo-500/50 shadow-[0_0_25px_rgba(0,0,0,0.5)] focus-within:shadow-indigo-500/10' 
              : 'bg-white border-slate-200 focus-within:border-indigo-400 shadow-[0_4px_12px_rgba(0,0,0,0.05)] focus-within:shadow-indigo-100'
          }`}>
            <svg 
              className={`w-5 h-5 mr-4 transition-colors duration-500 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} group-focus-within:text-indigo-500`} 
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder={t.search} 
              className={`bg-transparent outline-none flex-1 font-bold text-sm tracking-wide transition-colors duration-500 ${
                theme === 'dark' ? 'text-white placeholder:text-slate-600' : 'text-slate-700 placeholder:text-slate-400'
              }`} 
            />
          </div>
        </div>

        {/* INPUT TAREAS */}
        <form onSubmit={addTask} className="mb-14">
          <div className={`flex flex-col md:flex-row gap-4 p-3 rounded-[2.5rem] border-2 transition-all duration-500 ${theme === 'dark' ? 'bg-white/[0.02] border-white/5 focus-within:border-indigo-500/50 shadow-3xl' : 'bg-white border-slate-200 focus-within:border-indigo-400 shadow-xl'}`}>
            <input type="text" value={taskText} onChange={(e) => setTaskText(e.target.value)} placeholder={t.placeholder} className="flex-1 p-5 bg-transparent outline-none font-bold text-xl" />
            
            <div className="flex flex-wrap items-center gap-4 px-2">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${theme === 'dark' ? 'text-indigo-400/80' : 'text-slate-500'}`}>
                  {t.priority}:
                </span>
                <select 
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value)} 
                  className={`px-5 py-3 rounded-xl text-[11px] font-black uppercase outline-none border-2 transition-all cursor-pointer ${
                    theme === 'dark' ? 'bg-slate-900 border-white/5 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-400'
                  }`}
                >
                  <option value="low">{t.low}</option>
                  <option value="medium">{t.medium}</option>
                  <option value="high">{t.high}</option>
                </select>
              </div>
              
              <button className="bg-indigo-600 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/30 transition-all active:scale-95">
                {t.add}
              </button>
            </div>
          </div>
        </form>

        {/* LISTA CON RADAR */}
        <div className="space-y-6 px-2 min-h-[400px]">
          <AnimatePresence mode='popLayout'>
            {filteredTasks.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-24 text-center">
                <div className="w-24 h-24 border border-white/10 rounded-full flex items-center justify-center border-dashed mb-8 relative">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="absolute w-1 h-12 bg-indigo-500 origin-bottom top-0 shadow-[0_0_15px_#6366f1]" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{t.empty}</p>
              </motion.div>
            ) : (
              filteredTasks.map(task => (
                <motion.div key={task.id} layout initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, x: 50 }}>
                  <TiltCard theme={theme} priority={task.priority}>
                    <button onClick={() => toggleTask(task.id)} className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-indigo-500 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'border-slate-700'}`}>{task.completed && '✓'}</button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-xl truncate transition-all ${task.completed ? 'opacity-20 line-through' : ''}`}>{task.text}</p>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${task.priority === 'high' ? 'text-rose-500' : task.priority === 'medium' ? 'text-amber-500' : 'text-sky-500'}`}>
                        {t.priority}: {t[task.priority]}
                      </span>
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="text-slate-600 hover:text-rose-500 p-3 transition-colors"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg></button>
                  </TiltCard>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER ESTADÍSTICAS */}
        <footer className="mt-24 py-12 border-t border-slate-500/10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex gap-12">
            <div className="flex gap-1"><span className="font-black text-2xl italic text-indigo-500">{stats.completed}</span><span className="text-slate-500 text-sm mt-2">/ LOGRADO</span></div>
            <div className="flex gap-1"><span className="font-black text-2xl italic text-indigo-500">{stats.total}</span><span className="text-slate-500 text-sm mt-2">/ {t.total}</span></div>
          </div>
          <button onClick={() => confirm(t.confirm) && setTasks([])} className="px-8 py-3 rounded-2xl text-[10px] font-black text-rose-500 border border-rose-500/30 uppercase tracking-[0.2em] hover:bg-rose-500/10 transition-colors">{t.wipe}</button>
        </footer>

        {/* FOOTER DE FIRMA FINAL */}
        <div className="mt-12 mb-16 text-center">
          <motion.a 
            href="https://github.com/alexxblaro16" 
            target="_blank" 
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05, letterSpacing: "0.2em" }}
            className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all cursor-pointer ${theme === 'dark' ? 'text-indigo-400/50 hover:text-indigo-300' : 'text-slate-400 hover:text-indigo-600'}`}
          >
            {t.devBy}
          </motion.a>
        </div>
      </div>
    </div>
  )
}

export default App