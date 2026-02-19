import React, { useEffect, useState, useMemo } from 'react';
import { Roll, RollData } from '../types';

interface DiceAnimationOverlayProps {
  rollData: RollData | null;
  onClose: () => void;
}

export const DiceAnimationOverlay: React.FC<DiceAnimationOverlayProps> = ({ rollData, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [displayValues, setDisplayValues] = useState<number[]>([]);

  useEffect(() => {
    if (!rollData) return;

    setVisible(true);
    setDisplayValues(rollData.rolls.map(() => 0));

    const rollingDuration = 1200;
    const displayDuration = 3500; // Aumentado para dar tempo de ler
    const rollingInterval = 60;

    const intervalId = setInterval(() => {
        setDisplayValues(rollData.rolls.map(roll => Math.floor(Math.random() * roll.type) + 1));
    }, rollingInterval);

    const stopRollingTimeout = setTimeout(() => {
        clearInterval(intervalId);
        setDisplayValues(rollData.rolls.map(r => r.value));
    }, rollingDuration);

    const closeOverlayTimeout = setTimeout(() => {
        setVisible(false);
        const finalCloseTimeout = setTimeout(onClose, 500);
        return () => clearTimeout(finalCloseTimeout);
    }, rollingDuration + displayDuration);

    return () => {
        clearInterval(intervalId);
        clearTimeout(stopRollingTimeout);
        clearTimeout(closeOverlayTimeout);
    };
  }, [rollData, onClose]);

  // FIX: Explicitly define the return type for the useMemo hook to ensure proper inference of the grouped rolls structure.
  const groupedRolls = useMemo<Record<string, { rolls: Roll[], indexes: number[] }>>(() => {
    const initialValue: Record<string, { rolls: Roll[], indexes: number[] }> = {};
    if (!rollData?.rolls) {
        return initialValue;
    }
    // FIX: Provide explicit type parameters to the reduce function and use non-null assertion to prevent 'unknown' or 'undefined' errors during accumulation.
    return rollData.rolls.reduce<Record<string, { rolls: Roll[], indexes: number[] }>>((acc, roll, index) => {
        const key = roll.source || 'Rolagem';
        if (!acc[key]) {
            acc[key] = { rolls: [], indexes: [] };
        }
        acc[key]!.rolls.push(roll);
        acc[key]!.indexes.push(index);
        return acc;
    }, initialValue);
  }, [rollData]);

  const hasGroups = rollData?.rolls.some(r => r.source);

  if (!rollData) {
    return null;
  }

  return (
    <div className={`fixed top-6 left-6 z-[999] transition-all duration-500 pointer-events-none ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
      <div className="bg-gradient-to-br from-zinc-950 to-[#100a14] border-2 border-purple-600/50 rounded-2xl shadow-2xl shadow-purple-600/20 p-5 w-full max-w-md text-center animate-in fade-in zoom-in-95 duration-300">
        <h3 className="title-font text-lg text-purple-500 uppercase tracking-wider mb-3">{rollData.description}</h3>
        
        <div className={`my-4 min-h-[60px] ${hasGroups ? 'space-y-3' : 'flex justify-center flex-wrap items-center gap-3'}`}>
          {hasGroups ? (
            Object.entries(groupedRolls).map(([source, data]) => {
              // FIX: Use a type cast to ensure properties 'rolls' and 'indexes' are recognized on the grouped data object within the JSX mapping.
              const groupData = data as { rolls: Roll[], indexes: number[] };
              const subtotal = groupData.rolls.reduce((sum, roll) => sum + roll.value, 0);
              return (
                <div key={source} className="bg-black/40 p-3 rounded-xl border border-purple-900/50 animate-roll-in">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <h4 className="text-sm font-bold text-purple-300 text-left">{source}</h4>
                    <span className="text-lg font-black text-white animate-total-reveal" style={{ animationDelay: `1.3s` }}>{subtotal}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {groupData.rolls.map((roll, i) => (
                      <div key={groupData.indexes[i]} className="flex flex-col items-center" style={{ animationDelay: `${groupData.indexes[i] * 80}ms` }}>
                        <div className="w-10 h-10 bg-black rounded-lg border-2 border-purple-800 flex items-center justify-center text-lg font-black text-white shadow-lg">
                          <span>{displayValues[groupData.indexes[i]] || 0}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-bold mt-1">d{roll.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          ) : (
            rollData.rolls.map((roll, index) => (
              <div key={index} className="flex flex-col items-center animate-roll-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="w-12 h-12 bg-black rounded-lg border-2 border-purple-800 flex items-center justify-center text-xl font-black text-white shadow-lg">
                  <span>{displayValues[index] || 0}</span>
                </div>
                <span className="text-xs text-zinc-500 font-bold mt-1">d{roll.type}</span>
              </div>
            ))
          )}
        </div>

        {rollData.modifier !== 0 && (
          <div className="flex justify-center items-center gap-3 my-4">
              <div className="text-3xl text-zinc-600 font-thin animate-roll-in" style={{ animationDelay: `${rollData.rolls.length * 80}ms` }}>
                {rollData.modifier > 0 ? '+' : '-'}
              </div>
              <div className="flex flex-col items-center animate-roll-in" style={{ animationDelay: `${(rollData.rolls.length + 1) * 80}ms` }}>
                <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-xl font-black text-purple-400 shadow-inner">
                  {Math.abs(rollData.modifier)}
                </div>
                <span className="text-xs text-zinc-500 font-bold mt-1">Mod</span>
              </div>
          </div>
        )}

        <div className="border-t-2 border-purple-900/30 pt-3 mt-4">
          <span className="text-zinc-500 uppercase text-xs font-black tracking-widest">Total Final</span>
          <p className="text-5xl font-black text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] animate-total-reveal" style={{ animationDelay: `1.3s` }}>
            {rollData.total}
          </p>
        </div>
      </div>
      <style>{`
        @keyframes roll-in {
          0% { transform: scale(0.5) rotate(-45deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-roll-in {
          animation: roll-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        @keyframes total-reveal {
          0% { transform: scale(0.2); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-total-reveal {
          animation: total-reveal 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
      `}</style>
    </div>
  );
};