import React, { useState } from 'react';
import { Dice6, RotateCcw, Plus } from 'lucide-react';
import { Roll } from '../types';

interface DiceRollerProps {
  onRoll: (description: string, rolls: Roll[], modifier: number, total: number) => void;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({ onRoll }) => {
  const [modifier, setModifier] = useState<string>("");
  const [diceCounts, setDiceCounts] = useState<Record<number, number>>({
    3: 0,
    4: 0,
    6: 0,
    8: 0,
    10: 0,
    12: 0,
    20: 0,
    100: 0
  });

  const diceOptions = [3, 4, 6, 8, 10, 12, 20, 100];

  const handleDieClick = (type: number) => {
    setDiceCounts(prev => ({
      ...prev,
      [type]: prev[type] + 1
    }));
  };

  const handleReset = () => {
    setDiceCounts({ 3: 0, 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0, 100: 0 });
    setModifier("");
  };

  const rollDice = () => {
    let grandTotal = 0;
    const allRolls: Roll[] = [];
    
    let hasDice = false;

    diceOptions.forEach(type => {
      const count = diceCounts[type];
      if (count > 0) {
        hasDice = true;
        for (let i = 0; i < count; i++) {
          const value = Math.floor(Math.random() * type) + 1;
          allRolls.push({ type, value });
          grandTotal += value;
        }
      }
    });

    if (!hasDice) return;

    const modValue = parseInt(modifier) || 0;
    const finalResult = grandTotal + modValue;
    
    onRoll("Rolagem Manual", allRolls, modValue, finalResult);
  };

  return (
    <div className="bg-gradient-to-br from-zinc-950 to-[#100a14] p-6 rounded-2xl border border-purple-900/20 soul-glow shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="title-font text-lg text-purple-500 uppercase tracking-widest">Invocador</h3>
        <button 
          onClick={handleReset}
          className="text-zinc-600 hover:text-red-500 transition-colors flex items-center gap-1.5"
          title="Resetar dados"
        >
          <RotateCcw size={14} />
          <span className="text-[9px] font-black uppercase">Limpar</span>
        </button>
      </div>
      
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Selecione as Runas</label>
          <div className="grid grid-cols-4 gap-2">
            {diceOptions.map(d => (
              <button
                key={d}
                onClick={() => handleDieClick(d)}
                className={`relative group aspect-square rounded-lg border flex flex-col items-center justify-center transition-all duration-200 ${diceCounts[d] > 0 ? 'bg-purple-950/50 border-purple-500 shadow-inner' : 'bg-black/40 border-zinc-900 hover:border-purple-900/50'}`}
              >
                <span className={`text-2xl font-black title-font ${diceCounts[d] > 0 ? 'text-purple-400' : 'text-zinc-600'}`}>d{d}</span>
                {diceCounts[d] > 0 && (
                  <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] font-black min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-200 z-10 border-2 border-zinc-950">
                    {diceCounts[d]}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] text-zinc-500 mb-2 uppercase font-black tracking-widest">Bônus de Alma</label>
          <input 
            type="number" 
            placeholder="±0"
            value={modifier} 
            onChange={(e) => setModifier(e.target.value)}
            className="bg-black/50 border border-purple-900/20 p-4 rounded-xl w-full text-center text-2xl font-black text-purple-400 outline-none focus:border-purple-600 transition-all placeholder:text-zinc-800"
          />
        </div>

        <button 
          onClick={rollDice}
          disabled={!Object.values(diceCounts).some((c: any) => c > 0)}
          className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all font-black text-xs tracking-widest shadow-lg shadow-purple-600/30 active:scale-95 disabled:opacity-30 disabled:grayscale"
        >
          <Dice6 size={20} />
          INVOCAR DESTINO
        </button>
      </div>
    </div>
  );
};
