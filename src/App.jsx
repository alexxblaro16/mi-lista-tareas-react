import { useState, useMemo, useEffect, useRef } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import useDebounce from './hooks/useDebounce' 
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react'

// --- DICCIONARIO DE TRADUCCIONES (Ahora mucho más claro) ---
const translations = {
  es: {
    name: "Español", flag: "🇪🇸", title: "ENFOQUE", subtitle: "SISTEMA PREMIUM",
    progress: "Progreso", active: "Pendientes", placeholder: "¿Cuál es tu misión hoy?",
    add: "Añadir", search: "Buscar tarea...", hide: "Ocultar Terminadas",
    status: "Estado", done: "Hechas", total: "Total", wipe: "Borrar Todo",
    confirm: "¿Quieres borrar todas las tareas?", priority: "Prioridad",
    low: "Baja", medium: "Media", high: "Alta",
    // Textos de Ayuda Claros:
    helpTitle: "Cómo funciona FOCUS",
    helpIntro: "He diseñado esta aplicación para que sea inteligente y fácil de usar. Aquí tienes los detalles:",
    helpConcept1: "Memoria Automática: No importa si cierras la pestaña, tus tareas se quedan guardadas como por arte de magia.",
    helpConcept2: "Buscador Inteligente: El sistema espera a que termines de escribir para buscar, así todo va mucho más rápido.",
    helpConcept3: "Efectos 3D: Las tarjetas se mueven contigo para que la aplicación se sienta real, como si pudieras tocarla.",
    helpConcept4: "Luz de Seguridad: El punto verde te confirma que tus cambios se han guardado con éxito en el sistema.",
    helpApiPlans: "Próximamente: Podrás ver tus tareas desde cualquier móvil u ordenador conectándote a internet.",
  },
  en: {
    name: "English", flag: "🇺🇸", title: "FOCUS", subtitle: "PREMIUM SYSTEM",
    progress: "Progress", active: "Active", placeholder: "What is your mission?",
    add: "Add", search: "Search tasks...", hide: "Hide Finished",
    status: "Status", done: "Done", total: "Total", wipe: "Wipe All",
    confirm: "Do you want to delete all tasks?", priority: "Priority",
    low: "Low", medium: "Med", high: "High",
    helpTitle: "How FOCUS Works",
    helpIntro: "I designed this app to be smart and easy to use. Here are the details:",
    helpConcept1: "Auto-Memory: No matter if you close the tab, your tasks stay saved like magic.",
    helpConcept2: "Smart Search: The system waits for you to finish typing to search, making everything much faster.",
    helpConcept3: "3D Effects: The cards move with you so the app feels real, as if you could touch it.",
    helpConcept4: "Security Light: The green dot confirms that your changes have been successfully saved.",
    helpApiPlans: "Coming Soon: You will be able to see your tasks from any mobile or computer by connecting to the internet.",
  }
}

// --- COMPONENTE TILT 3D PARA LAS TAREAS ---
function TiltCard({ children, theme, priority }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-60, 60], [10, -10]);
  const rotateY = useTransform(x, [-60, 60], [-10, 10]);

  function handleMouse(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }

  return (
    <motion.div
      style={{ perspective: 1000 }}
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      <motion.div
        style={{ rotateX, rotateY }}
        className={`group flex items-center gap-5 p-5 border rounded-[1.5rem] transition-all shadow-lg ${
          theme === 'dark' 
          ? 'bg-white/[0.03] border-white/5 hover:border-indigo-500/30' 
          : 'bg-white border-slate-100 shadow-sm'
        } ${priority === 'high' ? 'border-l-4 border-l-rose-500' : ''}`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function App() {
  const [tasks, setTasks] = useLocalStorage('tasks-premium-v4', [])
  const [lang, setLang] = useState('es')
  const [theme, setTheme] = useState('dark')
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false) 
  const [taskText, setTaskText] = useState('')
  const [priority, setPriority] = useState('medium')
  const [search, setSearch] = useState('')
  const [hideCompleted, setHideCompleted] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  
  const t = translations[lang]
  const debouncedSearch = useDebounce(search, 300)
  const langRef = useRef(null)
  const helpRef = useRef(null) 

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setIsLangOpen(false);
      if (helpRef.current && !helpRef.current.contains(e.target)) setIsHelpOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setIsSaved(true)
    const timeout = setTimeout(() => setIsSaved(false), 1200)
    return () => clearTimeout(timeout)
  }, [tasks])

  const addTask = (e) => {
    e.preventDefault()
    if (!taskText.trim()) return
    const newTask = {
      id: crypto.randomUUID(),
      text: taskText,
      completed: false,
      priority,
      createdAt: new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'short' })
    }
    setTasks([newTask, ...tasks])
    setTaskText('')
  }

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const filteredTasks = tasks
    .filter(task => task.text.toLowerCase().includes(debouncedSearch.toLowerCase()))
    .filter(task => hideCompleted ? !task.completed : true)

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => t.completed).length
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
    return { total, completed, percent }
  }, [tasks])

  return (
    <div className={`min-h-screen transition-colors duration-700 font-sans selection:bg-indigo-500/30 ${
      theme === 'dark' ? 'bg-[#020617] text-slate-200' : 'bg-[#f8fafc] text-slate-800'
    }`}>
      
      {/* FONDO DE PARTÍCULAS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [0, 50, 0], y: [0, 30, 0] }} transition={{ duration: 20, repeat: Infinity }} className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <motion.div animate={{ x: [0, -40, 0], y: [0, 60, 0] }} transition={{ duration: 15, repeat: Infinity }} className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-600/10 blur-[100px] rounded-full" />
      </div>

      {/* BOTONES FLOTANTES */}
      <div className="fixed top-6 right-6 flex gap-3 z-50">
        <div className="relative" ref={langRef}>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsLangOpen(!isLangOpen)}
            className={`p-3 rounded-2xl border backdrop-blur-md shadow-xl flex items-center gap-2 ${
              theme === 'dark' ? 'bg-white/5 border-white/10 text-indigo-400' : 'bg-white border-slate-200 text-indigo-600'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            <span className="text-[10px] font-black uppercase tracking-tighter">{lang}</span>
          </motion.button>
          <AnimatePresence>
            {isLangOpen && (
              <motion.div initial={{ opacity: 0, scale: 0.5, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.5, y: -20 }} className={`absolute top-full mt-3 right-0 w-40 p-2 rounded-2xl border shadow-2xl backdrop-blur-xl ${theme === 'dark' ? 'bg-slate-900/90 border-white/10' : 'bg-white/90 border-slate-200'}`}>
                {Object.keys(translations).map((l) => (
                  <button key={l} onClick={() => { setLang(l); setIsLangOpen(false); }} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${lang === l ? 'bg-indigo-600 text-white' : 'hover:bg-white/5'}`}>
                    <span className="text-xs font-bold">{translations[l].name}</span>
                    <span>{translations[l].flag}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`p-3 rounded-2xl border backdrop-blur-md shadow-xl ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </motion.button>
        
        {/* BOTÓN DE AYUDA CLARO */}
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsHelpOpen(!isHelpOpen)}
          className={`w-12 h-12 rounded-2xl border backdrop-blur-md shadow-xl flex items-center justify-center font-black text-xl ${
            theme === 'dark' ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
          }`}
        >
          ?
        </motion.button>
      </div>

      <div className="max-w-3xl mx-auto relative z-10 p-4 md:p-12 pt-24 md:pt-12">
        
        <header className="flex justify-between items-center mb-12 relative">
          <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <h1 className={`text-4xl font-black tracking-tighter ${theme === 'dark' ? 'bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent' : 'text-slate-900'}`}>
              {t.title}<span className="text-indigo-500">.</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">{t.subtitle}</p>
          </motion.div>
          
          <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-white shadow-sm'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isSaved ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' : 'bg-slate-400'}`}></div>
            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">{isSaved ? 'OK' : 'SYNC'}</span>
          </div>

          {/* PANEL DE AYUDA RE-DISEÑADO */}
          <AnimatePresence>
            {isHelpOpen && (
              <motion.div 
                ref={helpRef}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={`absolute top-full right-0 w-[90vw] max-w-sm p-8 rounded-[2rem] border shadow-3xl backdrop-blur-2xl z-[100] mt-4 ${
                  theme === 'dark' ? 'bg-slate-900/95 border-white/10 text-white' : 'bg-white/95 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-2xl font-black tracking-tight text-indigo-500">{t.helpTitle}</h4>
                  <button onClick={() => setIsHelpOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-500/10 hover:bg-rose-500/20 hover:text-rose-500 transition-colors">✕</button>
                </div>
                <p className="text-sm font-semibold opacity-70 mb-6 leading-relaxed italic border-l-2 border-indigo-500 pl-4">{t.helpIntro}</p>
                <div className="space-y-5">
                  <div className="flex gap-4 items-start">
                    <span className="text-lg">💾</span>
                    <p className="text-xs leading-snug font-medium">{t.helpConcept1}</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="text-lg">⚡</span>
                    <p className="text-xs leading-snug font-medium">{t.helpConcept2}</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="text-lg">🎨</span>
                    <p className="text-xs leading-snug font-medium">{t.helpConcept3}</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="text-lg">🟢</span>
                    <p className="text-xs leading-snug font-medium">{t.helpConcept4}</p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-indigo-500/20">
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">{t.helpApiPlans}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* El resto de la app (Dashboard, Form, List) permanece igual */}
        <motion.section 
          whileHover={{ translateZ: 20, rotateX: 2 }}
          className={`relative overflow-hidden border backdrop-blur-xl p-8 rounded-[2.5rem] mb-10 transition-all ${
            theme === 'dark' ? 'bg-white/[0.03] border-white/10 shadow-2xl' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-end mb-6">
            <div>
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest block mb-1">{t.progress}</span>
              <h2 className={`text-6xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {stats.percent}<span className="text-indigo-500 text-2xl">%</span>
              </h2>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest block mb-1">{t.active}</span>
              <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stats.total - stats.completed}</span>
            </div>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}>
            <motion.div animate={{ width: `${stats.percent}%` }} className="h-full bg-gradient-to-r from-indigo-600 via-blue-400 to-cyan-400 shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
          </div>
        </motion.section>

        <form onSubmit={addTask} className="mb-12">
          <div className={`flex flex-col md:flex-row gap-3 p-2 rounded-2xl border transition-all duration-300 ${
            theme === 'dark' ? 'bg-white/[0.02] border-white/5 focus-within:border-indigo-500/50' : 'bg-white border-slate-200 focus-within:border-indigo-400 shadow-sm'
          }`}>
            <input 
              type="text" value={taskText} onChange={(e) => setTaskText(e.target.value)}
              placeholder={t.placeholder}
              className={`flex-1 p-4 bg-transparent outline-none font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}
            />
            <div className="flex gap-2 p-1">
              <select 
                value={priority} onChange={(e) => setPriority(e.target.value)}
                className={`text-[10px] font-black uppercase px-4 rounded-xl outline-none border ${
                  theme === 'dark' ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <option value="low">{t.low}</option>
                <option value="medium">{t.medium}</option>
                <option value="high">{t.high}</option>
              </select>
              <motion.button 
                whileHover={{ y: -2 }}
                whileTap={{ y: 2 }}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black shadow-[0_4px_0_rgb(49,46,129)] active:shadow-none transition-all"
              >
                {t.add.toUpperCase()}
              </motion.button>
            </div>
          </div>
        </form>

        <div className="flex flex-col md:flex-row gap-6 mb-8 justify-between items-center px-2">
          <div className="relative w-full md:w-72 group">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors">🔍</span>
            <input 
              type="text" placeholder={t.search}
              className={`w-full pl-8 pr-4 py-2 bg-transparent border-b text-sm focus:outline-none focus:border-indigo-500 transition-all ${
                theme === 'dark' ? 'border-white/10 text-white' : 'border-slate-200 text-slate-800'
              }`}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase cursor-pointer hover:text-indigo-500 transition-colors">
            <input type="checkbox" checked={hideCompleted} onChange={() => setHideCompleted(!hideCompleted)} className="w-4 h-4 rounded accent-indigo-600" />
            {t.hide}
          </label>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode='popLayout'>
            {filteredTasks.map(task => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <TiltCard theme={theme} priority={task.priority}>
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-500 ${
                      task.completed ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg' : theme === 'dark' ? 'border-slate-700 bg-black/20' : 'border-slate-200 bg-white'
                    }`}
                  >
                    {task.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-lg truncate transition-all ${task.completed ? 'opacity-20 line-through' : theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>
                      {task.text}
                    </p>
                    <span className="text-[9px] font-black text-indigo-500/50 uppercase tracking-widest">{t.priority}: {t[task.priority]}</span>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="text-slate-600 hover:text-rose-500 p-2 transition-all">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                  </button>
                </TiltCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <footer className="mt-16 py-8 border-t border-slate-500/10 flex flex-col md:flex-row justify-between items-center gap-8 px-4">
          <div className="flex gap-10">
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">{t.status}</span>
              <span className="font-bold text-lg">{stats.completed} {t.done}</span>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">{t.total}</span>
              <span className="font-bold text-lg">{stats.total} Tasks</span>
            </div>
          </div>
          <button onClick={() => confirm(t.confirm) && setTasks([])} className="px-6 py-2 rounded-lg text-[10px] font-black text-rose-500 border border-rose-500/10 hover:bg-rose-500 hover:text-white transition-all uppercase tracking-widest shadow-lg">
            {t.wipe}
          </button>
        </footer>
      </div>
    </div>
  )
}

export default App