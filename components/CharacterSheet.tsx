
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Character, Race, Attributes, Role, ArmorItem, SoulAlignment } from '../types';
import { RACE_DATA, SKILLS_GROUPS, LEVELING_TABLE, VANTAGES_DATA, VantageDef, MASTERY_SKILLS_DATA, MASTERY_XP_COSTS } from '../constants';
import { Shield, Zap, Heart, Sword, User, Plus, Minus, PlusCircle, MinusCircle, ChevronDown, ChevronUp, Link as LinkIcon, Unlink, Check, X, Search, Info, Sparkles, Flame, Target, Box, Settings2, ShieldAlert, Star, Activity, UploadCloud } from 'lucide-react';

interface ArmorSlotCardProps {
  slot: keyof Character['armaduras'];
  label: string;
  item: ArmorItem;
  expanded: boolean;
  onToggleExpand: () => void;
  updateItem: (updates: Partial<ArmorItem>) => void;
}

const ArmorSlotCard: React.FC<ArmorSlotCardProps> = ({ slot, label, item, expanded, onToggleExpand, updateItem }) => {
  return (
    <div className={`bg-zinc-900/20 p-3 rounded-xl border transition-all ${item.equipado ? 'border-purple-600/40 bg-purple-950/5' : 'border-zinc-800'}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${item.equipado ? 'bg-purple-500 soul-glow' : 'bg-zinc-800'}`}></div>
          <span className="text-[12px] text-zinc-500 font-black uppercase tracking-widest">{label}</span>
          {!expanded && item.nome && (
            <span className="text-[12px] text-zinc-400 font-bold ml-2 truncate max-w-[120px]">— {item.nome}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => updateItem({ equipado: !item.equipado })}
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all border ${item.equipado ? 'bg-purple-600 border-purple-400 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-50'}`}
          >
            {item.equipado ? 'EQUIPADO' : 'DESEQUIPADO'}
          </button>
          <button 
            onClick={onToggleExpand}
            className="p-1 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-all"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="space-y-3 mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <input 
            type="text" 
            placeholder="Nome da Armadura" 
            className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-purple-600/30"
            value={item.nome}
            onChange={e => updateItem({ nome: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-zinc-600 font-black uppercase">DEF Física</span>
              <input 
                type="number" 
                className="bg-black/40 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm text-zinc-300 outline-none" 
                value={item.fisica}
                onChange={e => updateItem({ fisica: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-zinc-600 font-black uppercase">DEF Espiritual</span>
              <input 
                type="number" 
                className="bg-black/40 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm text-zinc-300 outline-none" 
                value={item.espiritual}
                onChange={e => updateItem({ espiritual: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <textarea 
            placeholder="Efeitos e notas..." 
            className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-[12px] text-zinc-400 outline-none focus:border-purple-600/30 min-h-[40px] italic"
            value={item.efeitos}
            onChange={e => updateItem({ efeitos: e.target.value })}
          />
        </div>
      )}
    </div>
  );
};

const SectionTitle = ({ title, icon: Icon, action }: { title: string, icon?: any, action?: React.ReactNode }) => (
  <div className="flex items-center justify-between border-b border-purple-900/30 pb-2 mb-4">
    <div className="flex items-center gap-2">
      {Icon && <Icon size={14} className="text-purple-500" />}
      <span className="text-zinc-400 text-[12px] tracking-[0.2em] font-bold uppercase">{title}</span>
    </div>
    {action}
  </div>
);

const Card = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
  <div className={`bg-zinc-950/50 p-6 rounded-2xl border border-zinc-900 ${className}`}>
    {children}
  </div>
);

interface Props {
  char: Character;
  updateChar: (updated: Character) => void;
  isCompanion?: boolean;
  parentChar?: Character;
  onToggleCompanion?: (slot?: 1 | 2) => void;
  companions?: Character[];
}

export const CharacterSheet: React.FC<Props> = ({ char, updateChar, isCompanion, parentChar, onToggleCompanion, companions }) => {
  const [xpToModify, setXpToModify] = useState(0);
  const [isExpanded, setIsExpanded] = useState(!isCompanion);
  const [activeSkillSlot, setActiveSkillSlot] = useState<number | null>(null);
  const [showVantageSelector, setShowVantageSelector] = useState(false);
  const [vantageFilter, setVantageFilter] = useState("");
  const [expandedArmorSlots, setExpandedArmorSlots] = useState<Record<string, boolean>>({});
  const [activeMasteryModal, setActiveMasteryModal] = useState<string | null>(null);
  const [hoveredSkill, setHoveredSkill] = useState<{name: string, desc: string} | null>(null);
  
  const raceInfo = RACE_DATA[char.raca];
  const masteryOptions = ["--", "D", "C", "B", "A", "S"];
  const masteryKeys = ["maestriaCombate", "maestriaRessonancia", "maestriaMagia"];
  const menuRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveSkillSlot(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isCompanion && parentChar) {
      if (char.nivel !== parentChar.nivel || 
          char.maestriaCombate !== parentChar.maestriaCombate || 
          char.maestriaRessonancia !== parentChar.maestriaRessonancia) {
        updateChar({
          ...char,
          nivel: parentChar.nivel,
          maestriaCombate: parentChar.maestriaCombate,
          maestriaRessonancia: parentChar.maestriaRessonancia
        });
      }
    }
  }, [parentChar?.nivel, parentChar?.maestriaCombate, parentChar?.maestriaRessonancia, char.nivel, char.maestriaCombate, char.maestriaRessonancia, isCompanion, parentChar, updateChar]);

  const masteryXpSpent = useMemo(() => {
    const calculateForChar = (targetChar: Character) => {
      let total = 0;
      const ranks = ["C", "B", "A", "S"];
      masteryKeys.forEach(key => {
        const currentRank = (targetChar as any)[key];
        ranks.forEach(rank => {
          if (ranks.indexOf(rank) <= ranks.indexOf(currentRank)) {
            total += (MASTERY_XP_COSTS as any)[rank] || 0;
          }
        });
      });
      return total;
    };

    let totalSpent = calculateForChar(char);
    
    if (!isCompanion && companions) {
      companions.forEach(comp => {
        totalSpent += calculateForChar(comp);
      });
    }

    return totalSpent;
  }, [char, companions, isCompanion]);

  const vantageBonuses = useMemo(() => {
    const bonuses = { hp: 0, al: 0, st: 0, speed: 0, armorFisica: 0, armorEspiritual: 0, inteligencia: 0, totalCost: 0 };
    Object.entries(char.vantagensSelecionadas || {}).forEach(([vId, level]) => {
      const def = VANTAGES_DATA.find(v => v.id === vId);
      if (!def) return;
      const lvl = level as number;
      if (def.cost === 'variable') bonuses.totalCost += lvl;
      else bonuses.totalCost += def.cost;

      if (vId === 'blindado' && char.blindadoChoice) {
        if (char.blindadoChoice === 'fisica') bonuses.armorFisica += 3;
        else bonuses.armorEspiritual += 3;
      }

      if (def.bonuses) {
        if (def.bonuses.hp) bonuses.hp += def.bonuses.hp * lvl;
        if (def.bonuses.al) bonuses.al += def.bonuses.al * lvl;
        if (def.bonuses.st) bonuses.st += def.bonuses.st * lvl;
        if (def.bonuses.speed) bonuses.speed += def.bonuses.speed * lvl;
        if (vId !== 'blindado' && def.bonuses.armor) {
           bonuses.armorFisica += def.bonuses.armor;
           bonuses.armorEspiritual += def.bonuses.armor;
        }
        const intBonus = def.bonuses?.attributes?.inteligencia;
        if (typeof intBonus === 'number') bonuses.inteligencia += intBonus;
      }
    });
    return bonuses;
  }, [char.vantagensSelecionadas, char.blindadoChoice]);

  const levelLimits = useMemo(() => {
    let totalAttr = 0, totalSkills = 0, totalVant = 0, hpAcc = 0, alAcc = 0, stAcc = 0, xpAcc = 0;
    for (let i = 1; i <= char.nivel; i++) {
      const data = LEVELING_TABLE[i];
      if (data) {
        totalAttr += data.attrPoints; totalSkills += data.skillPoints; totalVant += data.vantPoints;
        hpAcc += data.hpBonus; alAcc += data.alBonus; stAcc += data.stBonus; xpAcc += data.xpCost;
      }
    }
    return {
      attrPool: totalAttr, skillPool: totalSkills, vantPool: totalVant,
      attrLimit: LEVELING_TABLE[char.nivel]?.attrLimit || 0,
      skillLimit: LEVELING_TABLE[char.nivel]?.skillLimit || 0,
      hpBonus: hpAcc, alBonus: alAcc, stBonus: stAcc, xpSpentByLevel: xpAcc
    };
  }, [char.nivel]);

  const alignmentBonuses = useMemo(() => {
    switch(char.alinhamento) {
      case SoulAlignment.IMACULADO: return { resist: 2, coragem: 2 };
      case SoulAlignment.CORAJOSO: return { resist: 1, coragem: 1 };
      case SoulAlignment.LOUCO: return { resist: -1, coragem: -1 };
      case SoulAlignment.INSANO: return { resist: -2, coragem: -2 };
      default: return { resist: 0, coragem: 0 };
    }
  }, [char.alinhamento]);

  const totalStats = useMemo(() => {
    const stats = { ...char.atributosBase };
    if (raceInfo) Object.entries(raceInfo.attributes).forEach(([attr, val]) => { (stats as any)[attr] += val; });
    if (char.racaEscolhaAtributo) (stats as any)[char.racaEscolhaAtributo] += 2;
    if (vantageBonuses.inteligencia) stats.inteligencia += vantageBonuses.inteligencia;
    return stats;
  }, [char.atributosBase, char.raca, char.racaEscolhaAtributo, raceInfo, vantageBonuses.inteligencia]);

  const maxHp = 30 + (totalStats.constituicao * 5) + levelLimits.hpBonus + vantageBonuses.hp;
  const maxAl = 10 + (totalStats.porte * 5) + levelLimits.alBonus + vantageBonuses.al;
  const maxSt = 20 + (totalStats.forca * 5) + levelLimits.stBonus + vantageBonuses.st;

  const spentPoints = useMemo(() => {
    const attrSpent = Object.values(char.atributosBase).reduce((a: number, b: number) => a + b, 0);
    const skillSpent = Object.values(char.pericias).reduce((a: number, b: number) => a + b, 0);
    return { attr: attrSpent, skill: skillSpent };
  }, [char.atributosBase, char.pericias]);

  const getSkillBonus = (skillName: string) => {
    if (!raceInfo) return 0;
    let bonus = raceInfo.skills[skillName] || 0;
    if (char.racaEscolhaPericia && raceInfo.skillChoices) {
      char.racaEscolhaPericia.forEach((s, idx) => { if (s === skillName) bonus += raceInfo.skillChoices!.values[idx]; });
    }
    if (skillName === "Sabedoria" && char.vantagensSelecionadas['estudioso']) bonus += 1;
    return bonus;
  };

  const speed = 1 + totalStats.destreza + (char.pericias["Atletismo"] || 0) + getSkillBonus("Atletismo") + vantageBonuses.speed;

  const handleAttrChange = (attr: keyof Attributes, delta: number) => {
    const current = char.atributosBase[attr];
    const next = current + delta;
    if (next >= 0 && next <= levelLimits.attrLimit) updateChar({ ...char, atributosBase: { ...char.atributosBase, [attr]: next } });
  };

  const handleSkillChange = (skill: string, delta: number) => {
    const current = char.pericias[skill] || 0;
    const next = current + delta;
    if (next >= 0 && next <= levelLimits.skillLimit) updateChar({ ...char, pericias: { ...char.pericias, [skill]: next } });
  };

  const handleFieldChange = (field: keyof Character, value: any) => { updateChar({ ...char, [field]: value }); };

  const modifyXp = (amount: number) => { handleFieldChange('experiencia', Math.max(0, char.experiencia + amount)); setXpToModify(0); };

  const toggleVantage = (vId: string) => {
    const current = char.vantagensSelecionadas || {};
    const newVants = { ...current };
    const def = VANTAGES_DATA.find(v => v.id === vId);
    if (newVants[vId]) {
      if (def?.cost === 'variable' && newVants[vId] < (def.maxLevel || 5)) newVants[vId]++;
      else delete newVants[vId];
    } else newVants[vId] = 1;
    updateChar({ ...char, vantagensSelecionadas: newVants });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleFieldChange('imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const totalArmorFisicaValue = useMemo(() => {
    let sum = char.armaduraFisica + vantageBonuses.armorFisica;
    if (char.armaduras.cabeca.equipado) sum += char.armaduras.cabeca.fisica;
    if (char.armaduras.superior.equipado) sum += char.armaduras.superior.fisica;
    if (char.armaduras.inferior.equipado) sum += char.armaduras.inferior.fisica;
    return sum;
  }, [char.armaduraFisica, vantageBonuses.armorFisica, char.armaduras]);

  const totalArmorEspiritualValue = useMemo(() => {
    let sum = char.armaduraEspiritual + vantageBonuses.armorEspiritual;
    if (char.armaduras.cabeca.equipado) sum += char.armaduras.cabeca.espiritual;
    if (char.armaduras.superior.equipado) sum += char.armaduras.superior.espiritual;
    if (char.armaduras.inferior.equipado) sum += char.armaduras.inferior.espiritual;
    return sum;
  }, [char.armaduraEspiritual, vantageBonuses.armorEspiritual, char.armaduras]);

  const hasTrioTernura = char.vantagensSelecionadas && char.vantagensSelecionadas['trio_ternura'];

  const toggleArmorSlot = (slot: string) => {
    setExpandedArmorSlots(prev => ({ ...prev, [slot]: !prev[slot] }));
  };

  const handleArmorItemUpdate = (slot: keyof Character['armaduras'], updates: Partial<ArmorItem>) => {
    updateChar({
      ...char,
      armaduras: {
        ...char.armaduras,
        [slot]: { ...char.armaduras[slot], ...updates }
      }
    });
  };

  const toggleMasterySkill = (masteryKey: string, rank: string, skillName: string) => {
    const current = { ...(char.masterySkills || {}) };
    if (!current[masteryKey]) current[masteryKey] = {};
    current[masteryKey][rank] = skillName;
    handleFieldChange('masterySkills', current);
  };

  if (isCompanion && !isExpanded) {
    return (
      <div className="bg-[#0f0f12] border border-purple-900/30 rounded-xl p-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-6">
          <button onClick={() => setIsExpanded(true)} className="bg-purple-600/20 p-2 rounded-lg text-purple-400 hover:bg-purple-600/40"><ChevronDown size={18} /></button>
          <div>
            <h4 className="title-font text-purple-500 text-lg uppercase leading-none">{char.nome}</h4>
            <span className="text-[11px] text-zinc-600 font-black uppercase tracking-widest">Arma Demoníaca Sincronizada (Nv {char.nivel})</span>
          </div>
        </div>
        <div className="flex gap-4">
           {[ { label: 'HP', val: char.hp, col: 'text-red-500' }, { label: 'AL', val: char.al, col: 'text-blue-500' }, { label: 'ST', val: char.st, col: 'text-yellow-500' } ].map(s => (
             <div key={s.label} className="bg-black/40 px-3 py-1 rounded border border-zinc-800 text-center min-w-[60px]">
               <span className={`text-[10px] font-black uppercase block ${s.col}`}>{s.label}</span>
               <span className="text-base font-black text-white">{s.val}</span>
             </div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#0a0a0c] p-6 md:p-8 rounded-2xl border border-purple-900/20 shadow-2xl transition-all duration-300 relative ${isCompanion ? 'border-purple-600/30 bg-[#0c0c0e]' : ''}`}>
      
      {isCompanion && (
        <button onClick={() => setIsExpanded(false)} className="absolute top-6 right-8 bg-zinc-900 hover:bg-zinc-800 p-2 rounded-full text-zinc-500" title="Recolher Ficha"><ChevronUp size={20} /></button>
      )}

      {/* HEADER: NIVEL E XP */}
      <div className="flex flex-col md:flex-row items-stretch gap-6 mb-4">
        {/* IMAGEM */}
        <div className="relative group w-32 h-32 md:w-36 md:h-36 shrink-0">
          <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          {char.imageUrl ? (
            <img src={char.imageUrl} alt={char.nome} className="w-full h-full object-cover rounded-2xl border-2 border-purple-900/30 shadow-lg" />
          ) : (
            <div className="w-full h-full bg-zinc-950 rounded-2xl border-2 border-dashed border-zinc-800 flex items-center justify-center">
              <UploadCloud size={40} className="text-zinc-700" />
            </div>
          )}
          <div 
            onClick={() => imageInputRef.current?.click()}
            className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Plus size={32} className="text-purple-500" />
          </div>
        </div>

        {/* CONTAINER DE INFO E XP */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 items-center md:items-stretch">
          <div className="flex-1 bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900 flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <input 
                type="text" 
                className="title-font text-3xl md:text-4xl text-purple-600 tracking-tighter leading-tight uppercase truncate bg-transparent border-none outline-none w-full"
                value={char.nome || ''}
                placeholder={isCompanion ? 'ARMA DEMONÍACA' : 'ALMA DEVORADORA'}
                onChange={e => handleFieldChange('nome', e.target.value)}
              />
              {isCompanion && <div className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-tighter shrink-0"><LinkIcon size={10}/> Sincronizado</div>}
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1 bg-purple-900/30 px-3 py-1 rounded-full border border-purple-900/20 ${isCompanion ? 'opacity-50 grayscale' : ''}`}>
                 <span className="text-[12px] text-purple-400 font-black uppercase">Nível</span>
                 <select disabled={isCompanion} className="bg-transparent text-purple-500 font-black text-base outline-none cursor-pointer" value={char.nivel} onChange={e => handleFieldChange('nivel', parseInt(e.target.value))}>
                   {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n} className="bg-zinc-950">0{n}</option>)}
                 </select>
              </div>
              <input 
                type="text"
                className="text-zinc-600 text-[12px] font-bold uppercase tracking-widest truncate bg-transparent border-none outline-none"
                value={char.titulo || ''}
                placeholder="Título da Alma"
                onChange={e => handleFieldChange('titulo', e.target.value)}
              />
            </div>
          </div>
          
          {!isCompanion && (
            <div className="w-full md:w-auto bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900 flex flex-col justify-between gap-3">
              <div className="flex items-center gap-4 px-2">
                  <div className="text-center min-w-[60px]">
                    <span className="text-[9px] text-zinc-500 block uppercase font-black mb-0.5">XP Restante</span>
                    <div className="text-lg font-black text-purple-400">{char.experiencia - levelLimits.xpSpentByLevel - char.experienciaGasta - masteryXpSpent}</div>
                  </div>
                  <div className="w-[1px] h-6 bg-zinc-800"></div>
                  <div className="text-center min-w-[60px]">
                    <span className="text-[9px] text-zinc-500 block uppercase font-black mb-0.5">XP Gasto</span>
                    <div className="text-lg font-black text-zinc-400">{levelLimits.xpSpentByLevel + char.experienciaGasta + masteryXpSpent}</div>
                  </div>
                  <div className="w-[1px] h-6 bg-zinc-800"></div>
                  <div className="text-center min-w-[60px]">
                    <span className="text-[9px] text-zinc-500 block uppercase font-black mb-0.5">XP Total</span>
                    <div className="text-lg font-black text-white">{char.experiencia}</div>
                  </div>
              </div>
              <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-zinc-800">
                <input type="number" className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs w-16 text-purple-400 font-bold outline-none focus:border-purple-600" placeholder="Qtd" value={xpToModify || ''} onChange={e => setXpToModify(parseInt(e.target.value) || 0)} />
                <div className="flex gap-1">
                  <button onClick={() => modifyXp(xpToModify)} className="bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-black uppercase px-2 py-1.5 rounded flex items-center gap-1 transition-all"><PlusCircle size={10} /> Adicionar</button>
                  <button onClick={() => modifyXp(-xpToModify)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[9px] font-black uppercase px-2 py-1.5 rounded flex items-center gap-1 transition-all"><MinusCircle size={10} /> Reduzir</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LINHA DE RESUMO DE PONTOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-purple-950/20 p-3 rounded-xl border border-purple-900/30 flex justify-between items-center h-16">
             <div className="flex flex-col"><span className="text-[10px] text-purple-400 uppercase font-black tracking-widest">Atributos</span><span className="text-xs font-bold text-zinc-400">Gasto: {spentPoints.attr} / {levelLimits.attrPool}</span></div>
             <div className={`text-xl font-black ${spentPoints.attr > levelLimits.attrPool ? 'text-red-500' : 'text-purple-500'}`}>{levelLimits.attrPool - spentPoints.attr}</div>
          </div>
          <div className="bg-purple-950/20 p-3 rounded-xl border border-purple-900/30 flex justify-between items-center h-16">
             <div className="flex flex-col"><span className="text-[10px] text-purple-400 uppercase font-black tracking-widest">Perícias</span><span className="text-xs font-bold text-zinc-400">Gasto: {spentPoints.skill} / {levelLimits.skillPool}</span></div>
             <div className={`text-xl font-black ${spentPoints.skill > levelLimits.skillPool ? 'text-red-500' : 'text-purple-500'}`}>{levelLimits.skillPool - spentPoints.skill}</div>
          </div>
          <div className="bg-purple-950/20 p-3 rounded-xl border border-purple-900/30 flex justify-between items-center h-16">
             <div className="flex flex-col"><span className="text-[10px] text-purple-400 uppercase font-black tracking-widest">Vantagens</span><span className="text-xs font-bold text-zinc-400">Gasto: {vantageBonuses.totalCost} / {levelLimits.vantPool}</span></div>
             <div className={`text-xl font-black ${vantageBonuses.totalCost > levelLimits.vantPool ? 'text-red-500' : 'text-purple-500'}`}>{levelLimits.vantPool - vantageBonuses.totalCost}</div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* COLUNA 1 */}
        <div className="space-y-8">
          <Card>
            <SectionTitle title="IDENTIFICAÇÃO" icon={User} />
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {[ { label: 'Nome', field: 'nome' }, { label: 'Título', field: 'titulo' }, { label: 'Raça', field: 'raca', type: 'select' }, { label: 'Idade', field: 'idade' }, { label: 'Nacionalidade', field: 'nacionalidade' }, { label: 'Dinheiro', field: 'dinheiro' } ].map(item => (
                <div key={item.field} className="flex flex-col group">
                  <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1">{item.label}</span>
                  {item.type === 'select' ? (
                    <select className="bg-black border border-zinc-800 rounded px-2 py-1.5 text-sm text-purple-400 font-bold outline-none" value={char.raca} onChange={e => { const newRace = e.target.value as Race; updateChar({ ...char, raca: newRace, racaEscolhaAtributo: undefined, racaEscolhaPericia: undefined, vantagemRaca: RACE_DATA[newRace]?.advantage || "" }); }}>
                      {Object.values(Race).map(r => <option key={r} value={r} className="bg-zinc-950">{r}</option>)}
                    </select>
                  ) : (
                    <input className="bg-black border border-zinc-800 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-purple-600/50 transition-all" value={(char as any)[item.field]} onChange={e => handleFieldChange(item.field as any, e.target.value)} />
                  )}
                </div>
              ))}
              {isCompanion && (
                <div className="col-span-2 flex flex-col group">
                  <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1">Tipo de Arma</span>
                  <select
                    className="bg-black border border-zinc-800 rounded px-2 py-1.5 text-sm text-purple-400 font-bold outline-none"
                    value={char.weaponType || 'Ataque'}
                    onChange={e => handleFieldChange('weaponType', e.target.value as any)}
                  >
                    <option value="Ataque">Ataque</option>
                    <option value="Defesa">Defesa</option>
                    <option value="Suporte">Suporte</option>
                  </select>
                </div>
              )}
              <div className="col-span-2 flex flex-col group">
                 <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1">Alinhamento de Alma</span>
                 <select className="bg-black border border-zinc-800 rounded px-2 py-1.5 text-sm text-purple-400 font-bold outline-none focus:border-purple-600/50" value={char.alinhamento} onChange={e => handleFieldChange('alinhamento', e.target.value)}>
                   {Object.values(SoulAlignment).map(a => <option key={a} value={a} className="bg-zinc-950">{a}</option>)}
                 </select>
                 <div className="mt-2 p-3 bg-zinc-950/50 rounded-lg border border-zinc-900">
                    <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-900 pb-1 mb-1">Resumo de Efeito</p>
                    <p className="text-[11px] text-zinc-400 italic leading-tight">
                      {char.alinhamento === SoulAlignment.IMACULADO && "Imaculado (Ordem): +2 para resistir à Insanidade, +2 para obter Coragem. Habilita passivas de Coragem. Bloqueado para Bruxas/Feiticeiros."}
                      {char.alinhamento === SoulAlignment.CORAJOSO && "Corajoso (Ordem): +1 para resistir à Insanidade, +1 para obter Coragem. Habilita passivas de Coragem. Bloqueado para Bruxas."}
                      {char.alinhamento === SoulAlignment.NEUTRO && "Neutro (Equilíbrio): Sem bônus ou penalidades. Padrão da Academia Shibusen."}
                      {char.alinhamento === SoulAlignment.LOUCO && "Louco (Insanidade): -1 para resistir à Insanidade, -1 para obter Coragem. Tendência instável."}
                      {char.alinhamento === SoulAlignment.INSANO && "Insano (Insanidade): -2 para resistir à Insanidade, -2 para obter Coragem. Caminho do Kishin."}
                    </p>
                 </div>
              </div>
              {!isCompanion && onToggleCompanion && (
                <div className="col-span-2 space-y-2 mt-2">
                  <button onClick={() => onToggleCompanion(1)} className={`w-full py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border ${char.companionId ? 'bg-red-950/20 border-red-900/40 text-red-500 hover:bg-red-900/30' : 'bg-purple-600 border-purple-400 text-white hover:bg-purple-700'}`}>
                    {char.companionId ? <><Unlink size={14}/> Romper Vínculo 1</> : <><LinkIcon size={14}/> Vincular Arma 1</>}
                  </button>
                  {hasTrioTernura && (
                     <button onClick={() => onToggleCompanion(2)} className={`w-full py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border ${char.companionId2 ? 'bg-red-950/20 border-red-900/40 text-red-500 hover:bg-red-900/30' : 'bg-blue-600 border-blue-400 text-white hover:bg-blue-700'}`}>
                      {char.companionId2 ? <><Unlink size={14}/> Romper Vínculo 2</> : <><LinkIcon size={14}/> Vincular Arma 2 (Trio)</>}
                    </button>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <SectionTitle title="ATRIBUTOS" icon={Zap} />
            <div className="grid grid-cols-1 gap-3">
              {(Object.entries(totalStats) as [string, number][]).map(([key, total]) => {
                const baseValue = char.atributosBase[key as keyof Attributes];
                const totalBonus = (raceInfo?.attributes[key as keyof Attributes] || 0) + (char.racaEscolhaAtributo === key ? 2 : 0);
                return (
                  <div key={key} className="flex items-center justify-between group bg-zinc-900/20 p-3 rounded-lg border border-zinc-900/50 hover:border-purple-900/20 transition-all">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2"><span className="text-2xl font-black text-purple-500 w-8">{total}</span><span className="capitalize text-base font-bold text-zinc-300">{key}</span></div>
                      {totalBonus !== 0 && <span className="inline-flex items-center gap-1 bg-purple-600/20 text-purple-400 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase ml-10 border border-purple-600/20">+{totalBonus} RAÇA</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end"><span className="text-[11px] text-zinc-500 font-black uppercase tracking-tighter">BASE / LIM</span><span className="text-[12px] text-zinc-400 font-bold">{baseValue} / {levelLimits.attrLimit}</span></div>
                      <div className="flex items-center bg-black/40 rounded-lg p-1 border border-zinc-800 gap-2">
                          <button onClick={() => handleAttrChange(key as keyof Attributes, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-400 transition-colors"><Minus size={14}/></button>
                          <button onClick={() => handleAttrChange(key as keyof Attributes, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-zinc-800 rounded text-zinc-500 hover:text-green-400 transition-colors"><Plus size={14}/></button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {raceInfo?.attributeChoices && (
                <div className="bg-purple-950/20 p-3 rounded-xl border border-purple-900/20 mt-2">
                   <span className="text-[11px] text-purple-400 uppercase font-black block mb-2">Bônus de Raça (+2 em um)</span>
                   <div className="flex gap-2">
                      {raceInfo.attributeChoices.map(attr => (
                        <button key={attr} onClick={() => handleFieldChange('racaEscolhaAtributo', attr)} className={`flex-1 py-1 text-[11px] font-bold uppercase rounded border transition-all ${char.racaEscolhaAtributo === attr ? 'bg-purple-600 border-purple-400 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-purple-800'}`}>{attr}</button>
                      ))}
                   </div>
                </div>
              )}
            </div>
          </Card>
          
          <Card>
            <SectionTitle title="VANTAGENS" icon={Sparkles} action={
              <button onClick={() => setShowVantageSelector(true)} className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-all" title="Adicionar Vantagem"><Plus size={16} /></button>
            }/>
             <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(char.vantagensSelecionadas || {}).length === 0 ? (
                  <div className="text-center py-10 text-zinc-700 text-[12px] uppercase font-bold border-2 border-dashed border-zinc-900 rounded-xl">Nenhuma vantagem selecionada</div>
                ) : (
                  Object.entries(char.vantagensSelecionadas || {}).map(([vId, level]) => {
                    const def = VANTAGES_DATA.find(v => v.id === vId);
                    if (!def) return null;
                    return (
                      <div key={vId} className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 group hover:border-purple-600/30 transition-all">
                        <div className="flex justify-between items-start">
                           <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-purple-400 uppercase">{def.name}</span>
                                {def.cost === 'variable' && <span className="bg-purple-600/20 text-purple-400 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase border border-purple-600/20">Nív. {level}</span>}
                              </div>
                              <p className="text-[11px] text-zinc-500 mt-1 leading-tight">{def.description}</p>
                           </div>
                           <button onClick={() => toggleVantage(vId)} className="text-zinc-800 hover:text-red-500 transition-colors p-1"><X size={14}/></button>
                        </div>

                        {vId === 'blindado' && (
                          <div className="mt-3 bg-black/40 p-2 rounded-lg border border-purple-900/20">
                            <span className="text-[10px] text-purple-400 font-black uppercase mb-2 block">Escolher Foco (Escolha Única):</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleFieldChange('blindadoChoice', 'fisica')}
                                className={`flex-1 py-1 text-[10px] font-black uppercase rounded border transition-all ${char.blindadoChoice === 'fisica' ? 'bg-purple-600 border-purple-400 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-600'}`}
                              >
                                Física
                              </button>
                              <button 
                                onClick={() => handleFieldChange('blindadoChoice', 'espiritual')}
                                className={`flex-1 py-1 text-[10px] font-black uppercase rounded border transition-all ${char.blindadoChoice === 'espiritual' ? 'bg-purple-600 border-purple-400 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-600'}`}
                              >
                                Espiritual
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="mt-2 flex justify-between items-center border-t border-zinc-900 pt-2">
                           <span className="text-[10px] font-black text-zinc-600 uppercase">Custo: {def.cost === 'variable' ? level : def.cost} Pts</span>
                           {def.cost === 'variable' && (
                             <div className="flex gap-1">
                                <button onClick={() => { const vants = {...char.vantagensSelecionadas}; if (vants[vId] > 1) { vants[vId]--; updateChar({...char, vantagensSelecionadas: vants}); } }} className="bg-zinc-900 hover:bg-zinc-800 p-1 rounded"><Minus size={10} /></button>
                                <button onClick={() => { const vants = {...char.vantagensSelecionadas}; if (vants[vId] < (def.maxLevel || 5)) { vants[vId]++; updateChar({...char, vantagensSelecionadas: vants}); } }} className="bg-zinc-900 hover:bg-zinc-800 p-1 rounded"><Plus size={10} /></button>
                             </div>
                           )}
                        </div>
                      </div>
                    )
                  })
                )}
             </div>
          </Card>
        </div>

        {/* COLUNA 2 */}
        <div className="space-y-8">
          <Card className="space-y-6">
            <div>
              <SectionTitle title="STATUS DE ALMA" icon={Heart} />
              <div className="grid grid-cols-3 gap-3">
                {[ 
                  { label: 'HP', sub: 'VIDA', field: 'hp', max: maxHp, col: 'text-red-500', bg: 'bg-red-950/20' }, 
                  { label: 'AL', sub: 'ALMA', field: 'al', max: maxAl, col: 'text-blue-500', bg: 'bg-blue-950/20' }, 
                  { label: 'ST', sub: 'STAMINA', field: 'st', max: maxSt, col: 'text-yellow-500', bg: 'bg-yellow-950/20' } 
                ].map(s => (
                  <div key={s.label} className={`${s.bg} p-4 rounded-xl border border-purple-900/10 flex flex-col items-center justify-center text-center shadow-inner group/stat`}>
                     <span className={`text-[12px] font-black ${s.col} uppercase tracking-widest mb-1`}>{s.label}</span>
                     <input 
                       type="number"
                       className="w-full bg-transparent text-3xl font-black text-white text-center outline-none focus:text-purple-400 transition-colors cursor-pointer"
                       value={(char as any)[s.field]}
                       onChange={e => handleFieldChange(s.field as any, parseInt(e.target.value) || 0)}
                     />
                     <span className="text-[10px] text-zinc-500 font-bold uppercase mt-1">{s.sub} (MÁX: {s.max})</span>
                  </div>
                ))}
              </div>
              <div className="space-y-6 pt-4 px-1">
                <div className="relative group">
                  <div className="flex justify-between items-end mb-3">
                     <div className="flex flex-col">
                        <span className="text-[12px] text-purple-400 font-black uppercase tracking-[0.2em] flex items-center gap-2"><Flame size={12} /> Insanidade</span>
                        <span className="text-[10px] text-zinc-600 font-bold uppercase">Corrosão da Alma {alignmentBonuses.resist !== 0 && `(${alignmentBonuses.resist > 0 ? '+' : ''}${alignmentBonuses.resist} Alinh.)`}</span>
                     </div>
                     <span className="text-2xl font-black text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">{char.insanidade}</span>
                  </div>
                  <div className="relative h-3 w-full bg-zinc-900 rounded-full border border-zinc-800 p-[1px]">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-900 via-purple-600 to-red-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all duration-300 rounded-full" style={{ width: `${char.insanidade}%` }}>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full border-2 border-purple-600 shadow-[0_0_10px_rgba(255,255,255,1)] z-20 soul-glow" />
                    </div>
                    <input type="range" className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-30" value={char.insanidade} onChange={e => handleFieldChange('insanidade', parseInt(e.target.value))} />
                  </div>
                </div>
                <div className="relative group">
                  <div className="flex justify-between items-end mb-3">
                     <div className="flex flex-col">
                        <span className="text-[12px] text-blue-400 font-black uppercase tracking-[0.2em] flex items-center gap-2"><Target size={12} /> Coragem</span>
                        <span className="text-[10px] text-zinc-600 font-bold uppercase">Resiliência Mental {alignmentBonuses.coragem !== 0 && `(${alignmentBonuses.coragem > 0 ? '+' : ''}${alignmentBonuses.coragem} Alinh.)`}</span>
                     </div>
                     <span className="text-2xl font-black text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]">{char.coragem}</span>
                  </div>
                  <div className="relative h-3 w-full bg-zinc-900 rounded-full border border-zinc-800 p-[1px]">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-900 via-blue-500 to-cyan-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300 rounded-full" style={{ width: `${char.coragem}%` }}>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full border-2 border-blue-600 shadow-[0_0_10px_rgba(255,255,255,1)] z-20 soul-glow" />
                    </div>
                    <input type="range" className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-30" value={char.coragem} onChange={e => handleFieldChange('coragem', parseInt(e.target.value))} />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <SectionTitle title="PONTOS & VELO" icon={Box} />
              <div className="grid grid-cols-2 gap-4">
                {!char.isNPC && (
                  <>
                    <div className="bg-gradient-to-br from-zinc-900 to-black p-4 rounded-xl border border-yellow-900/20 flex flex-col items-center justify-center relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-40 transition-opacity"><Sparkles size={10} className="text-yellow-500" /></div>
                       <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-2">Glória</span>
                       <div className="flex items-center gap-4">
                          <button onClick={() => handleFieldChange('gloria', Math.max(0, char.gloria - 1))} className="text-zinc-700 hover:text-white transition-colors"><Minus size={14}/></button>
                          <div className="flex flex-col items-center">
                             <span className="text-3xl font-black text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">{char.gloria}</span>
                             <span className="text-[9px] text-zinc-800 font-black">TOTAL: {char.maxGloria}</span>
                          </div>
                          <button onClick={() => handleFieldChange('gloria', Math.min(char.maxGloria, char.gloria + 1))} className="text-zinc-700 hover:text-white transition-colors"><Plus size={14}/></button>
                       </div>
                    </div>
                    <div className="bg-gradient-to-br from-zinc-900 to-black p-4 rounded-xl border border-red-900/20 flex flex-col items-center justify-center relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-40 transition-opacity"><ShieldAlert size={10} className="text-red-500" /></div>
                       <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-2">Exaustão</span>
                       <div className="flex items-center gap-4">
                          <button onClick={() => handleFieldChange('exaustao', Math.max(0, char.exaustao - 1))} className="text-zinc-700 hover:text-white transition-colors"><Minus size={14}/></button>
                          <div className="flex flex-col items-center">
                             <span className="text-3xl font-black text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.3)]">{char.exaustao}</span>
                             <span className="text-[9px] text-zinc-800 font-black">TOTAL: {char.maxExaustao}</span>
                          </div>
                          <button onClick={() => handleFieldChange('exaustao', Math.min(char.maxExaustao, char.exaustao + 1))} className="text-zinc-700 hover:text-white transition-colors"><Plus size={14}/></button>
                       </div>
                    </div>
                  </>
                )}
                <div className="col-span-2 bg-purple-900/10 p-4 rounded-xl border border-purple-900/20 text-center">
                    <span className="text-[12px] text-purple-400 uppercase block font-black mb-1">Velocidade</span>
                    <span className="text-4xl font-black text-purple-600 leading-none">{speed}</span>
                    <div className="text-[11px] text-zinc-600 mt-2 font-medium tracking-widest uppercase">
                       (1 + {totalStats.destreza} Des + {((char.pericias["Atletismo"] || 0) + getSkillBonus("Atletismo"))} Atl {vantageBonuses.speed > 0 && `+ ${vantageBonuses.speed} Vant`})
                    </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle title="MAESTRIAS" icon={Sword} />
            <div className="grid grid-cols-3 gap-3">
            {[ { icon: Sword, label: 'COM', field: 'maestriaCombate', sync: isCompanion }, { icon: Activity, label: 'RES', field: 'maestriaRessonancia', sync: isCompanion }, { icon: Sparkles, label: 'MAG', field: 'maestriaMagia', sync: false } ].map(m => {
                const currentRank = (char as any)[m.field];
                const selectedSkills = char.masterySkills?.[m.field] || {};
                const IconComp = m.icon;
                return (
                  <div key={m.field} className={`flex flex-col items-center bg-zinc-900/40 p-3 rounded-xl border border-purple-900/10 hover:border-purple-600/30 transition-all text-center relative ${m.sync ? 'opacity-60 ring-1 ring-purple-600/20' : ''}`}>
                     <div className="flex items-center justify-between w-full mb-2">
                       <div className="flex items-center gap-1"><IconComp size={12} className="text-purple-600/80" /><span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">{m.label}</span></div>
                       {!m.sync && ["C", "B", "A", "S"].includes(currentRank) && (<button onClick={() => setActiveMasteryModal(m.field)} className="text-purple-500 hover:text-purple-400 transition-colors p-0.5"><Star size={12}/></button>)}
                     </div>
                     <select disabled={m.sync} className="bg-zinc-950 text-xs font-black text-purple-500 outline-none cursor-pointer w-full text-center px-1 py-1 rounded-lg border border-purple-900/20" value={currentRank} onChange={e => handleFieldChange(m.field as any, e.target.value)}>
                       {masteryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                     </select>
                     <div className="mt-2 w-full space-y-1">
                        {["C", "B", "A", "S"].map(r => {
                          const skillName = selectedSkills[r];
                          const rankIdx = ["C", "B", "A", "S"].indexOf(r);
                          const curIdx = ["C", "B", "A", "S"].indexOf(currentRank);
                          if (!skillName || rankIdx > curIdx) return null;
                          const skillData = MASTERY_SKILLS_DATA[m.field]?.[r]?.find(s => s.name === skillName);
                          return (
                            <div key={r} className="group/skill relative w-full" onMouseEnter={() => skillData && setHoveredSkill({ name: skillData.name, desc: skillData.description })} onMouseLeave={() => setHoveredSkill(null)}>
                              <div className="w-full text-[9px] font-black uppercase text-zinc-500 hover:text-purple-400 transition-colors truncate border-b border-zinc-900 last:border-0 pb-0.5 cursor-help">{r}: {skillName}</div>
                              {hoveredSkill?.name === skillName && (
                                <div className="absolute left-full top-0 ml-2 z-[150] w-48 p-3 bg-zinc-950 border border-purple-600/50 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 pointer-events-none">
                                  <span className="text-[11px] font-black text-purple-400 uppercase block mb-1">{skillName}</span>
                                  <p className="text-[10px] text-zinc-400 leading-tight italic">{skillData?.description}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                     </div>
                     {m.sync && <span className="text-[9px] text-purple-400 font-black uppercase mt-1">Sincronizado</span>}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionTitle title="INTEGRIDADE FÍSICA" icon={Shield} />
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-zinc-600 font-black uppercase mb-1">ARMADURA FÍSICA</span>
                    <div className="flex items-center gap-2">
                       <span className="text-3xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">{totalArmorFisicaValue}</span>
                       <div className="flex flex-col text-[10px] text-zinc-500 font-bold uppercase">
                          <span>Base: {char.armaduraFisica}</span>
                          {vantageBonuses.armorFisica > 0 && <span className="text-purple-500">Vant: +{vantageBonuses.armorFisica}</span>}
                       </div>
                    </div>
                 </div>
                 <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-zinc-600 font-black uppercase mb-1">ARMADURA ESPIRITUAL</span>
                    <div className="flex items-center gap-2">
                       <span className="text-3xl font-black text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.2)]">{totalArmorEspiritualValue}</span>
                       <div className="flex flex-col text-[10px] text-zinc-500 font-bold uppercase">
                          <span>Base: {char.armaduraEspiritual}</span>
                          {vantageBonuses.armorEspiritual > 0 && <span className="text-purple-500">Vant: +{vantageBonuses.armorEspiritual}</span>}
                       </div>
                    </div>
                 </div>
               </div>
               <div className="grid grid-cols-1 gap-3">
                  <ArmorSlotCard slot="cabeca" label="CABEÇA" item={char.armaduras.cabeca} expanded={!!expandedArmorSlots['cabeca']} onToggleExpand={() => toggleArmorSlot('cabeca')} updateItem={(u) => handleArmorItemUpdate('cabeca', u)} />
                  <ArmorSlotCard slot="superior" label="SUPERIOR" item={char.armaduras.superior} expanded={!!expandedArmorSlots['superior']} onToggleExpand={() => toggleArmorSlot('superior')} updateItem={(u) => handleArmorItemUpdate('superior', u)} />
                  <ArmorSlotCard slot="inferior" label="INFERIOR" item={char.armaduras.inferior} expanded={!!expandedArmorSlots['inferior']} onToggleExpand={() => toggleArmorSlot('inferior')} updateItem={(u) => handleArmorItemUpdate('inferior', u)} />
               </div>
            </div>
          </Card>
        </div>
      </div>
      
      <div className="mt-8">
        <Card>
           <SectionTitle title="PERÍCIAS" icon={Zap} />
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 mt-4">
              {Object.entries(SKILLS_GROUPS).map(([group, skills]) => (
                <div key={group} className="space-y-1">
                  <span className="text-[10px] text-purple-900 uppercase font-black tracking-[0.3em] block border-l-2 border-purple-900 pl-2 mb-2">{group}</span>
                  {skills.map(skill => {
                    const baseVal = char.pericias[skill] || 0;
                    const bonusVal = getSkillBonus(skill);
                    const totalVal = baseVal + bonusVal;
                    return (
                      <div key={skill} className="flex justify-between items-center group text-[12px] hover:bg-zinc-900/30 p-2 rounded-lg transition-colors border border-transparent hover:border-zinc-900">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2"><span className="text-purple-500 font-black w-6 text-lg">{totalVal}</span><span className="text-zinc-400 group-hover:text-zinc-100 transition-colors uppercase font-bold text-[11px] tracking-tighter">{skill}</span></div>
                          {bonusVal > 0 && <span className="inline-flex items-center gap-1 bg-purple-600/10 text-purple-400 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ml-8 border border-purple-600/10">+{bonusVal} RAÇA</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-zinc-600 font-bold uppercase">{baseVal}/{levelLimits.skillLimit}</span>
                          <div className="flex items-center bg-black/60 rounded p-1 gap-1 border border-zinc-800/50">
                             <button onClick={() => handleSkillChange(skill, -1)} className="hover:text-red-400 transition-colors p-0.5"><Minus size={12}/></button>
                             <button onClick={() => handleSkillChange(skill, 1)} className="hover:text-green-400 transition-colors p-0.5"><Plus size={12}/></button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
           </div>
           {raceInfo?.skillChoices && (
             <div className="bg-purple-950/20 p-4 rounded-xl border border-purple-900/20 mt-6 relative">
               <span className="text-[11px] text-purple-400 uppercase font-black block border-b border-purple-900/30 pb-2 mb-3">Especialização de Raça</span>
               <div className="flex gap-2">
                 {raceInfo.skillChoices.values.map((val, slotIdx) => {
                   const selectedSkill = char.racaEscolhaPericia?.[slotIdx];
                   const isActive = activeSkillSlot === slotIdx;
                   return (
                     <div key={slotIdx} className="flex-1">
                       <button onClick={() => setActiveSkillSlot(isActive ? null : slotIdx)} className={`w-full h-12 rounded-lg border flex flex-col items-center justify-center transition-all ${isActive ? 'bg-purple-600 border-purple-400' : 'bg-black/60 border-purple-900/30 hover:border-purple-600/50 shadow-inner'}`}>
                         <span className={`text-[10px] font-black uppercase tracking-tighter leading-none ${isActive ? 'text-purple-200' : 'text-zinc-500'}`}>Bônus +{val}</span>
                         <span className={`text-[12px] font-black uppercase truncate w-full px-2 text-center mt-1 ${isActive ? 'text-white' : (selectedSkill ? 'text-purple-400' : 'text-zinc-700 italic')}`}>{selectedSkill || "---"}</span>
                       </button>
                     </div>
                   );
                 })}
               </div>
               {activeSkillSlot !== null && (
                 <div ref={menuRef} className="absolute left-4 right-4 bottom-full mb-2 z-50 bg-zinc-950 border border-purple-600/50 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] p-4 animate-in fade-in zoom-in-95 duration-200">
                   <div className="flex justify-between items-center mb-3 border-b border-zinc-900 pb-2"><span className="text-[12px] font-black text-purple-400 uppercase tracking-widest">Selecionar Perícia (+{raceInfo.skillChoices.values[activeSkillSlot]})</span><button onClick={() => setActiveSkillSlot(null)} className="text-zinc-500 hover:text-white"><X size={14}/></button></div>
                   <div className="max-h-60 overflow-y-auto grid grid-cols-2 gap-2 custom-scrollbar pr-2">
                     {(raceInfo.skillChoices?.options || Object.values(SKILLS_GROUPS).flat()).map(skill => {
                       const isSelected = char.racaEscolhaPericia?.[activeSkillSlot] === skill;
                       return (
                         <button key={skill} onClick={() => { const newChoices = [...(char.racaEscolhaPericia || [])]; newChoices[activeSkillSlot] = skill; handleFieldChange('racaEscolhaPericia', newChoices); setActiveSkillSlot(null); }} className={`flex items-center gap-2 p-2.5 rounded-lg text-[11px] font-black uppercase transition-all ${isSelected ? 'bg-purple-600 text-white' : 'bg-zinc-900/50 text-zinc-500 hover:bg-zinc-800 hover:text-purple-400 border border-zinc-800/50'}`}>
                           {isSelected && <Check size={12}/>}{skill}
                         </button>
                       );
                     })}
                   </div>
                 </div>
               )}
             </div>
           )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <Card className="min-h-[250px]">
          <SectionTitle title="ANOTAÇÕES" />
          <textarea className="w-full bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-sm italic min-h-[200px] outline-none focus:border-purple-600/30 transition-all shadow-inner leading-relaxed text-zinc-400" placeholder="Liste suas técnicas, itens e notas extras..." value={char.vantagens} onChange={e => handleFieldChange('vantagens', e.target.value)} />
        </Card>
        <Card>
          <SectionTitle title="VANTAGEM DE RAÇA" />
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-[12px] font-bold text-purple-400/80 italic leading-relaxed min-h-[250px]">{char.vantagemRaca}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-16 pt-10 border-t border-purple-900/10">
        <div className="lg:col-span-12">
          {(isCompanion) && (
            <div className="mt-4">
               <div className="flex items-center gap-4 mb-8">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-purple-900/30"></div>
                  <h4 className="title-font text-xl text-purple-500 uppercase tracking-[0.4em]">Purificação de Almas</h4>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-purple-900/30"></div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-[#120a0a] border border-red-900/30 p-8 rounded-3xl relative overflow-hidden group hover:border-red-600/50 transition-all duration-500 shadow-2xl">
                     <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600/10 blur-[80px] rounded-full group-hover:bg-red-600/20 transition-all"></div>
                     <div className="flex items-center gap-8 relative z-10">
                        <div className="w-24 h-24 bg-zinc-950 rounded-2xl border-2 border-red-900/50 flex items-center justify-center soul-glow shadow-[0_0_30px_rgba(220,38,38,0.2)] group-hover:scale-110 transition-transform duration-500">
                           <div className="relative">
                              <div className="w-12 h-16 bg-red-800 rounded-[50%_50%_50%_50%/_60%_60%_40%_40%] relative border-2 border-red-500 shadow-inner">
                                 <div className="absolute top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-black rounded-full border border-red-900 flex items-center justify-center overflow-hidden">
                                    <div className="w-6 h-1 bg-red-500 rounded-full rotate-45"></div>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="flex-1">
                           <span className="text-[12px] text-red-500 font-black uppercase tracking-[0.3em] block mb-3">Ovos de Kishin (Limite 99)</span>
                           <div className="flex items-center gap-4">
                              <button onClick={() => handleFieldChange('ovosKishin', Math.max(0, (char.ovosKishin || 0) - 1))} className="p-2 bg-red-950/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl border border-red-900/50 transition-all"><Minus size={20}/></button>
                              <input type="number" className="text-6xl font-black bg-transparent text-white w-28 text-center outline-none drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" value={char.ovosKishin || 0} onChange={e => handleFieldChange('ovosKishin', Math.min(99, parseInt(e.target.value) || 0))} />
                              <button onClick={() => handleFieldChange('ovosKishin', Math.min(99, (char.ovosKishin || 0) + 1))} className="p-2 bg-red-950/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl border border-red-900/50 transition-all"><Plus size={20}/></button>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-[#0a0c12] border border-blue-900/30 p-8 rounded-3xl relative overflow-hidden group hover:border-blue-600/50 transition-all duration-500 shadow-2xl">
                     <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 blur-[80px] rounded-full group-hover:bg-blue-600/20 transition-all"></div>
                     <div className="flex items-center gap-8 relative z-10">
                        <div className="w-24 h-24 bg-zinc-950 rounded-2xl border-2 border-red-900/50 flex items-center justify-center soul-glow shadow-[0_0_30px_rgba(37,99,235,0.2)] group-hover:scale-110 transition-transform duration-500">
                           <div className="relative w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                              <div className="absolute inset-0 bg-blue-400 blur-lg opacity-40 animate-pulse"></div>
                              <div className="w-8 h-8 bg-blue-400 rounded-full shadow-[0_0_20px_#60a5fa] border border-white/20"></div>
                              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-6 bg-blue-400 rounded-full blur-[2px]"></div>
                           </div>
                        </div>
                        <div className="flex-1">
                           <span className="text-[12px] text-blue-500 font-black uppercase tracking-[0.3em] block mb-3">Alma de Bruxa (Limite 1)</span>
                           <div className="flex items-center gap-4">
                              <button onClick={() => handleFieldChange('almasBruxa', Math.max(0, (char.almasBruxa || 0) - 1))} className="p-2 bg-blue-950/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl border border-blue-900/50 transition-all"><Minus size={20}/></button>
                              <input type="number" className="text-6xl font-black bg-transparent text-white w-28 text-center outline-none drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]" value={char.almasBruxa || 0} onChange={e => handleFieldChange('almasBruxa', Math.min(1, parseInt(e.target.value) || 0))} />
                              <button onClick={() => handleFieldChange('almasBruxa', Math.min(1, (char.almasBruxa || 0) + 1))} className="p-2 bg-blue-950/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl border border-blue-900/50 transition-all"><Plus size={20}/></button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {showVantageSelector && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-[#0a0a0c] border border-purple-600/30 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(147,51,234,0.2)]">
              <div className="p-8 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/50">
                 <div>
                    <h3 className="title-font text-2xl text-purple-500 uppercase tracking-tighter">GRIMÓRIO DE HABILIDADES</h3>
                    <p className="text-[12px] text-zinc-600 font-black uppercase tracking-widest mt-1">Pontos Disponíveis: {levelLimits.vantPool - vantageBonuses.totalCost}</p>
                 </div>
                 <button onClick={() => setShowVantageSelector(false)} className="bg-zinc-900 hover:bg-zinc-800 p-3 rounded-full text-zinc-500 hover:text-white transition-all"><X size={20}/></button>
              </div>
              <div className="p-6 bg-zinc-900/20">
                <div className="relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
                   <input type="text" placeholder="Filtrar vantagens..." className="w-full bg-black border border-zinc-900 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-purple-600/50 transition-all" value={vantageFilter} onChange={e => setVantageFilter(e.target.value)} />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                 {[ { title: 'Custos Variáveis', filter: (v: VantageDef) => v.cost === 'variable' }, { title: 'Custo 1 Ponto', filter: (v: VantageDef) => v.cost === 1 }, { title: 'Custo 2 Pontos', filter: (v: VantageDef) => v.cost === 2 }, { title: 'Custo 3 Pontos', filter: (v: VantageDef) => v.cost === 3 }, { title: 'Custo 4 Pontos', filter: (v: VantageDef) => v.cost === 4 }, { title: 'Custo 5 Pontos', filter: (v: VantageDef) => v.cost === 5 }, { title: 'Custo 6 Pontos', filter: (v: VantageDef) => v.cost === 6 }, ].map(group => {
                   const items = VANTAGES_DATA.filter(group.filter).filter(v => v.name.toLowerCase().includes(vantageFilter.toLowerCase()) || v.description.toLowerCase().includes(vantageFilter.toLowerCase()));
                   if (items.length === 0) return null;
                   return (
                     <div key={group.title}>
                        <h4 className="text-[12px] font-black text-purple-900 uppercase tracking-[0.3em] mb-4 border-l-2 border-purple-900 pl-3">{group.title}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {items.map(v => {
                             const isSelected = !!char.vantagensSelecionadas?.[v.id];
                             const isDisabled = (v.restriction === 'artesao' && isCompanion) || (v.restriction === 'arma' && !isCompanion);
                             return (
                               <button key={v.id} disabled={isDisabled} onClick={() => toggleVantage(v.id)} className={`text-left p-5 rounded-2xl border transition-all flex flex-col justify-between group ${isSelected ? 'bg-purple-600 border-purple-400 shadow-lg shadow-purple-600/20' : 'bg-zinc-950 border-zinc-900 hover:border-purple-900/30'} ${isDisabled ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer'}`}>
                                  <div className="flex justify-between items-start mb-2">
                                     <span className={`text-base font-black uppercase tracking-wider ${isSelected ? 'text-white' : 'text-purple-400'}`}>{v.name}</span>
                                     <div className={`p-1.5 rounded-lg border ${isSelected ? 'bg-white/20 border-white/30 text-white' : 'bg-black border-zinc-900 text-purple-500'}`}>{isSelected ? <Check size={14}/> : <Plus size={14}/>}</div>
                                  </div>
                                  <p className={`text-[12px] leading-relaxed mb-4 ${isSelected ? 'text-purple-100' : 'text-zinc-500'}`}>{v.description}</p>
                                  <div className="flex items-center justify-between mt-auto">
                                     <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/10 text-white' : 'bg-zinc-900 text-zinc-600'}`}>Custo: {v.cost === 'variable' ? 'Variável' : `${v.cost} Pts`}</span>
                                     {v.restriction && <span className={`text-[10px] font-black uppercase ${isSelected ? 'text-purple-200' : 'text-purple-900'}`}>Apenas {v.restriction}</span>}
                                  </div>
                               </button>
                             )
                           })}
                        </div>
                     </div>
                   )
                 })}
              </div>
              <div className="p-8 border-t border-zinc-900 bg-zinc-950/50 flex justify-between items-center">
                 <div className="flex gap-6">
                    <div className="flex flex-col"><span className="text-[10px] text-zinc-600 font-black uppercase">Limite da Alma</span><span className="text-xl font-black text-white">{levelLimits.vantPool} Pts</span></div>
                    <div className="flex flex-col"><span className="text-[10px] text-zinc-600 font-black uppercase">Vantagens Ativas</span><span className={`text-xl font-black ${vantageBonuses.totalCost > levelLimits.vantPool ? 'text-red-500' : 'text-purple-500'}`}>{vantageBonuses.totalCost} Pts</span></div>
                 </div>
                 <button onClick={() => setShowVantageSelector(false)} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all">Sincronizar Grimório</button>
              </div>
           </div>
        </div>
      )}

      {activeMasteryModal && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-[#0a0a0c] border border-purple-600/40 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-[0_0_60px_rgba(147,51,234,0.3)]">
              <div className="p-8 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/80">
                 <div>
                    <h3 className="title-font text-2xl text-purple-500 uppercase tracking-tighter">HABILIDADES DE {activeMasteryModal.replace('maestria', '').toUpperCase()}</h3>
                    <p className="text-[12px] text-zinc-600 font-black uppercase tracking-widest mt-1">Sintonize habilidades passivas por Rank</p>
                 </div>
                 <button onClick={() => setActiveMasteryModal(null)} className="bg-zinc-900 hover:bg-zinc-800 p-3 rounded-full text-zinc-500 hover:text-white transition-all"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
                 {["C", "B", "A", "S"].map(rank => {
                    const currentRankValue = (char as any)[activeMasteryModal];
                    const rankIndex = ["C", "B", "A", "S"].indexOf(rank);
                    const masteryOptionsShort = ["--", "D", "C", "B", "A", "S"];
                    const currentRankIndex = masteryOptionsShort.indexOf(currentRankValue) - masteryOptionsShort.indexOf("C");
                    const isUnlocked = rankIndex <= currentRankIndex;
                    const options = MASTERY_SKILLS_DATA[activeMasteryModal]?.[rank] || [];
                    const selectedSkill = (char.masterySkills?.[activeMasteryModal] as any)?.[rank];

                    return (
                      <div key={rank} className={`${!isUnlocked ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
                         <div className="flex items-center gap-4 mb-4">
                            <span className="text-2xl font-black text-purple-600/50">{rank}</span>
                            <div className="h-[1px] flex-1 bg-zinc-900"></div>
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Custo: {MASTERY_XP_COSTS[rank]} XP</span>
                         </div>
                         {!isUnlocked && <div className="text-[11px] text-red-900 font-black uppercase mb-4 text-center">Rank {rank} Bloqueado</div>}
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {options.map(opt => {
                               const isSelected = selectedSkill === opt.name;
                               return (
                                 <button 
                                  key={opt.name} 
                                  onClick={() => toggleMasterySkill(activeMasteryModal, rank, opt.name)}
                                  className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${isSelected ? 'bg-purple-600 border-purple-400 shadow-lg shadow-purple-600/20' : 'bg-zinc-950 border-zinc-900 hover:border-purple-900/30'}`}
                                 >
                                    <span className={`text-[12px] font-black uppercase mb-1 ${isSelected ? 'text-white' : 'text-purple-400'}`}>{opt.name}</span>
                                    <p className={`text-[10px] leading-tight ${isSelected ? 'text-purple-100' : 'text-zinc-600'}`}>{opt.description}</p>
                                    {isSelected && <div className="mt-2 ml-auto"><Check size={14} className="text-white"/></div>}
                                 </button>
                               )
                            })}
                         </div>
                      </div>
                    )
                 })}
              </div>
              <div className="p-6 border-t border-zinc-900 bg-zinc-950/80 flex justify-end">
                 <button onClick={() => setActiveMasteryModal(null)} className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-3 rounded-xl font-black text-[12px] uppercase tracking-widest transition-all">Sincronizar Maestria</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
