import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Character, Race, Attributes, Combatant, CombatState, ActiveEffect, CustomEffect, EffectRank, Roll, SavedBattle } from '../types';
import { 
  Skull, 
  Flame, 
  Activity, 
  Shield, 
  Zap, 
  Trash2, 
  Plus, 
  ChevronRight, 
  User, 
  Ghost, 
  Sparkles, 
  Droplets, 
  ShieldAlert, 
  Eye, 
  Star,
  Timer,
  Swords,
  Heart,
  RotateCcw,
  Ban,
  Wind,
  Search,
  ChevronDown,
  X,
  Hourglass,
  Crosshair,
  ZapOff,
  Dice6,
  HeartPulse,
  Save,
  Download,
  PlusCircle,
  MessageCircle,
  Clock,
  Minus,
  MinusCircle,
  Target
} from 'lucide-react';
import { VANTAGES_DATA, RACE_DATA, INITIAL_ATTRIBUTES, SKILLS_GROUPS } from '../constants';

interface CombatMonitorProps {
  characters: Character[];
  combatState: CombatState;
  onCombatStateChange: React.Dispatch<React.SetStateAction<CombatState>>;
  savedBattles: SavedBattle[];
  onSaveBattle: (name: string, state: CombatState) => void;
  onLoadBattle: (state: CombatState) => void;
  onDeleteBattle: (id: number) => void;
  onRoll: (description: string, rolls: Roll[], modifier: number, total: number) => void;
  onGoToSheet: (charId: string) => void;
}

const STATUS_EFFECTS_DATA = [
  { id: 'poison', name: 'Veneno', icon: Skull, color: 'text-green-500', bg: 'bg-green-500/20', hasDuration: false, hasRank: true },
  { id: 'soul_poison', name: 'Veneno de Alma', icon: Ghost, color: 'text-cyan-400', bg: 'bg-cyan-500/20', hasDuration: false, hasRank: true },
  { id: 'bleeding', name: 'Sangramento', icon: Droplets, color: 'text-red-500', bg: 'bg-red-500/20', hasDuration: false, hasRank: true },
  { id: 'burned', name: 'Queimado', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/20', hasDuration: true, hasRank: true },
  { id: 'trapped', name: 'Aprisionado', icon: Ban, color: 'text-zinc-400', bg: 'bg-zinc-400/20', hasDuration: false, hasRank: false },
  { id: 'fear', name: 'Medo', icon: Eye, color: 'text-blue-400', bg: 'bg-blue-400/20', hasDuration: true, hasRank: false },
  { id: 'slow', name: 'Lentidão', icon: Wind, color: 'text-yellow-400', bg: 'bg-yellow-400/20', hasDuration: true, hasRank: false }
];

const StatBar = ({ value, max, color, icon: Icon, onUpdate, showInput = true }: { value: number, max: number, color: string, icon: React.ElementType, onUpdate: (e: React.ChangeEvent<HTMLInputElement>) => void, showInput?: boolean }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="relative w-full h-6 bg-black/50 rounded-md border border-zinc-800 shadow-inner overflow-hidden group">
      <div 
        className={`absolute top-0 left-0 h-full bg-gradient-to-r ${color} transition-all duration-300`} 
        style={{ width: `${Math.max(0, percentage)}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5">
          <Icon size={10} className="opacity-80" />
          {showInput ? (
            <input 
              type="number"
              value={value}
              onChange={onUpdate}
              className="w-12 bg-transparent text-xs font-black text-white outline-none"
            />
          ) : (
            <span className="text-xs font-black text-white">{value}</span>
          )}
        </div>
        <span className="text-[10px] font-black text-zinc-400/50 group-hover:text-white transition-colors">{max}</span>
      </div>
    </div>
  );
};

export const CombatMonitor: React.FC<CombatMonitorProps> = ({ 
  characters, 
  combatState, 
  onCombatStateChange,
  savedBattles,
  onSaveBattle,
  onLoadBattle,
  onDeleteBattle,
  onRoll,
  onGoToSheet
}) => {
  const { combatants, turn, activeCombatantIndex } = combatState;
  
  const [isInvokeOpen, setIsInvokeOpen] = useState(false);
  const [invokeSearch, setInvokeSearch] = useState("");
  const [damageInput, setDamageInput] = useState<Record<string, number>>({});
  const [damageOperations, setDamageOperations] = useState<Record<string, 'add' | 'subtract'>>({});
  const [incapHealAmount, setIncapHealAmount] = useState<Record<string, number>>({});

  const [addingEffectTo, setAddingEffectTo] = useState<string | null>(null);
  const [effectModalTab, setEffectModalTab] = useState<'status' | 'custom'>('status');

  const [statusEffectSelection, setStatusEffectSelection] = useState<{ id: string; rank: EffectRank; duration: number }>({ id: 'poison', rank: 'D', duration: 3 });
  const [customEffectSelection, setCustomEffectSelection] = useState<{ type: 'buff' | 'debuff'; value: number; target: string; duration: number }>({ type: 'buff', value: 1, target: 'forca', duration: 3 });

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showLoadModal, setShowLoadModal] = useState(false);

  const invokeRef = useRef<HTMLDivElement>(null);
  const effectModalRef = useRef<HTMLDivElement>(null);

  const getCombatantStatus = (combatant: Combatant, char: Character) => {
    if ((combatant.deathTimer !== undefined && combatant.deathTimer <= 0) || combatant.currentHp < -20) {
      return 'dead';
    }
    if (combatant.currentHp <= 0) {
      return 'incapacitated';
    }
    return 'active';
  };

  const calculateTotalArmor = (char: Character, type: 'fisica' | 'espiritual') => {
    let vantageBonus = 0;
    Object.entries(char.vantagensSelecionadas || {}).forEach(([vId, level]) => {
      if (vId === 'blindado' && char.blindadoChoice === (type === 'fisica' ? 'fisica' : 'espiritual')) {
        vantageBonus += 3;
      }
      const def = VANTAGES_DATA.find(v => v.id === vId);
      if (def?.bonuses?.armor) vantageBonus += def.bonuses.armor;
    });

    let base = type === 'fisica' ? char.armaduraFisica : char.armaduraEspiritual;
    let equipment = 0;
    if (char.armaduras.cabeca.equipado) equipment += type === 'fisica' ? char.armaduras.cabeca.fisica : char.armaduras.cabeca.espiritual;
    if (char.armaduras.superior.equipado) equipment += type === 'fisica' ? char.armaduras.superior.fisica : char.armaduras.superior.espiritual;
    if (char.armaduras.inferior.equipado) equipment += type === 'fisica' ? char.armaduras.inferior.fisica : char.armaduras.inferior.espiritual;

    return base + vantageBonus + equipment;
  };

  const calculateSpeed = (char: Character): number => {
    const raceInfo = RACE_DATA[char.raca];

    // 1. Vantage Bonuses for Speed
    let vantageSpeedBonus = 0;
    Object.entries(char.vantagensSelecionadas || {}).forEach(([vId, level]) => {
      const def = VANTAGES_DATA.find(v => v.id === vId);
      if (def?.bonuses?.speed) {
        vantageSpeedBonus += def.bonuses.speed * (level as number);
      }
    });

    // 2. Total Destreza
    let totalDestreza = char.atributosBase.destreza;
    if (raceInfo?.attributes.destreza) {
      totalDestreza += raceInfo.attributes.destreza;
    }
    if (char.racaEscolhaAtributo === 'destreza') {
      totalDestreza += 2;
    }
    
    // 3. Skill Bonus for Atletismo from Race
    let skillBonusAtletismo = raceInfo.skills['Atletismo'] || 0;
    if (char.racaEscolhaPericia && raceInfo.skillChoices) {
      char.racaEscolhaPericia.forEach((s, idx) => {
        if (s === 'Atletismo') {
          skillBonusAtletismo += raceInfo.skillChoices!.values[idx];
        }
      });
    }

    const totalAtletismo = (char.pericias['Atletismo'] || 0) + skillBonusAtletismo;

    // Final Speed Calculation
    return 1 + totalDestreza + totalAtletismo + vantageSpeedBonus;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (invokeRef.current && !invokeRef.current.contains(event.target as Node)) {
        setIsInvokeOpen(false);
      }
      if (effectModalRef.current && !effectModalRef.current.contains(event.target as Node)) {
        setAddingEffectTo(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedCombatants = useMemo(() => {
    return [...combatants].sort((a, b) => b.initiative - a.initiative);
  }, [combatants]);

  const rollAndReport = (count: number, type: number, modifier: number = 0, description: string): number => {
    if (count <= 0) {
        const total = modifier;
        onRoll(description, [], modifier, total);
        return total;
    }

    let grandTotal = 0;
    const rolls: Roll[] = [];
    for (let i = 0; i < count; i++) {
      const value = Math.floor(Math.random() * type) + 1;
      rolls.push({ type, value });
      grandTotal += value;
    }
    const total = grandTotal + modifier;
    onRoll(description, rolls, modifier, total);
    return total;
  };

  const rollDeathTimer = (combatantId: string) => {
    const combatant = combatants.find(c => c.id === combatantId);
    const char = characters.find(c => c.id === combatant?.charId);
    if (!combatant || !char) return;

    let totalCon = char.atributosBase.constituicao;
    const raceInfo = RACE_DATA[char.raca];
    if (raceInfo?.attributes.constituicao) totalCon += raceInfo.attributes.constituicao;
    if (char.racaEscolhaAtributo === 'constituicao') totalCon += 2;
    
    let totalRes = char.pericias['Resistência'] || 0;
    if (raceInfo?.skills['Resistência']) totalRes += raceInfo.skills['Resistência'];
     if (char.racaEscolhaPericia && raceInfo.skillChoices) {
      char.racaEscolhaPericia.forEach((s, idx) => { if (s === 'Resistência') totalRes += raceInfo.skillChoices!.values[idx]; });
    }

    const modifier = totalCon + totalRes;
    const turns = rollAndReport(1, 4, modifier, `Teste de Morte para ${char.nome}`);
    
    onCombatStateChange(prev => ({
        ...prev,
        combatants: prev.combatants.map(c => 
            c.id === combatantId ? { ...c, deathTimer: Math.max(1, turns) } : c
        )
    }));
  };

  const addCombatant = (charId: string) => {
    const char = characters.find(c => c.id === charId);
    if (!char) return;

    const newCombatant: Combatant = {
      id: Date.now().toString() + Math.random(),
      charId,
      initiative: 0,
      currentHp: char.hp,
      currentAl: char.al,
      currentSt: char.st,
      currentInsanidade: char.insanidade,
      currentCoragem: char.coragem,
      activeEffects: [],
      customEffects: []
    };
    
    onCombatStateChange({
      ...combatState,
      combatants: [...combatants, newCombatant]
    });
    
    setIsInvokeOpen(false);
    setInvokeSearch("");
  };

  const removeCombatant = (id: string) => {
    onCombatStateChange({
      ...combatState,
      combatants: combatants.filter(c => c.id !== id)
    });
  };
  
  const handleSimpleStatUpdate = (id: string, stat: 'currentInsanidade' | 'currentCoragem', value: number) => {
    onCombatStateChange(prev => ({
        ...prev,
        combatants: prev.combatants.map(c => {
            if (c.id === id) {
                const newValue = Math.max(0, Math.min(100, value));
                return { ...c, [stat]: newValue };
            }
            return c;
        })
    }));
  };

  const updateStat = (id: string, stat: keyof Combatant, value: any) => {
    const nextCombatants = combatants.map(c => c.id === id ? { ...c, [stat]: value } : c);
    onCombatStateChange({
      ...combatState,
      combatants: nextCombatants
    });
  };

  const rollInitiative = (id: string) => {
    const nextCombatants: Combatant[] = combatants.map(c => {
      if (c.id === id) {
        const char = characters.find(char => char.id === c.charId);
        if (!char) return c;
        const speed = calculateSpeed(char);
        const result = rollAndReport(2, 6, speed, `Iniciativa de ${char.nome}`);
        return { ...c, initiative: result, lastDamageType: 'initiative' as const, animating: true };
      }
      return c;
    });

    onCombatStateChange({ ...combatState, combatants: nextCombatants });

    setTimeout(() => {
      onCombatStateChange(prevState => ({ ...prevState, combatants: prevState.combatants.map(c => c.id === id ? { ...c, animating: false } : c) }));
    }, 600);
  };

  const applyCombatDamage = (id: string, type: 'physical' | 'spiritual' | 'alma' | 'stamina' | 'heal') => {
    const amount = damageInput[id] || 0;
    if (amount === 0) return;

    const combatantBefore = combatants.find(c => c.id === id);
    if (!combatantBefore) return;
    const wasActive = combatantBefore.currentHp > 0;

    const operation = type === 'heal' ? 'add' : (damageOperations[id] || 'subtract');

    const nextCombatants = combatants.map(c => {
      if (c.id === id) {
        const char = characters.find(char => char.id === c.charId);
        if (!char) return c;
        let nextState = { ...c, lastDamageType: type, animating: true };
        
        const updateHp = (val: number) => Math.min(char.hp, val);
        const updateAl = (val: number) => Math.max(0, Math.min(char.al, val));
        const updateSt = (val: number) => Math.max(0, Math.min(char.st, val));

        switch(type) {
            case 'physical':
            case 'spiritual':
                if (operation === 'subtract') {
                    const armorType = type === 'physical' ? 'fisica' : 'espiritual';
                    const armor = calculateTotalArmor(char, armorType);
                    const mit = Math.max(0, amount - armor);
                    nextState.currentHp = c.currentHp - mit;
                } else {
                    nextState.currentHp = updateHp(c.currentHp + amount);
                }
                break;
            case 'heal':
                const isReviving = c.currentHp <= 0;
                const healedHp = c.currentHp + amount;
                
                if (isReviving && healedHp >= char.hp * 0.5) {
                    nextState.currentHp = updateHp(healedHp);
                    nextState.deathTimer = undefined;
                } else {
                    nextState.currentHp = updateHp(healedHp);
                }
                break;
            case 'alma':
                nextState.currentAl = updateAl(c.currentAl + (operation === 'add' ? amount : -amount));
                break;
            case 'stamina':
                nextState.currentSt = updateSt(c.currentSt + (operation === 'add' ? amount : -amount));
                break;
        }
        return nextState;
      }
      return c;
    });

    onCombatStateChange({ ...combatState, combatants: nextCombatants });

    const combatantAfter = nextCombatants.find(c => c.id === id);
    if(combatantAfter && wasActive && combatantAfter.currentHp <= 0 && combatantAfter.currentHp >= -20) {
        rollDeathTimer(id);
    }

    setTimeout(() => {
      onCombatStateChange(prevState => ({ ...prevState, combatants: prevState.combatants.map(c => c.id === id ? { ...c, animating: false } : c) }));
    }, 600);
  };
  
  const applyIncapHeal = (id: string) => {
    const amount = incapHealAmount[id] || 0;
    if (amount <= 0) return;
    
    const combatant = combatants.find(c => c.id === id);
    const char = characters.find(c => c.id === combatant?.charId);
    if (!combatant || !char) return;

    onCombatStateChange(prev => ({
        ...prev,
        combatants: prev.combatants.map(c => {
            if (c.id === id) {
                let nextState = { ...c, lastDamageType: 'heal' as const, animating: true };
                const isReviving = c.currentHp <= 0;
                const healedHp = c.currentHp + amount;
                const newHp = Math.min(char.hp, healedHp);
                
                if (isReviving && healedHp >= char.hp * 0.5) {
                    nextState.currentHp = newHp;
                    nextState.deathTimer = undefined;
                } else {
                    nextState.currentHp = newHp;
                }
                return nextState;
            }
            return c;
        })
    }));
    
    setTimeout(() => {
        onCombatStateChange(prevState => ({ ...prevState, combatants: prevState.combatants.map(c => c.id === id ? { ...c, animating: false } : c) }));
    }, 600);

    setIncapHealAmount(prev => {
        const next = {...prev};
        delete next[id];
        return next;
    });
  };

  const applyStatusChange = (id: string, stat: 'currentInsanidade' | 'currentCoragem') => {
    const amount = damageInput[id] || 0;
    if (amount === 0) return;
    const operation = damageOperations[id] || 'subtract';
    
    onCombatStateChange(prev => ({
        ...prev,
        combatants: prev.combatants.map(c => {
            if (c.id === id) {
                const newValue = c[stat] + (operation === 'add' ? amount : -amount);
                const newAnimation: Combatant['lastDamageType'] = stat === 'currentInsanidade' ? 'alma' : 'spiritual'; 
                return { 
                    ...c, 
                    [stat]: Math.max(0, Math.min(100, newValue)),
                    animating: true,
                    lastDamageType: newAnimation
                };
            }
            return c;
        })
    }));

    setTimeout(() => {
        onCombatStateChange(prevState => ({ ...prevState, combatants: prevState.combatants.map(c => c.id === id ? { ...c, animating: false } : c) }));
    }, 600);
  };

  const addStatusEffect = (combatantId: string) => {
    const { id, rank, duration } = statusEffectSelection;
    const def = STATUS_EFFECTS_DATA.find(d => d.id === id);
    if (!def) return;
  
    const newEffect: ActiveEffect = {
      id,
      duration: def.hasDuration ? duration : -1, // Use -1 for non-duration effects
      rank: def.hasRank ? rank : undefined,
    };
  
    const RANKS: EffectRank[] = ['D', 'C', 'B', 'A', 'S'];
  
    onCombatStateChange(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => {
        if (c.id !== combatantId) return c;
  
        let newActiveEffects = [...c.activeEffects];
  
        if (id === 'poison' || id === 'soul_poison') {
          const existingEffectIndex = newActiveEffects.findIndex(e => e.id === id);
          if (existingEffectIndex > -1) {
            const existingEffect = newActiveEffects[existingEffectIndex];
            if (RANKS.indexOf(rank) > RANKS.indexOf(existingEffect.rank!)) {
              newActiveEffects[existingEffectIndex] = newEffect;
            }
          } else {
            newActiveEffects.push(newEffect);
          }
        }
        // Bleeding logic: stacks if ranks are different
        else if (id === 'bleeding') {
          const hasSameRank = newActiveEffects.some(e => e.id === 'bleeding' && e.rank === rank);
          if (!hasSameRank) {
            newActiveEffects.push(newEffect);
          }
        }
        // Default logic: no duplicates by id
        else {
          if (!newActiveEffects.some(e => e.id === id)) {
            newActiveEffects.push(newEffect);
          }
        }
  
        return { ...c, activeEffects: newActiveEffects };
      })
    }));
    setAddingEffectTo(null);
  };

  const removeStatusEffect = (combatantId: string, effectId: string, rank?: EffectRank) => {
    onCombatStateChange(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => {
        if (c.id !== combatantId) return c;
  
        // Find the index of the specific effect to remove. For bleeding, rank is crucial.
        // For others, it finds the first match by ID.
        const indexToRemove = c.activeEffects.findIndex(e => e.id === effectId && (effectId !== 'bleeding' || e.rank === rank));
  
        if (indexToRemove > -1) {
          const newEffects = [...c.activeEffects];
          newEffects.splice(indexToRemove, 1);
          return { ...c, activeEffects: newEffects };
        }
        return c;
      })
    }));
  };

  const addCustomEffect = (combatantId: string) => {
    if (!customEffectSelection.target || customEffectSelection.value === 0) return;
    
    const effectToAdd: CustomEffect = {
      ...customEffectSelection,
      id: Date.now().toString(),
    };
    
    onCombatStateChange({
      ...combatState,
      combatants: combatants.map(c => c.id === combatantId ? { ...c, customEffects: [...(c.customEffects || []), effectToAdd] } : c)
    });

    setAddingEffectTo(null);
  };

  const removeCustomEffect = (combatantId: string, effectId: string) => {
    onCombatStateChange({
      ...combatState,
      combatants: combatants.map(c => c.id === combatantId ? { ...c, customEffects: c.customEffects.filter(e => e.id !== effectId) } : c)
    });
  };
  
  const parseDiceString = (diceString: string): { count: number; type: number } => {
    if (!diceString || !diceString.includes('d')) return { count: 0, type: 0 };
    const [count, type] = diceString.split('d').map(Number);
    return { count, type };
  };

  const nextTurn = () => {
    if (sortedCombatants.length === 0) return;

    let updatedCombatants = [...combatants];
    const currentCombatant = sortedCombatants[activeCombatantIndex];

    if (currentCombatant) {
        updatedCombatants = updatedCombatants.map(c => {
            if (c.id === currentCombatant.id) {
                const nextActive = c.activeEffects.map(e => {
                    const def = STATUS_EFFECTS_DATA.find(d => d.id === e.id);
                    return (def && def.hasDuration) ? { ...e, duration: e.duration - 1 } : e;
                }).filter(e => {
                    const def = STATUS_EFFECTS_DATA.find(d => d.id === e.id);
                    return !def || !def.hasDuration || e.duration > 0;
                });
                const nextCustom = (c.customEffects || []).map(e => ({ ...e, duration: e.duration - 1 })).filter(e => e.duration > 0);
                return { ...c, activeEffects: nextActive, customEffects: nextCustom };
            }
            return c;
        });
    }

    const nextIndex = (activeCombatantIndex + 1) % sortedCombatants.length;
    let newTurn = turn;
    if (nextIndex === 0) {
        newTurn = turn + 1;
        updatedCombatants = updatedCombatants.map(c => {
            if (c.deathTimer && c.deathTimer > 0 && c.currentHp <= 0) {
                return { ...c, deathTimer: c.deathTimer - 1 };
            }
            return c;
        });
    }
    const nextCombatant = sortedCombatants[nextIndex];

    if (nextCombatant) {
        const char = characters.find(c => c.id === nextCombatant.charId);
        if (char) {
            let totalHpDamage = 0;
            let totalAlDamage = 0;
            const allDotRolls: Roll[] = [];
            
            nextCombatant.activeEffects.forEach(effect => {
                if (!effect.rank) return;
                let diceStr = '';
                let damageSource = '';
                let isHp = true;

                switch (effect.id) {
                    case 'poison': case 'bleeding':
                        diceStr = ({ D: '2d4', C: '3d4', B: '4d4', A: '5d4', S: '6d4' } as Record<EffectRank, string>)[effect.rank];
                        damageSource = effect.id === 'poison' ? 'Veneno' : 'Sangramento';
                        break;
                    case 'soul_poison':
                        diceStr = ({ D: '1d4', C: '2d4', B: '3d4', A: '4d4', S: '5d4' } as Record<EffectRank, string>)[effect.rank];
                        damageSource = 'Veneno de Alma';
                        isHp = false;
                        break;
                    case 'burned':
                        diceStr = ({ D: '1d4', C: '1d6', B: '1d8', A: '1d10', S: '1d12' } as Record<EffectRank, string>)[effect.rank];
                        damageSource = 'Queimadura';
                        break;
                }

                if (diceStr) {
                    const { count, type } = parseDiceString(diceStr);
                    let currentEffectDamage = 0;
                    for (let i = 0; i < count; i++) {
                        const value = Math.floor(Math.random() * type) + 1;
                        allDotRolls.push({ type, value, source: `Dano de ${damageSource} (${effect.rank})` });
                        currentEffectDamage += value;
                    }
                    if (isHp) totalHpDamage += currentEffectDamage; 
                    else totalAlDamage += currentEffectDamage;
                }
            });

            if (allDotRolls.length > 0) {
                const fullDescription = `Danos de Efeito em ${char.nome}`;
                onRoll(fullDescription, allDotRolls, 0, totalHpDamage + totalAlDamage);
                
                const damageType = totalHpDamage >= totalAlDamage ? 'dot-hp' : 'dot-al';
                updatedCombatants = updatedCombatants.map(c => {
                    if (c.id === nextCombatant.id) {
                        return { ...c, currentHp: c.currentHp - totalHpDamage, currentAl: c.currentAl - totalAlDamage, lastDamageType: damageType, animating: true };
                    }
                    return c;
                });

                setTimeout(() => {
                    onCombatStateChange(prevState => ({ ...prevState, combatants: prevState.combatants.map(c => c.id === nextCombatant.id ? { ...c, animating: false } : c) }));
                }, 600);
            }
        }
    }

    onCombatStateChange({ combatants: updatedCombatants, turn: newTurn, activeCombatantIndex: nextIndex });
  };

  const resetCombat = () => {
    onCombatStateChange(prevState => ({
      ...prevState,
      turn: 1,
      activeCombatantIndex: 0,
    }));
  };

  const handleOpenSaveModal = () => {
    setSaveName(`Batalha - Turno ${turn} - ${new Date().toLocaleDateString()}`);
    setShowSaveModal(true);
  };

  const handleSave = () => {
    if (saveName.trim()) {
      onSaveBattle(saveName.trim(), combatState);
      setShowSaveModal(false);
      setSaveName("");
    }
  };

  const filteredChars = characters.filter(c => 
    c.nome.toLowerCase().includes(invokeSearch.toLowerCase()) || 
    c.raca.toLowerCase().includes(invokeSearch.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col gap-4 h-[85vh]">
        <div className="bg-zinc-950 p-4 rounded-xl border border-purple-900/20 flex justify-between items-center shadow-xl">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
                <span className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">Batalha Ativa</span>
                <div className="flex items-center gap-3">
                  <h2 className="title-font text-3xl text-white uppercase tracking-tighter">Turno {turn}</h2>
                  <div className="h-6 w-px bg-zinc-800"></div>
                  <span className="text-purple-500 font-black text-xs uppercase tracking-widest">
                    {combatants.length} Almas
                  </span>
                </div>
            </div>
            <div className="flex gap-2">
              <button onClick={nextTurn} disabled={combatants.length === 0} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-black text-[12px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50">
                Próximo <ChevronRight size={18}/>
              </button>
              <button onClick={resetCombat} className="bg-zinc-900 text-zinc-500 hover:text-purple-500 px-4 py-2.5 rounded-lg font-black text-[12px] uppercase tracking-widest flex items-center gap-2 transition-all border border-zinc-800">
                <RotateCcw size={16}/>
                Resetar
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-black p-1 rounded-xl border border-zinc-900">
              <button 
                onClick={handleOpenSaveModal}
                className="p-2 text-zinc-500 hover:text-purple-400 hover:bg-purple-900/10 rounded-lg transition-all flex items-center gap-2"
                title="Salvar Batalha Atual"
              >
                <Save size={16} />
                <span className="text-[10px] font-black uppercase hidden xl:block">Arquivar</span>
              </button>
              <button 
                onClick={() => setShowLoadModal(true)}
                className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-900/10 rounded-lg transition-all flex items-center gap-2"
                title="Carregar Batalha Salva"
              >
                <Download size={16} />
                <span className="text-[10px] font-black uppercase hidden xl:block">Restaurar</span>
              </button>
            </div>

            <div className="relative" ref={invokeRef}>
              <button onClick={() => setIsInvokeOpen(!isInvokeOpen)} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-black text-[12px] uppercase tracking-widest transition-all border ${isInvokeOpen ? 'bg-purple-600 text-white border-purple-400' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-purple-600/50'}`}>
                <Plus size={16} /> Invocação <ChevronDown size={14} className={`transition-transform ${isInvokeOpen ? 'rotate-180' : ''}`} />
              </button>
              {isInvokeOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-zinc-950 border border-purple-600/30 rounded-xl shadow-2xl z-[200] overflow-hidden animate-in fade-in slide-in-from-top-1">
                    <div className="p-4 border-b border-zinc-900 bg-zinc-900/30">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                        <input type="text" placeholder="Buscar..." className="w-full bg-black border border-zinc-800 rounded px-3 py-2 pl-10 text-xs outline-none focus:border-purple-600" value={invokeSearch} onChange={e => setInvokeSearch(e.target.value)} autoFocus />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
                      {filteredChars.map(char => {
                        const isCompanion = characters.some(p => p.companionId === char.id || p.companionId2 === char.id);
                        const type = isCompanion ? 'Arma' : (char.isNPC ? 'NPC' : 'Player');
                        
                        let typeIcon, typeColor, typeText;
                        if (type === 'Player') {
                          typeIcon = <User size={10} />;
                          typeColor = 'bg-purple-600/20 text-purple-400';
                          typeText = 'Player';
                        } else if (type === 'NPC') {
                          typeIcon = <Ghost size={10} />;
                          typeColor = 'bg-zinc-700/20 text-zinc-500';
                          typeText = 'NPC';
                        } else { // Arma
                          typeIcon = <Swords size={10} />;
                          typeColor = 'bg-blue-600/20 text-blue-400';
                          typeText = 'Arma';
                        }

                        return (
                          <button key={char.id} onClick={() => addCombatant(char.id)} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-purple-600/10 text-zinc-500 hover:text-purple-400 transition-all group">
                            <div className="flex flex-col items-start">
                              <span className="text-[12px] font-black uppercase group-hover:text-white">{char.nome}</span>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${typeColor}`}>
                                  {typeIcon} {typeText}
                                </span>
                                <span className="text-[9px] font-bold text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded">NV. {char.nivel}</span>
                                <span className="text-[9px] font-bold text-zinc-700 uppercase">{char.raca}</span>
                              </div>
                            </div>
                            <Plus size={16} className="opacity-0 group-hover:opacity-100" />
                          </button>
                        );
                      })}
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {sortedCombatants.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-900 rounded-2xl text-zinc-800 space-y-4">
              <Swords size={64} className="opacity-20" />
              <p className="title-font text-2xl uppercase tracking-widest opacity-20">Arena Vazia</p>
            </div>
          ) : (
            sortedCombatants.map((combatant, idx) => {
              const char = characters.find(c => c.id === combatant.charId);
              if (!char) return null;
              const isActive = idx === activeCombatantIndex;
              const status = getCombatantStatus(combatant, char);
              
              let animationClass = '';
              if (combatant.animating) {
                  switch(combatant.lastDamageType) {
                      case 'physical': animationClass = 'animate-physical-hit'; break;
                      case 'spiritual': animationClass = 'animate-spiritual-hit'; break;
                      case 'alma': animationClass = 'animate-alma-hit'; break;
                      case 'stamina': animationClass = 'animate-stamina-hit'; break;
                      case 'heal': animationClass = 'animate-heal-pulse'; break;
                      case 'initiative': animationClass = 'animate-pulse'; break;
                      case 'dot-hp': animationClass = 'animate-dot-hp-hit'; break;
                      case 'dot-al': animationClass = 'animate-dot-al-hit'; break;
                  }
              }

              return (
                <div key={combatant.id} className={`relative bg-zinc-950/80 p-3 rounded-2xl border-2 transition-all duration-300 ${isActive ? 'border-purple-600/80 bg-gradient-to-r from-purple-950/20 to-zinc-950/80 shadow-2xl shadow-purple-900/20' : 'border-zinc-900'} ${animationClass}`}>
                  <style>{`
                    @keyframes physical-hit { 0% { transform: translateX(0); } 25% { transform: translateX(-4px); } 50% { transform: translateX(4px); } 100% { transform: translateX(0); } }
                    @keyframes spiritual-hit { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }
                    @keyframes alma-hit { 0% { filter: saturate(1); } 50% { filter: saturate(2) brightness(1.2); } 100% { filter: saturate(1); } }
                    @keyframes stamina-hit { 0% { opacity: 1; } 50% { opacity: 0.8; } 100% { opacity: 1; } }
                    @keyframes heal-pulse { 0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); } 100% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); } }
                    @keyframes dot-hp-hit { 0%, 100% { background-color: initial; } 50% { background-color: #450a0a; } }
                    @keyframes dot-al-hit { 0%, 100% { background-color: initial; } 50% { background-color: #164e63; } }
                    .animate-dot-hp-hit { animation: dot-hp-hit 0.4s ease-in-out; }
                    .animate-dot-al-hit { animation: dot-al-hit 0.4s ease-in-out; }
                    .animate-physical-hit { animation: physical-hit 0.3s ease-out; }
                    .animate-spiritual-hit { animation: spiritual-hit 0.3s ease-out; }
                    .animate-alma-hit { animation: alma-hit 0.4s ease-in-out; }
                    .animate-stamina-hit { animation: stamina-hit 0.3s ease-out; }
                    .animate-heal-pulse { animation: heal-pulse 0.6s ease-in-out; }
                    .thumb-hidden::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 0; height: 0; }
                    .thumb-hidden::-moz-range-thumb { width: 0; height: 0; border: 0; }
                  `}</style>
                  {isActive && <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg z-10 animate-pulse"><Timer size={12} className="text-white" /></div>}
                  
                  {status !== 'active' && (
                    <div className="absolute inset-0 bg-black/80 rounded-2xl z-20 flex items-center justify-around p-3">
                      {status === 'incapacitated' ? (
                        <>
                          <div className="flex items-center gap-4">
                            <Hourglass size={32} className="text-yellow-500/50 animate-pulse flex-shrink-0" />
                            <div className="text-left">
                              <h3 className="text-base font-black uppercase text-yellow-500 tracking-widest">INCAPACITADO</h3>
                              <div className="flex items-center gap-3 mt-1">
                                {combatant.deathTimer !== undefined && combatant.deathTimer > 0 && (
                                <div className="text-center">
                                  <p className="text-lg font-black text-white">{combatant.deathTimer}</p>
                                  <p className="text-[9px] font-bold text-zinc-500 uppercase">MORTE</p>
                                </div>
                                )}
                                <div className="text-center">
                                  <p className="text-lg font-black text-red-500">{combatant.currentHp}</p>
                                  <p className="text-[9px] font-bold text-zinc-500 uppercase">HP</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="w-px h-16 bg-zinc-800"></div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xs text-zinc-400 font-bold leading-tight">Cura ≥ <span className="text-green-400 text-sm font-black">{Math.ceil((char.hp * 0.5) - combatant.currentHp)}</span></p>
                              <p className="text-[9px] text-zinc-500 font-bold uppercase">para reanimar</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number"
                                placeholder="HP"
                                value={incapHealAmount[combatant.id] || ''}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setIncapHealAmount(prev => ({ ...prev, [combatant.id]: isNaN(val) ? 0 : val }));
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg py-2 text-center text-lg font-black text-green-400 outline-none focus:border-green-600"
                              />
                              <button 
                                onClick={(e) => { e.stopPropagation(); applyIncapHeal(combatant.id); }}
                                className="p-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors self-stretch flex items-center"
                                title="Aplicar Cura"
                              >
                                <HeartPulse size={20}/>
                              </button>
                            </div>
                          </div>
                        </>
                      ) : ( // 'dead'
                        <>
                          <Skull size={48} className="text-red-500/50" />
                          <h3 className="text-xl font-black uppercase text-red-500 tracking-widest">MORTO</h3>
                          <button onClick={() => removeCombatant(combatant.id)} className="p-3 bg-zinc-900 hover:bg-red-950/50 text-zinc-700 hover:text-red-500 rounded border border-zinc-800 transition-colors"><Trash2 size={16}/></button>
                        </>
                      )}
                    </div>
                  )}

                  <div className={`flex gap-4 items-center ${status !== 'active' ? 'blur-sm' : ''}`}>
                    <div className="flex items-center gap-3 w-48 flex-shrink-0">
                      <button onClick={() => onGoToSheet(char.id)} className={`relative group w-16 h-16 rounded-lg border-2 shrink-0 overflow-hidden transition-all duration-300 ${isActive ? 'border-purple-500/50' : 'border-zinc-800'} hover:border-purple-500 hover:scale-105`}>
                        {char.imageUrl ? 
                          <img src={char.imageUrl} alt={char.nome} className="w-full h-full object-cover"/> : 
                          <div className={`w-full h-full flex items-center justify-center ${char.isNPC ? 'bg-zinc-900' : 'bg-purple-950/50'}`}><User size={20} className={char.isNPC ? 'text-zinc-600' : 'text-purple-400'} /></div>}
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <Eye size={24} className="text-white"/>
                        </div>
                      </button>
                      <div className="flex flex-col">
                         <h4 className="title-font text-base text-white leading-tight">{char.nome}</h4>
                         <div className="flex items-center gap-2 mt-1">
                             <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${char.isNPC ? 'bg-zinc-800 text-zinc-400' : 'bg-purple-900/50 text-purple-400'}`}>{char.isNPC ? 'NPC' : 'Player'}</div>
                         </div>
                      </div>
                    </div>

                    <div className="w-56 space-y-1">
                       <StatBar value={combatant.currentHp} max={char.hp} color="from-red-600 to-red-500" icon={Heart} onUpdate={e => updateStat(combatant.id, 'currentHp', parseInt(e.target.value))} />
                       <div className="relative">
                        <StatBar value={combatant.currentAl} max={char.al} color="from-blue-600 to-blue-500" icon={Sparkles} onUpdate={e => updateStat(combatant.id, 'currentAl', parseInt(e.target.value))} />
                        {combatant.currentAl <= 0 && <ZapOff size={14} className="absolute right-[-8px] top-1/2 -translate-y-1/2 text-red-500 animate-pulse" title="Ações de Alma/Magia bloqueadas (-2 Debuff)" />}
                       </div>
                       <div className="relative">
                        <StatBar value={combatant.currentSt} max={char.st} color="from-yellow-600 to-yellow-500" icon={Zap} onUpdate={e => updateStat(combatant.id, 'currentSt', parseInt(e.target.value))} />
                        {combatant.currentSt <= 0 && <ZapOff size={14} className="absolute right-[-8px] top-1/2 -translate-y-1/2 text-red-500 animate-pulse" title="Ações de Combate bloqueadas (-2 Debuff)" />}
                       </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 w-60">
                        <div className="w-full">
                            <div className="flex justify-between items-center w-full px-1 mb-1">
                                <div className="flex items-center gap-1.5">
                                    <Flame size={12} className="text-purple-400"/>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Insanidade</span>
                                </div>
                                <span className="text-sm font-black text-white">{combatant.currentInsanidade}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={combatant.currentInsanidade}
                                onChange={e => handleSimpleStatUpdate(combatant.id, 'currentInsanidade', parseInt(e.target.value))}
                                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer thumb-hidden"
                                style={{
                                    background: `linear-gradient(to right, #581c87, #7f1d1d ${combatant.currentInsanidade}%, #3f3f46 ${combatant.currentInsanidade}%)`
                                }}
                            />
                        </div>
                        <div className="w-full">
                            <div className="flex justify-between items-center w-full px-1 mb-1">
                                <div className="flex items-center gap-1.5">
                                    <Target size={12} className="text-blue-400"/>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Coragem</span>
                                </div>
                                <span className="text-sm font-black text-white">{combatant.currentCoragem}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={combatant.currentCoragem}
                                onChange={e => handleSimpleStatUpdate(combatant.id, 'currentCoragem', parseInt(e.target.value))}
                                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer thumb-hidden"
                                style={{
                                    background: `linear-gradient(to right, #1e3a8a, #164e63 ${combatant.currentCoragem}%, #3f3f46 ${combatant.currentCoragem}%)`
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-grow justify-end">
                         <div className="flex flex-col items-center">
                           <div className="relative">
                            <input type="number" className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg py-2 text-center text-xl font-black text-purple-400 outline-none" value={combatant.initiative} onChange={e => updateStat(combatant.id, 'initiative', parseInt(e.target.value) || 0)} />
                            <button onClick={() => rollInitiative(combatant.id)} className="absolute -right-2 -top-2 bg-purple-600 text-white p-1.5 rounded-full shadow-lg hover:scale-110 active:scale-95"><Dice6 size={12}/></button>
                           </div>
                         </div>
                         <div className="flex items-center">
                           <button 
                            onClick={() => setDamageOperations(prev => ({...prev, [combatant.id]: (prev[combatant.id] || 'subtract') === 'subtract' ? 'add' : 'subtract'}))}
                            className={`w-8 h-8 flex items-center justify-center rounded-l-lg border-y border-l transition-colors ${(damageOperations[combatant.id] || 'subtract') === 'subtract' ? 'bg-red-900/30 border-red-800 text-red-400' : 'bg-green-900/30 border-green-800 text-green-400'}`}
                          >
                            {(damageOperations[combatant.id] || 'subtract') === 'subtract' ? <Minus size={14}/> : <Plus size={14}/>}
                           </button>
                           <input type="number" placeholder="Dano" className="w-16 bg-zinc-900 border-t border-b border-zinc-800 px-2 py-1 text-sm font-black text-white outline-none focus:border-purple-600 h-8" value={damageInput[combatant.id] || ""} onChange={e => setDamageInput({...damageInput, [combatant.id]: parseInt(e.target.value) || 0})} />
                           <div className="grid grid-cols-2 gap-px bg-zinc-900 border-t border-b border-r border-zinc-800 rounded-r-lg overflow-hidden">
                                <button onClick={() => applyCombatDamage(combatant.id, 'physical')} className="bg-zinc-800 hover:bg-zinc-700 h-6 w-8 flex items-center justify-center text-zinc-400 transition-all" title="Dano Físico"><Shield size={12}/></button>
                                <button onClick={() => applyCombatDamage(combatant.id, 'spiritual')} className="bg-purple-900/20 hover:bg-purple-900/40 h-6 w-8 flex items-center justify-center text-purple-400 transition-all" title="Dano Espiritual"><Zap size={12}/></button>
                                <button onClick={() => applyCombatDamage(combatant.id, 'alma')} className="bg-blue-900/20 hover:bg-blue-900/40 h-6 w-8 flex items-center justify-center text-blue-400 transition-all" title="Dano na Alma"><Sparkles size={12}/></button>
                                <button onClick={() => applyCombatDamage(combatant.id, 'stamina')} className="bg-yellow-900/20 hover:bg-yellow-900/40 h-6 w-8 flex items-center justify-center text-yellow-400 transition-all" title="Dano na Stamina"><Activity size={12}/></button>
                                <button onClick={() => applyStatusChange(combatant.id, 'currentInsanidade')} className="bg-red-900/20 hover:bg-red-900/40 h-6 w-8 flex items-center justify-center text-red-400 transition-all" title="Alterar Insanidade"><Flame size={12}/></button>
                                <button onClick={() => applyStatusChange(combatant.id, 'currentCoragem')} className="bg-green-900/20 hover:bg-green-900/40 h-6 w-8 flex items-center justify-center text-green-400 transition-all" title="Alterar Coragem"><Target size={12}/></button>
                           </div>
                         </div>
                         <div className="flex flex-col gap-1">
                            <button onClick={() => setAddingEffectTo(combatant.id)} className="bg-zinc-900 hover:bg-purple-900/30 text-zinc-500 hover:text-purple-400 p-1.5 rounded-lg border border-zinc-800" title="Adicionar Efeito"><PlusCircle size={14}/></button>
                            <button onClick={() => removeCombatant(combatant.id)} className="bg-zinc-900 hover:bg-red-950/50 text-zinc-700 hover:text-red-500 p-1.5 rounded-lg border border-zinc-800 transition-colors" title="Remover"><Trash2 size={14}/></button>
                         </div>
                    </div>
                  </div>
                  {(combatant.activeEffects.length > 0 || (combatant.customEffects || []).length > 0) && (
                     <div className={`mt-2 pt-2 border-t border-zinc-900 flex flex-wrap gap-1.5 content-start ${status !== 'active' ? 'blur-sm' : ''}`}>
                        {combatant.activeEffects.map((effect, idx) => {
                           const def = STATUS_EFFECTS_DATA.find(d => d.id === effect.id);
                           if (!def) return null;
                           return (
                            <div key={`${effect.id}-${effect.rank}-${idx}`} className={`${def.bg} group relative px-2 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-black uppercase border border-current/30`} title={def.name}>
                              <def.icon size={12} className={def.color} />
                              {effect.rank && <span className={`${def.color} font-bold`}>{effect.rank}</span>}
                              {def.hasDuration && <span className="text-white/70">{effect.duration}t</span>}
                              <button onClick={() => removeStatusEffect(combatant.id, effect.id, effect.rank)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={10} /></button>
                            </div>
                           )
                        })}
                        {(combatant.customEffects || []).map(effect => (
                           <div key={effect.id} className={`${effect.type === 'buff' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} group relative px-2 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-black uppercase border border-current/30`} title={`${effect.type === 'buff' ? 'Buff' : 'Debuff'} em ${effect.target}`}>
                              {effect.type === 'buff' ? <PlusCircle size={12}/> : <MinusCircle size={12}/>}
                              <span>{effect.value} {effect.target.substring(0,3)}</span>
                              <span className="text-white/70">{effect.duration}t</span>
                              <button onClick={() => removeCustomEffect(combatant.id, effect.id)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={10} /></button>
                           </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="bg-zinc-950 p-2.5 rounded-lg border border-purple-900/10 text-center">
          <p className="text-[10px] text-zinc-700 font-bold uppercase italic tracking-widest">
            As almas que se apagam alimentam o abismo do Kishin.
          </p>
        </div>
      </div>
      
      {addingEffectTo && (() => {
        const combatant = combatants.find(c => c.id === addingEffectTo);
        const char = combatant ? characters.find(c => c.id === combatant.charId) : null;
        if (!combatant || !char) return null;
        
        return (
          <div className="fixed inset-0 z-[101] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div ref={effectModalRef} className="bg-[#0a0a0c] border border-purple-600/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-zinc-900 flex justify-between items-center">
                <div>
                  <h3 className="title-font text-xl text-purple-500 uppercase tracking-tighter">Aplicar Efeito em {char.nome}</h3>
                  <p className="text-xs text-zinc-500 mt-1">Selecione um efeito de estado ou crie um buff/debuff customizado.</p>
                </div>
                <button onClick={() => setAddingEffectTo(null)} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white"><X size={18}/></button>
              </div>
              <div className="p-3 bg-zinc-950/50">
                <div className="p-1 bg-black/40 rounded-lg flex gap-1 w-max mx-auto">
                  <button onClick={() => setEffectModalTab('status')} className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${effectModalTab === 'status' ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-purple-400'}`}>Efeitos de Estado</button>
                  <button onClick={() => setEffectModalTab('custom')} className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${effectModalTab === 'custom' ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-purple-400'}`}>Buffs / Debuffs</button>
                </div>
              </div>
              {effectModalTab === 'status' ? (
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {STATUS_EFFECTS_DATA.map(def => (
                      <button key={def.id} onClick={() => setStatusEffectSelection(s => ({...s, id: def.id}))} className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${statusEffectSelection.id === def.id ? `${def.bg} border-purple-500` : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>
                        <def.icon size={20} className={def.color}/>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase">{def.name}</span>
                      </button>
                    ))}
                  </div>
                  {(STATUS_EFFECTS_DATA.find(d => d.id === statusEffectSelection.id)?.hasRank || STATUS_EFFECTS_DATA.find(d => d.id === statusEffectSelection.id)?.hasDuration) && (
                    <div className="flex gap-4 p-4 bg-black/40 rounded-xl border border-zinc-900">
                      {STATUS_EFFECTS_DATA.find(d => d.id === statusEffectSelection.id)?.hasRank && (
                        <div className="flex-1">
                          <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Rank</label>
                          <select value={statusEffectSelection.rank} onChange={e => setStatusEffectSelection(s => ({...s, rank: e.target.value as EffectRank}))} className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none">
                            {['D', 'C', 'B', 'A', 'S'].map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                      )}
                      {STATUS_EFFECTS_DATA.find(d => d.id === statusEffectSelection.id)?.hasDuration && (
                        <div className="flex-1">
                          <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Duração (Turnos)</label>
                          <input type="number" value={statusEffectSelection.duration} onChange={e => setStatusEffectSelection(s => ({...s, duration: parseInt(e.target.value) || 1}))} className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                        </div>
                      )}
                    </div>
                  )}
                  <button onClick={() => addStatusEffect(addingEffectTo)} className="w-full py-3 bg-purple-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest">Aplicar Efeito de Estado</button>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setCustomEffectSelection(c => ({...c, type: 'buff'}))} className={`py-3 rounded-lg text-xs font-bold uppercase ${customEffectSelection.type === 'buff' ? 'bg-green-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}>Buff</button>
                    <button onClick={() => setCustomEffectSelection(c => ({...c, type: 'debuff'}))} className={`py-3 rounded-lg text-xs font-bold uppercase ${customEffectSelection.type === 'debuff' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}>Debuff</button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Alvo do Modificador</label>
                       <select value={customEffectSelection.target} onChange={e => setCustomEffectSelection(c => ({...c, target: e.target.value}))} className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none capitalize">
                        <optgroup label="Atributos">
                          {Object.keys(INITIAL_ATTRIBUTES).map(attr => <option key={attr} value={attr} className="capitalize">{attr}</option>)}
                        </optgroup>
                        {Object.entries(SKILLS_GROUPS).map(([group, skills]) => (
                          <optgroup key={group} label={group}>
                            {skills.map(skill => <option key={skill} value={skill}>{skill}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Valor</label>
                      <input type="number" value={customEffectSelection.value} onChange={e => setCustomEffectSelection(c => ({...c, value: parseInt(e.target.value) || 1}))} className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                    </div>
                  </div>
                   <div>
                      <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Duração (Turnos)</label>
                      <input type="number" value={customEffectSelection.duration} onChange={e => setCustomEffectSelection(c => ({...c, duration: parseInt(e.target.value) || 1}))} className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none" />
                    </div>
                  <button onClick={() => addCustomEffect(addingEffectTo)} className="w-full py-3 bg-purple-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest">Aplicar Modificador</button>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {showSaveModal && (
        <div className="fixed inset-0 z-[101] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#0a0a0c] border border-purple-600/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-zinc-900">
              <h3 className="title-font text-2xl text-purple-500 uppercase tracking-tighter">Arquivar Batalha</h3>
              <p className="text-sm text-zinc-500 mt-1">Dê um nome a este estado de combate para restaurá-lo mais tarde.</p>
            </div>
            <div className="p-8 space-y-4">
              <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Nome do Arquivo</label>
              <input 
                type="text" 
                value={saveName} 
                onChange={e => setSaveName(e.target.value)}
                className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-3 text-white outline-none focus:border-purple-600"
                placeholder="Ex: Encontro na Floresta das Almas"
              />
            </div>
            <div className="p-6 bg-zinc-950/50 flex justify-end gap-3">
              <button onClick={() => setShowSaveModal(false)} className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-lg text-[10px] font-bold uppercase tracking-widest">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-3 bg-purple-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {showLoadModal && (
        <div className="fixed inset-0 z-[101] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#0a0a0c] border border-blue-600/30 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-zinc-900 flex justify-between items-center">
              <div>
                <h3 className="title-font text-2xl text-blue-500 uppercase tracking-tighter">Restaurar Batalha</h3>
                <p className="text-sm text-zinc-500 mt-1">Selecione um arquivo de combate para carregar na arena.</p>
              </div>
              <button onClick={() => setShowLoadModal(false)} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white"><X size={18}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {savedBattles.length === 0 ? (
                <p className="text-center text-zinc-600 italic py-10">Nenhuma batalha arquivada.</p>
              ) : (
                [...savedBattles].reverse().map(battle => (
                  <div key={battle.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex justify-between items-center group">
                    <div>
                      <p className="font-bold text-white">{battle.name}</p>
                      <p className="text-xs text-zinc-500">{new Date(battle.id).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onDeleteBattle(battle.id)} className="p-2 bg-zinc-800 text-zinc-500 hover:bg-red-950/50 hover:text-red-500 rounded-lg transition-colors"><Trash2 size={14}/></button>
                      <button onClick={() => { onLoadBattle(battle.state); setShowLoadModal(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest">Carregar</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};