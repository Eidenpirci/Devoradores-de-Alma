
import React, { useState, useEffect } from 'react';
import { Character } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Moon, 
  Star, 
  Edit3, 
  Plus, 
  Trash2, 
  Flame, 
  Ghost, 
  Skull,
  X,
  Check,
  User,
  MapPin,
  Calendar,
  Clock
} from 'lucide-react';

interface CalendarToolProps {
  characters: Character[];
  notes: Record<string, string>;
  events: Record<string, string[]>;
  playerDates: Record<string, string>;
  onUpdateNotes: (date: string, value: string) => void;
  onUpdateEvents: (date: string, value: string[]) => void;
  onUpdatePlayerDate: (charId: string, date: string) => void;
  currentCampaignDate: string | null;
  onSetCurrentCampaignDate: (date: string | null) => void;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (month: number, year: number) => {
  return new Date(year, month, 1).getDay();
};

// Fases da Lua Soul Eater (Simuladas em ciclo de 28 dias)
const getSoulEaterMoonPhase = (day: number) => {
  const phase = (day - 1) % 28;
  if (phase < 7) return { icon: Moon, name: "Crescente Sorridente", color: "text-purple-400", style: "drop-shadow-[0_0_8px_#a855f7]" };
  if (phase < 14) return { icon: Flame, name: "Gargalhada de Fogo", color: "text-orange-500", style: "drop-shadow-[0_0_8px_#f97316]" };
  if (phase < 21) return { icon: Skull, name: "Lua Sangrenta (Insanidade)", color: "text-red-600", style: "drop-shadow-[0_0_12px_#dc2626]" };
  return { icon: Ghost, name: "Sussurro Sombrio", color: "text-blue-400", style: "drop-shadow-[0_0_8px_#3b82f6]" };
};

const lunarPhases = [
  { ...getSoulEaterMoonPhase(1), effect: "Bônus em testes de Coragem e Ordem." },
  { ...getSoulEaterMoonPhase(8), effect: "Ações impulsivas são favorecidas, mas a furtividade é penalizada." },
  { ...getSoulEaterMoonPhase(15), effect: "A Insanidade aumenta. Magias e poderes sombrios são fortalecidos." },
  { ...getSoulEaterMoonPhase(22), effect: "Bônus em testes de furtividade e enganação. A percepção é aguçada." },
];


export const CalendarTool: React.FC<CalendarToolProps> = ({ 
  characters, 
  notes, 
  events, 
  playerDates, 
  onUpdateNotes, 
  onUpdateEvents, 
  onUpdatePlayerDate,
  currentCampaignDate,
  onSetCurrentCampaignDate
}) => {
  const [currentMonth, setCurrentMonth] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newEventText, setNewEventText] = useState("");
  const [initialMonthSet, setInitialMonthSet] = useState(false);
  const year = 2010;

  useEffect(() => {
    if (!initialMonthSet) {
      const allDates = new Set([
        ...Object.keys(notes),
        ...Object.keys(events),
        ...Object.values(playerDates).filter(Boolean)
      ]);

      if (allDates.size > 0) {
        const latestDate = Array.from(allDates).sort().pop();
        if (latestDate) {
          // FIX: Cast latestDate to string to resolve TypeScript 'unknown' type error.
          const monthIndex = parseInt((latestDate as string).split('-')[1], 10) - 1;
          setCurrentMonth(monthIndex);
        }
      }
      setInitialMonthSet(true);
    }
  }, [notes, events, playerDates, initialMonthSet]);

  const daysInMonth = getDaysInMonth(currentMonth, year);
  const firstDay = getFirstDayOfMonth(currentMonth, year);
  
  const formatDate = (d: number) => `${year}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const handlePrevMonth = () => setCurrentMonth(prev => prev === 0 ? 11 : prev - 1);
  const handleNextMonth = () => setCurrentMonth(prev => prev === 11 ? 0 : prev + 1);

  const playersOnDay = (d: number) => {
    const dateStr = formatDate(d);
    return characters.filter(c => playerDates[c.id] === dateStr);
  };

  return (
    <div className="bg-zinc-950 rounded-2xl border border-purple-900/20 overflow-hidden shadow-2xl flex flex-col h-[85vh]">
      {/* HEADER DO CALENDÁRIO */}
      <div className="p-6 border-b border-purple-900/10 bg-zinc-900/40 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-purple-600/20 rounded-lg text-zinc-500 hover:text-purple-400 transition-all"><ChevronLeft size={24}/></button>
          <div className="text-center min-w-[150px]">
            <h3 className="title-font text-2xl text-white uppercase tracking-tighter">{MONTHS[currentMonth]}</h3>
            <span className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.4em]">{year} — ERA SHIBUSEN</span>
          </div>
          <button onClick={handleNextMonth} className="p-2 hover:bg-purple-600/20 rounded-lg text-zinc-500 hover:text-purple-400 transition-all"><ChevronRight size={24}/></button>
        </div>
        
        <div className="flex gap-4">
           {/* RESUMO DE FASES */}
           <div className="bg-black/40 border border-zinc-900 rounded-xl px-4 py-2 flex items-center gap-3">
              <Moon size={16} className="text-purple-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-500 font-black uppercase leading-none">Onda Estelar</span>
                <span className="text-[10px] text-purple-400 font-bold uppercase">{getSoulEaterMoonPhase(new Date().getDate()).name}</span>
              </div>
           </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* PAINEL DE FASES DA LUA */}
        <div className="w-72 shrink-0 bg-zinc-900/30 border-r border-purple-900/10 p-6 flex flex-col space-y-6 custom-scrollbar overflow-y-auto">
            <div>
              <h4 className="title-font text-xl text-purple-500 uppercase tracking-tighter mb-2">Ciclos da Lua</h4>
              <p className="text-xs text-zinc-500 italic">As fases da lua influenciam a ressonância das almas e o poder da insanidade.</p>
            </div>
            <div className="space-y-4">
              {lunarPhases.map(phase => {
                const Icon = phase.icon;
                return (
                  <div key={phase.name} className="bg-black/40 p-4 rounded-xl border border-zinc-800/50">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${phase.style}`}>
                          <Icon size={24} className={phase.color} />
                      </div>
                      <div>
                        <span className={`text-sm font-black uppercase ${phase.color}`}>{phase.name}</span>
                        <p className="text-[11px] text-zinc-400 mt-1">{phase.effect}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
        </div>
        
        {/* GRID DO CALENDÁRIO */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-7 gap-2 max-w-3xl mx-auto">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="text-center py-2 text-[10px] font-black text-zinc-700 uppercase tracking-widest">{day}</div>
            ))}
            
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-zinc-900/10 rounded-xl border border-transparent"></div>
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const dateStr = formatDate(d);
              const players = playersOnDay(d);
              const isSelected = selectedDate === dateStr;
              const isCurrent = currentCampaignDate === dateStr;
              const hasNotes = !!notes[dateStr];
              const hasEvents = (events[dateStr]?.length || 0) > 0;
              const moon = getSoulEaterMoonPhase(d);

              return (
                <div 
                  key={d}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative aspect-square p-3 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${isSelected ? 'bg-purple-900/30 border-purple-500 soul-glow' : 'bg-black/60 border-zinc-900 hover:border-purple-900/30'} ${isCurrent ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  {isCurrent && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_6px_#facc15]" title="Dia Atual da Campanha"></div>}
                  <div className="flex justify-between items-start">
                    <span className={`text-2xl xl:text-3xl font-black leading-none ${isSelected ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-400'}`}>{d}</span>
                    <moon.icon size={14} className={`${moon.color} ${moon.style}`} />
                  </div>

                  <div className="flex flex-wrap gap-1 mt-auto">
                    {players.map(p => (
                      <div key={p.id} className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_5px_#a855f7]" title={p.nome}></div>
                    ))}
                    {hasEvents && <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_5px_#dc2626]"></div>}
                    {hasNotes && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>}
                  </div>

                  {/* INDICADOR HOVER */}
                  <div className="absolute inset-0 bg-purple-600/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity pointer-events-none"></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PAINEL DE DETALHES DO DIA */}
        <div className="w-96 shrink-0 bg-zinc-900/40 border-l border-purple-900/10 flex flex-col">
          {selectedDate ? (
            <>
              <div className="p-6 border-b border-zinc-900">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="title-font text-xl text-white uppercase">{selectedDate.split('-')[2]} de {MONTHS[parseInt(selectedDate.split('-')[1]) - 1]}</h4>
                    <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">{getSoulEaterMoonPhase(parseInt(selectedDate.split('-')[2])).name}</span>
                  </div>
                  <button onClick={() => setSelectedDate(null)} className="text-zinc-700 hover:text-white"><X size={20}/></button>
                </div>
                <button 
                  onClick={() => onSetCurrentCampaignDate(selectedDate)}
                  className="w-full bg-yellow-600/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-400 hover:text-yellow-300 rounded-lg py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  disabled={currentCampaignDate === selectedDate}
                >
                  <Clock size={12}/> {currentCampaignDate === selectedDate ? 'Este é o Dia Atual' : 'Definir como Dia Atual'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* LOCALIZAÇÃO DE JOGADORES */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                    <MapPin size={14} className="text-purple-500" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Localização de Almas</span>
                  </div>
                  <div className="space-y-2">
                    {characters.map(char => {
                      const isHere = playerDates[char.id] === selectedDate;
                      return (
                        <button 
                          key={char.id}
                          onClick={() => onUpdatePlayerDate(char.id, isHere ? "" : selectedDate)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${isHere ? 'bg-purple-600/20 border-purple-600/40' : 'bg-black/40 border-zinc-900 hover:border-zinc-800'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-1.5 rounded-full ${isHere ? 'bg-purple-500 soul-glow' : 'bg-zinc-800'}`}></div>
                            <span className={`text-[11px] font-bold ${isHere ? 'text-white' : 'text-zinc-600'}`}>{char.nome}</span>
                          </div>
                          {isHere ? <Check size={14} className="text-purple-400"/> : <Plus size={14} className="text-zinc-800"/>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* NOTAS DIÁRIAS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                    <Edit3 size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Observações do Mestre</span>
                  </div>
                  <textarea 
                    className="w-full bg-black/40 border border-zinc-900 rounded-xl p-4 text-xs text-zinc-300 italic min-h-[120px] outline-none focus:border-emerald-600/30 transition-all shadow-inner"
                    placeholder="Escreva eventos ocorridos neste dia..."
                    value={notes[selectedDate] || ""}
                    onChange={e => onUpdateNotes(selectedDate, e.target.value)}
                  />
                </div>

                {/* EVENTOS IMPORTANTES */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                    <Star size={14} className="text-red-500" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Marcos Importantes</span>
                  </div>
                  <div className="space-y-2">
                    {(events[selectedDate] || []).map((event, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-red-950/10 border border-red-900/20 p-2 rounded-lg group">
                        <span className="text-[10px] font-bold text-red-400">⚡ {event}</span>
                        <button 
                          onClick={() => {
                            const newEvents = [...(events[selectedDate] || [])];
                            newEvents.splice(idx, 1);
                            onUpdateEvents(selectedDate, newEvents);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Novo marco..."
                        className="flex-1 bg-black/60 border border-zinc-900 rounded-lg px-3 py-1.5 text-[10px] text-zinc-300 outline-none focus:border-red-600/30"
                        value={newEventText}
                        onChange={e => setNewEventText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newEventText.trim()) {
                            onUpdateEvents(selectedDate, [...(events[selectedDate] || []), newEventText.trim()]);
                            setNewEventText("");
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          if (newEventText.trim()) {
                            onUpdateEvents(selectedDate, [...(events[selectedDate] || []), newEventText.trim()]);
                            setNewEventText("");
                          }
                        }}
                        className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                      >
                        <Plus size={16}/>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <Calendar size={48} className="text-zinc-800 mb-4" />
              <h4 className="title-font text-lg text-zinc-600 uppercase">Selecione um Ciclo</h4>
              <p className="text-[11px] text-zinc-700 font-bold uppercase mt-2 italic leading-relaxed">
                Clique em um dia para gerenciar almas, registrar eventos históricos e sintonizar as vibrações lunares.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};