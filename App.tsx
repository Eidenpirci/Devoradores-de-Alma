
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Dice6, 
  Plus, 
  Trash2,
  Moon,
  Sparkles,
  Sword,
  Swords,
  Map as MapIcon,
  Calendar as CalendarIcon,
  ClipboardList,
  Save,
  Download,
  FileUp,
  Settings,
  Skull,
  X,
  RefreshCw,
  Info
} from 'lucide-react';
import { Character, Race, Role, LogEntry, ArmorItem, SoulAlignment, CombatState, MapState, RollData, Roll, SavedBattle } from './types';
import { INITIAL_ATTRIBUTES, RACE_DATA } from './constants';
import { CharacterSheet } from './components/CharacterSheet';
import { DiceRoller } from './components/DiceRoller';
import { InteractiveMap } from './components/InteractiveMap';
import { CalendarTool } from './components/CalendarTool';
import { CombatMonitor } from './components/CombatMonitor';
import { DiceAnimationOverlay } from './components/DiceAnimationOverlay';
import { explainRule } from './services/geminiService';

const createEmptyArmor = (): ArmorItem => ({
  equipado: false,
  nome: '',
  fisica: 0,
  espiritual: 0,
  efeitos: ''
});

const createEmptyChar = (id: string, name: string, isNPC: boolean): Character => ({
  id,
  isNPC,
  nome: name,
  titulo: '',
  raca: Race.HUMANO,
  idade: '-',
  nacionalidade: '-',
  dinheiro: '0',
  nivel: 1,
  funcao: Role.INDIVIDUAL,
  alinhamento: SoulAlignment.NEUTRO,
  gloria: 0,
  maxGloria: 2,
  exaustao: 0,
  maxExaustao: 5,
  armaduraFisica: 0,
  armaduraEspiritual: 0,
  hp: 30,
  maxHp: 30,
  al: 10,
  maxAl: 10,
  st: 20,
  maxSt: 20,
  experiencia: 0,
  experienciaGasta: 0,
  insanidade: 0,
  coragem: 0,
  atributosBase: { ...INITIAL_ATTRIBUTES },
  pericias: {},
  maestriaCombate: '--',
  maestriaRessonancia: '--',
  maestriaMagia: '--',
  masterySkills: {
    maestriaCombate: {},
    maestriaRessonancia: {},
    maestriaMagia: {}
  },
  vantagens: '',
  vantagemRaca: '',
  vantagensSelecionadas: {},
  armaduras: { 
    cabeca: createEmptyArmor(), 
    superior: createEmptyArmor(), 
    inferior: createEmptyArmor() 
  }
});

const fixedScenarios = [
  { id: 'map-1', name: 'DEATH CITY', icon: 'Home', color: '#a855f7' },
  { id: 'map-2', name: 'SHIBUSEN', icon: 'GraduationCap', color: '#f97316' },
  { id: 'map-3', name: 'SABBATH', icon: 'Flame', color: '#ef4444' },
  { id: 'map-4', name: 'DESERTO MOJAVE', icon: 'Mountain', color: '#eab308' },
  { id: 'map-5', name: 'FLORESTA DAS ALMAS', icon: 'TreePine', color: '#22c55e' },
  { id: 'map-6', name: 'PÂNTANO DA LOUCURA', icon: 'Ghost', color: '#3b82f6' },
  { id: 'map-7', name: 'CASTELO DA BRUXA', icon: 'Sparkles', color: '#ec4899' },
  { id: 'map-8', name: 'CAVERNA DO KISHIN', icon: 'Skull', color: '#f4f4f5' },
  { id: 'map-9', name: 'VILAREJO ABANDONADO', icon: 'Home', color: '#6b7280' },
];

const initialMapState: MapState = {
  tokens: {},
  shapes: {},
  tileColors: {},
  mapConfigs: {},
  mapOrder: fixedScenarios.map(s => s.id),
  activeMapId: fixedScenarios[0].id,
  customBackgrounds: {},
  gridWidth: 60,
  gridHeight: 34,
  cellSize: 32,
  gridFeatures: {},
  viewOffsets: {}
};

fixedScenarios.forEach(scenario => {
  initialMapState.tokens[scenario.id] = [];
  initialMapState.shapes[scenario.id] = [];
  initialMapState.tileColors[scenario.id] = {};
  initialMapState.mapConfigs[scenario.id] = { name: scenario.name, icon: scenario.icon, color: scenario.color };
  initialMapState.gridFeatures[scenario.id] = {};
  initialMapState.viewOffsets[scenario.id] = { x: 0, y: 0 };
});

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fichas' | 'map' | 'calendar' | 'tools'>('fichas');
  const [showSettings, setShowSettings] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [calendarNotes, setCalendarNotes] = useState<Record<string, string>>({});
  const [calendarEvents, setCalendarEvents] = useState<Record<string, string[]>>({});
  const [playerDates, setPlayerDates] = useState<Record<string, string>>({});
  const [currentCampaignDate, setCurrentCampaignDate] = useState<string | null>(null);
  const [toolsSubTab, setToolsSubTab] = useState<'combat' | 'diary'>('combat');

  const [combatState, setCombatState] = useState<CombatState>({
    combatants: [],
    turn: 1,
    activeCombatantIndex: 0
  });

  const [savedBattles, setSavedBattles] = useState<SavedBattle[]>([]);
  const [mapState, setMapState] = useState<MapState>(initialMapState);
  const [diceAnimationQueue, setDiceAnimationQueue] = useState<RollData[]>([]);
  const [currentDiceAnimation, setCurrentDiceAnimation] = useState<RollData | null>(null);

  const importFileRef = useRef<HTMLInputElement>(null);

  // Carregamento Inicial do LocalStorage
  useEffect(() => {
    const loadSavedData = () => {
      try {
        const savedChars = localStorage.getItem('soulEaterChars');
        if (savedChars) setCharacters(JSON.parse(savedChars));

        const savedCalendar = localStorage.getItem('soulEaterCalendar');
        if (savedCalendar) {
          const parsed = JSON.parse(savedCalendar);
          setCalendarNotes(parsed.notes || {});
          setCalendarEvents(parsed.events || {});
          setPlayerDates(parsed.playerDates || {});
          setCurrentCampaignDate(parsed.currentCampaignDate || null);
        }

        const savedCombat = localStorage.getItem('soulEaterActiveCombat');
        if (savedCombat) setCombatState(JSON.parse(savedCombat));

        const savedBattlesData = localStorage.getItem('soulEaterSavedBattles');
        if (savedBattlesData) setSavedBattles(JSON.parse(savedBattlesData));

        const savedMap = localStorage.getItem('soulEaterActiveMap');
        if (savedMap) setMapState(JSON.parse(savedMap));

        const savedLogs = localStorage.getItem('soulEaterLogs');
        if (savedLogs) setLogs(JSON.parse(savedLogs));

      } catch (err) {
        console.error("Erro ao carregar dados locais:", err);
      }
    };
    loadSavedData();
  }, []);

  // Auto-Save robusto
  useEffect(() => { localStorage.setItem('soulEaterChars', JSON.stringify(characters)); }, [characters]);
  useEffect(() => { localStorage.setItem('soulEaterLogs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('soulEaterActiveCombat', JSON.stringify(combatState)); }, [combatState]);
  useEffect(() => { localStorage.setItem('soulEaterSavedBattles', JSON.stringify(savedBattles)); }, [savedBattles]);
  useEffect(() => { localStorage.setItem('soulEaterActiveMap', JSON.stringify(mapState)); }, [mapState]);
  useEffect(() => {
    localStorage.setItem('soulEaterCalendar', JSON.stringify({
      notes: calendarNotes,
      events: calendarEvents,
      playerDates: playerDates,
      currentCampaignDate: currentCampaignDate
    }));
  }, [calendarNotes, calendarEvents, playerDates, currentCampaignDate]);

  // Funções de Exportação e Importação
  const handleExportJSON = () => {
    const fullSave = {
      characters,
      logs,
      calendar: {
        notes: calendarNotes,
        events: calendarEvents,
        playerDates: playerDates,
        currentCampaignDate
      },
      combat: combatState,
      savedBattles,
      map: mapState,
      version: "1.0",
      timestamp: Date.now()
    };

    const blob = new Blob([JSON.stringify(fullSave, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `save_devoradores_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addLog('Dados exportados com sucesso!', 'system');
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Atualiza todos os estados baseados no arquivo
        if (data.characters) setCharacters(data.characters);
        if (data.logs) setLogs(data.logs);
        if (data.calendar) {
          setCalendarNotes(data.calendar.notes || {});
          setCalendarEvents(data.calendar.events || {});
          setPlayerDates(data.calendar.playerDates || {});
          setCurrentCampaignDate(data.calendar.currentCampaignDate || null);
        }
        if (data.combat) setCombatState(data.combat);
        if (data.savedBattles) setSavedBattles(data.savedBattles);
        if (data.map) setMapState(data.map);

        addLog('Dados importados com sucesso!', 'system');
        setShowSettings(false);
        alert('Dados carregados com sucesso!');
      } catch (err) {
        console.error("Erro ao importar JSON:", err);
        alert('Erro ao processar o arquivo. Verifique se o formato está correto.');
      }
    };
    reader.readAsText(file);
  };

  const addCharacter = (isNPC = false) => {
    const id = Date.now().toString();
    const newChar = createEmptyChar(id, isNPC ? 'Novo NPC' : 'Novo Devorador', isNPC);
    setCharacters([...characters, newChar]);
    setSelectedCharId(id);
  };

  const removeCharacter = (id: string) => {
    const charToRemove = characters.find(c => c.id === id);
    let newChars = characters.filter(c => c.id !== id);
    if (charToRemove?.companionId) newChars = newChars.filter(c => c.id !== charToRemove.companionId);
    if (charToRemove?.companionId2) newChars = newChars.filter(c => c.id !== charToRemove.companionId2);
    setCharacters(newChars);
    if (selectedCharId === id) setSelectedCharId(null);
  };

  const updateCharacter = (updated: Character) => {
    setCharacters(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const toggleCompanion = (charId: string, slot: 1 | 2 = 1) => {
    const artesao = characters.find(c => c.id === charId);
    if (!artesao) return;
    const companionKey = slot === 1 ? 'companionId' : 'companionId2';
    const existingId = artesao[companionKey];
    if (existingId) {
      setCharacters(prev => prev
        .filter(c => c.id !== existingId)
        .map(c => c.id === charId ? { ...c, [companionKey]: undefined } : c)
      );
    } else {
      const compId = `comp-${slot}-${artesao.id}`;
      const companion = createEmptyChar(compId, `Arma ${slot} de ${artesao.nome}`, true);
      companion.nivel = artesao.nivel;
      setCharacters(prev => [
        ...prev.map(c => c.id === charId ? { ...c, [companionKey]: compId } : c),
        companion
      ]);
    }
  };

  const addLog = (text: string, type: LogEntry['type']) => {
    const newLog: LogEntry = { id: Date.now().toString(), timestamp: Date.now(), text, type };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const showRoll = (description: string, rolls: Roll[], modifier: number, total: number) => {
    const hasSources = rolls.some(r => r.source);
    let logText: string;

    if (hasSources) {
      const groupedBySource = rolls.reduce((acc, roll) => {
          const key = roll.source || 'Outros';
          if (!acc[key]) acc[key] = { rolls: [], total: 0 };
          acc[key].rolls.push(roll);
          acc[key].total += roll.value;
          return acc;
      }, {} as Record<string, { rolls: Roll[], total: number }>);

      let detailedLog = `${description}:\n`;
      Object.entries(groupedBySource).forEach(([source, data]) => {
          const rollsString = data.rolls.map(r => r.value).join(', ');
          detailedLog += `- ${source}: [${rollsString}] = ${data.total}\n`;
      });
      if (modifier !== 0) detailedLog += `Modificador: ${modifier > 0 ? '+' : ''}${modifier}\n`;
      detailedLog += `Total Final: ${total}`;
      logText = detailedLog;
    } else {
      const diceSummary = rolls.reduce((acc, roll) => {
          const key = `d${roll.type}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);

      const summaryString = Object.entries(diceSummary).map(([key, count]) => `${count}${key}`).join(' + ');
      const rollsString = rolls.map(r => r.value).join(', ');
      const modString = modifier !== 0 ? (modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`) : '';
      logText = `${description}: ${summaryString}${modString}\nRolagens: [${rollsString}]\nTotal: ${total}`;
    }
    
    addLog(logText, 'dice');
    setDiceAnimationQueue(prev => [...prev, { description, rolls, modifier, total }]);
  };

  const goToCharacterSheet = (charId: string) => {
    setSelectedCharId(charId);
    setActiveTab('fichas');
  };

  useEffect(() => {
    if (!currentDiceAnimation && diceAnimationQueue.length > 0) {
      const [nextRoll, ...remaining] = diceAnimationQueue;
      setCurrentDiceAnimation(nextRoll);
      setDiceAnimationQueue(remaining);
    }
  }, [currentDiceAnimation, diceAnimationQueue]);

  const handleSaveBattle = (name: string, state: CombatState) => {
    const newSave: SavedBattle = { id: Date.now(), name, state: JSON.parse(JSON.stringify(state)) };
    setSavedBattles(prev => [...prev, newSave]);
  };
  
  const handleLoadBattle = (state: CombatState) => { setCombatState(JSON.parse(JSON.stringify(state))); };
  const handleDeleteBattle = (id: number) => { setSavedBattles(prev => prev.filter(b => b.id !== id)); };
  
  const selectedChar = characters.find(c => c.id === selectedCharId);
  const companionChar1 = selectedChar?.companionId ? characters.find(c => c.id === selectedChar.companionId) : null;
  const companionChar2 = selectedChar?.companionId2 ? characters.find(c => c.id === selectedChar.companionId2) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <DiceAnimationOverlay rollData={currentDiceAnimation} onClose={() => setCurrentDiceAnimation(null)} />
      
      {/* Botão de Sistema Flutuante */}
      <button 
        onClick={() => setShowSettings(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 hover:bg-purple-500 text-white rounded-full flex items-center justify-center shadow-2xl z-[200] transition-all hover:scale-110 active:scale-95 border-2 border-purple-400"
        title="Configurações do Sistema"
      >
        <Settings size={28} />
      </button>

      <header className="bg-zinc-950/80 backdrop-blur-sm border-b border-purple-900/20 p-4 sticky top-0 z-[100]">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-zinc-900 border-2 border-purple-900/50 rounded-full flex items-center justify-center relative soul-glow shadow-lg shadow-purple-900/20">
                <Skull className="text-purple-500" size={28} />
             </div>
             <div>
               <h1 className="title-font text-3xl font-black text-zinc-200 tracking-wider leading-none" style={{ textShadow: '0 0 10px rgba(168, 85, 247, 0.5)' }}>
                 DEVORADORES DE ALMA
               </h1>
               <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-[0.3em]">Gerenciador de Ressonância</span>
             </div>
          </div>
          <nav className="flex bg-black/40 p-1.5 rounded-full border border-purple-900/10 shadow-inner">
            {[
              { id: 'fichas', icon: Users, label: 'ALMAS' },
              { id: 'map', icon: MapIcon, label: 'CAMPO' },
              { id: 'calendar', icon: CalendarIcon, label: 'CALENDÁRIO' },
              { id: 'tools', icon: Swords, label: 'COMBATE' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative px-5 py-2 rounded-full text-[11px] font-black tracking-widest transition-all duration-300 ${activeTab === tab.id ? 'text-white' : 'text-zinc-500 hover:text-purple-400'}`}>
                {activeTab === tab.id && <div className="absolute inset-0 bg-purple-600 rounded-full soul-glow -z-10 animate-in fade-in" />}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-6 md:p-8 relative">
        {activeTab === 'map' && (
          <InteractiveMap 
            characters={characters} 
            mapState={mapState}
            onMapStateChange={setMapState}
            onSelectCharacter={(charId: string) => {
              setSelectedCharId(charId);
              setActiveTab('fichas');
            }}
          />
        )}

        {activeTab === 'fichas' && (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-80 space-y-6 shrink-0">
              <div className="space-y-2">
                <button onClick={() => addCharacter(false)} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20 active:scale-95"><Plus size={16}/> NOVO DEVORADOR</button>
                <button onClick={() => addCharacter(true)} className="w-full bg-zinc-900/50 text-zinc-400 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-800/50 transition-all border border-zinc-800 active:scale-95"><Plus size={16}/> CRIAR NPC</button>
              </div>
              <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                {characters.filter(c => !characters.some(p => p.companionId === c.id || p.companionId2 === c.id)).map(c => (
                  <div key={c.id} className={`relative p-3 rounded-xl cursor-pointer transition-all duration-300 border-2 ${selectedCharId === c.id ? 'bg-purple-950/30 border-purple-600/80 soul-glow' : 'bg-zinc-950/50 border-zinc-900 hover:border-purple-900/50'}`} onClick={() => setSelectedCharId(c.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.isNPC ? 'bg-zinc-800 text-zinc-500' : 'bg-purple-900/50 text-purple-400'}`}>
                          {c.isNPC ? <Moon size={20}/> : <Users size={20}/>}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-black uppercase tracking-wider ${c.isNPC ? 'text-zinc-400' : 'text-zinc-100'}`}>{c.nome}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-bold text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded">NV. {c.nivel}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeCharacter(c.id); }} className="text-zinc-800 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-12">
              {selectedChar ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CharacterSheet char={selectedChar} updateChar={updateCharacter} onToggleCompanion={(slot) => toggleCompanion(selectedCharId!, slot)} companions={[companionChar1, companionChar2].filter(Boolean) as Character[]} />
                  {companionChar1 && <div className="mt-12 pt-8 border-t-2 border-purple-900/10"><CharacterSheet char={companionChar1} updateChar={updateCharacter} isCompanion parentChar={selectedChar} /></div>}
                  {companionChar2 && <div className="mt-12 pt-8 border-t-2 border-blue-900/10"><CharacterSheet char={companionChar2} updateChar={updateCharacter} isCompanion parentChar={selectedChar} /></div>}
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center border-2 border-dashed border-zinc-900 rounded-2xl text-zinc-800 title-font text-2xl uppercase tracking-widest">Selecione uma alma</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="animate-in fade-in zoom-in-95 duration-500 h-[85vh]">
            <CalendarTool characters={characters} notes={calendarNotes} events={calendarEvents} playerDates={playerDates} onUpdateNotes={(date, val) => setCalendarNotes(prev => ({...prev, [date]: val}))} onUpdateEvents={(date, val) => setCalendarEvents(prev => ({...prev, [date]: val}))} onUpdatePlayerDate={(charId, date) => setPlayerDates(prev => ({...prev, [charId]: date}))} currentCampaignDate={currentCampaignDate} onSetCurrentCampaignDate={setCurrentCampaignDate} />
          </div>
        )}
        
        {activeTab === 'tools' && (
          <div className="grid lg:grid-cols-4 gap-10">
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-zinc-950 p-2 rounded-xl border border-purple-900/10 flex flex-col gap-2">
                <button onClick={() => setToolsSubTab('combat')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${toolsSubTab === 'combat' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-zinc-600 hover:text-purple-400'}`}><Swords size={18}/><span className="text-[10px] font-black uppercase tracking-widest">Combate</span></button>
                <button onClick={() => setToolsSubTab('diary')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${toolsSubTab === 'diary' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-zinc-600 hover:text-purple-400'}`}><ClipboardList size={18}/><span className="text-[10px] font-black uppercase tracking-widest">Log</span></button>
              </div>
              <DiceRoller onRoll={showRoll} />
              <div className="bg-zinc-950 p-8 rounded-xl border border-purple-900/10">
                <h4 className="text-[12px] font-black text-zinc-500 uppercase mb-6 tracking-widest">Consultar Grimório</h4>
                <input placeholder="Dúvida sobre regras..." className="w-full bg-black p-4 text-base border border-zinc-900 rounded-lg focus:border-purple-600 outline-none transition-all" onKeyDown={e => { if(e.key === 'Enter') { explainRule((e.target as HTMLInputElement).value).then(res => addLog(res, 'ai')); (e.target as HTMLInputElement).value = ''; } }} />
              </div>
            </div>
            <div className="lg:col-span-3">
              {toolsSubTab === 'diary' && (
                <div className="bg-black border border-purple-900/10 rounded-2xl flex flex-col h-[85vh] shadow-2xl animate-in fade-in duration-500">
                  <div className="p-5 border-b border-purple-900/10 bg-zinc-950 flex justify-between items-center"><span className="text-[12px] font-black text-zinc-500 uppercase tracking-widest">Log de Rolagens</span><button onClick={() => setLogs([])} className="text-[12px] text-zinc-700 hover:text-red-500 font-black uppercase tracking-widest transition-colors">Purgar</button></div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-3 font-mono text-sm custom-scrollbar">
                    {logs.map(log => (<div key={log.id} className="flex gap-6 text-zinc-600 border-b border-zinc-900/50 pb-2"><span className="text-zinc-800">[{new Date(log.timestamp).toLocaleTimeString()}]</span><span className={`whitespace-pre-wrap ${log.type === 'dice' ? 'text-purple-400 font-bold' : log.type === 'ai' ? 'text-blue-400' : ''}`}>{log.text}</span></div>))}
                  </div>
                </div>
              )}
              {toolsSubTab === 'combat' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <CombatMonitor characters={characters} combatState={combatState} onCombatStateChange={setCombatState} savedBattles={savedBattles} onSaveBattle={handleSaveBattle} onLoadBattle={handleLoadBattle} onDeleteBattle={handleDeleteBattle} onRoll={showRoll} onGoToSheet={goToCharacterSheet} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Configurações do Sistema */}
      {showSettings && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#0c0a0e] border border-purple-600/30 rounded-3xl w-full max-w-xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)]">
            <div className="p-8 border-b border-zinc-900 flex justify-between items-center">
              <div>
                <h3 className="title-font text-2xl text-purple-500 uppercase tracking-tighter">SISTEMA DE ARQUIVAMENTO</h3>
                <p className="text-xs text-zinc-500 mt-1">Gerencie a alma dos seus dados (Backup & Restauração).</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 transition-colors"><X size={24}/></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={handleExportJSON}
                  className="flex flex-col items-center gap-4 p-6 bg-zinc-950 border border-purple-900/30 rounded-2xl hover:border-purple-500 transition-all group"
                >
                  <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    <Download size={32} />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-black text-white uppercase block">Exportar Save</span>
                    <span className="text-[10px] text-zinc-500 font-bold">Gera arquivo .json</span>
                  </div>
                </button>

                <button 
                  onClick={() => importFileRef.current?.click()}
                  className="flex flex-col items-center gap-4 p-6 bg-zinc-950 border border-blue-900/30 rounded-2xl hover:border-blue-500 transition-all group"
                >
                  <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <FileUp size={32} />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-black text-white uppercase block">Importar Save</span>
                    <span className="text-[10px] text-zinc-500 font-bold">Restaura dados de arquivo</span>
                  </div>
                  <input 
                    type="file" 
                    ref={importFileRef} 
                    onChange={handleImportJSON} 
                    accept=".json" 
                    className="hidden" 
                  />
                </button>
              </div>

              <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-3 mb-4">
                  <Info size={18} className="text-purple-400" />
                  <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Informação de Persistência</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                  O site salva automaticamente suas alterações no navegador (LocalStorage). Use a exportação em JSON para transferir sua campanha para outro dispositivo ou para garantir que não perderá dados se limpar o histórico do navegador.
                </p>
                <div className="mt-4 flex justify-between items-center text-[10px] font-bold text-zinc-600">
                  <span>Almas Ativas: {characters.length}</span>
                  <span>Último Auto-save: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  if(confirm("ATENÇÃO: Isso apagará TODOS os dados locais permanentemente. Deseja prosseguir?")) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="w-full py-4 bg-red-950/20 hover:bg-red-900/40 text-red-500 border border-red-900/30 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
              >
                Purgar Todos os Dados Locais
              </button>
            </div>
            
            <div className="p-6 bg-zinc-950/80 text-center">
               <button onClick={() => setShowSettings(false)} className="px-10 py-3 bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-500 transition-all">Sincronizar Grimório</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
