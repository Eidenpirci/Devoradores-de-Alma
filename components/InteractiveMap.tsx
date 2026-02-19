
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Character, Race, MapToken, MapState, Shape, MapConfig, GridFeature } from '../types';
import { 
  Layers, 
  Users, 
  Trash2, 
  Ghost, 
  Home, 
  Box, 
  TreePine, 
  DoorOpen, 
  Mountain, 
  Skull, 
  Flame, 
  Sparkles, 
  Zap, 
  User, 
  Droplets, 
  ShieldAlert, 
  Eye, 
  Star,
  Gem,
  Upload,
  Hand,
  Square,
  PaintBucket,
  Palette,
  Hammer,
  RotateCcw,
  RotateCw,
  Armchair,
  BedDouble,
  Library,
  Archive,
  Signal,
  Bone,
  Waves,
  ArrowUpCircle,
  ArrowDownCircle,
  Package,
  Container,
  Swords,
  Shield,
  Pyramid,
  GalleryVertical,
  AlertTriangle,
  Webhook,
  Lightbulb,
  Plus,
  Settings,
  X,
  Map as MapIcon,
  Check,
  Paintbrush,
  Undo2,
  Redo2,
  Moon,
  RefreshCw
} from 'lucide-react';

interface InteractiveMapProps {
  characters: Character[];
  mapState: MapState;
  onMapStateChange: React.Dispatch<React.SetStateAction<MapState>>;
  onSelectCharacter: (charId: string) => void;
}

const ICON_OPTIONS = {
  'Map': MapIcon,
  'GraduationCap': Star,
  'Skull': Skull,
  'Sun': Lightbulb,
  'TreePine': TreePine,
  'Mountain': Mountain,
  'Sparkles': Sparkles,
  'Home': Home,
  'Building': Home,
  'Swords': Swords,
  'Ghost': Ghost,
  'Flame': Flame,
  'Shield': Shield,
  'Target': Star
};

const OBJECT_TYPES = [
  { id: 'tree', name: 'Árvore', icon: TreePine, color: 'text-zinc-600' },
  { id: 'rock', name: 'Pedra', icon: Mountain, color: 'text-zinc-500' },
  { id: 'chest', name: 'Baú (Loot)', icon: Gem, color: 'text-purple-500' },
  { id: 'table', name: 'Mesa', icon: Square, color: 'text-yellow-700' },
  { id: 'chair', name: 'Cadeira', icon: Armchair, color: 'text-yellow-800' },
  { id: 'bed', name: 'Cama', icon: BedDouble, color: 'text-blue-800' },
  { id: 'bookshelf', name: 'Estante', icon: Library, color: 'text-orange-800' },
  { id: 'cabinet', name: 'Armário', icon: Archive, color: 'text-zinc-500' },
  { id: 'fireplace', name: 'Lareira', icon: Flame, color: 'text-orange-600' },
  { id: 'pillar', name: 'Pilar', icon: Signal, color: 'text-zinc-400' },
  { id: 'rubble', name: 'Escombros', icon: Bone, color: 'text-zinc-600' },
  { id: 'water', name: 'Poça d\'água', icon: Waves, color: 'text-blue-500' },
  { id: 'campfire', name: 'Fogueira', icon: Flame, color: 'text-red-500' },
  { id: 'stairs_up', name: 'Escada (Sobe)', icon: ArrowUpCircle, color: 'text-green-500' },
  { id: 'stairs_down', name: 'Escada (Desce)', icon: ArrowDownCircle, color: 'text-red-600' },
  { id: 'crate', name: 'Caixote', icon: Package, color: 'text-yellow-900' },
  { id: 'barrel', name: 'Barril', icon: Container, color: 'text-amber-800' },
  { id: 'weapon_rack', name: 'Suporte de Armas', icon: Swords, color: 'text-gray-400' },
  { id: 'armor_stand', name: 'Suporte de Armadura', icon: Shield, color: 'text-gray-500' },
  { id: 'altar', name: 'Altar', icon: Pyramid, color: 'text-purple-400' },
  { id: 'statue', name: 'Estátua', icon: GalleryVertical, color: 'text-zinc-300' },
  { id: 'trap', name: 'Armadilha', icon: AlertTriangle, color: 'text-red-500' },
  { id: 'portal', name: 'Portal', icon: Webhook, color: 'text-pink-500' },
  { id: 'light_source', name: 'Fonte de Luz', icon: Lightbulb, color: 'text-yellow-400' },
  { id: 'bloodstain', name: 'Mancha de Sangue', icon: Droplets, color: 'text-red-700' },
];

const SOUL_COLORS = [
  '#a855f7', '#ef4444', '#3b82f6', '#22c55e', '#f97316', '#eab308', '#ec4899', '#f4f4f5'
];

const PAINT_COLORS = [
  'transparent', '#1f2937', '#374151', '#4b5563', '#ffffff', '#991b1b', '#1e3a8a', '#064e3b', '#422006', '#3b0764'
];

const BUILD_TOOLS = [
  { id: 'select', name: 'Token', icon: Hand },
  { id: 'paint', name: 'Chão', icon: Paintbrush },
  { id: 'wall', name: 'Reta', icon: Square },
  { id: 'boxWall', name: 'Bloco', icon: Box },
  { id: 'door', name: 'Porta', icon: DoorOpen },
  { id: 'bucket', name: 'Balde', icon: PaintBucket },
];

const RACE_ICONS: Record<string, any> = {
  [Race.HUMANO]: User, [Race.ZUMBI]: Skull, [Race.OVOS_KISHIN]: Flame, [Race.FANTASMAS]: Ghost,
  [Race.BRUXA]: Sparkles, [Race.FEITICEIRO]: Zap, [Race.LOBISOMEM]: Moon, [Race.VAMPIRO]: Droplets,
  [Race.ONI]: ShieldAlert, [Race.YOKAI]: Eye, [Race.MAJIN]: Star,
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ characters, mapState, onMapStateChange, onSelectCharacter }) => {
  const { tokens, shapes, activeMapId, customBackgrounds, gridWidth, gridHeight, gridFeatures, mapConfigs, mapOrder, tileColors } = mapState;
  
  const currentTokens = tokens[activeMapId] || [];
  const currentShapes = shapes[activeMapId] || [];
  const currentTileColors = tileColors?.[activeMapId] || {};
  const currentGridFeatures = gridFeatures[activeMapId] || {};
  const currentMapConfig = mapConfigs[activeMapId] || { name: 'Cenário', icon: 'Map', color: '#9333ea' };

  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [placingType, setPlacingType] = useState<'character' | 'object' | null>(null);
  const [placingId, setPlacingId] = useState<string | null>(null);
  const [toolMode, setToolMode] = useState<'select' | 'place' | 'wall' | 'door' | 'bucket' | 'paint' | 'boxWall'>('select');
  const [isInteracting, setIsInteracting] = useState(false);
  const [interactionStart, setInteractionStart] = useState<{ x: number, y: number, line?: string, gridX?: number, gridY?: number } | null>(null);
  const [drawPreview, setDrawPreview] = useState<Record<string, GridFeature> | null>(null);
  const [boxWallPreview, setBoxWallPreview] = useState<{x1: number, y1: number, x2: number, y2: number} | null>(null);

  const [selectedSoulColor, setSelectedSoulColor] = useState<string>(SOUL_COLORS[0]);
  const [selectedPaintColor, setSelectedPaintColor] = useState<string>(PAINT_COLORS[1]);
  const [editingMapId, setEditingMapId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const activeDrawColor = (toolMode === 'paint' || toolMode === 'wall' || toolMode === 'boxWall') ? selectedPaintColor : undefined;

  const handleResetScenario = () => {
    onMapStateChange(prevState => {
      const newCustomBackgrounds = { ...(prevState.customBackgrounds || {}) };
      delete newCustomBackgrounds[activeMapId];

      return {
        ...prevState,
        tokens: {
          ...(prevState.tokens || {}),
          [activeMapId]: [],
        },
        shapes: {
          ...(prevState.shapes || {}),
          [activeMapId]: [],
        },
        tileColors: {
          ...(prevState.tileColors || {}),
          [activeMapId]: {},
        },
        gridFeatures: {
          ...(prevState.gridFeatures || {}),
          [activeMapId]: {},
        },
        customBackgrounds: newCustomBackgrounds,
      };
    });
  };

  const handleMouseUpGlobal = useCallback(() => {
    if (isInteracting) {
      let newState = { ...mapState };
      let changed = false;

      if (toolMode === 'wall' && drawPreview) {
        newState.gridFeatures = { ...gridFeatures, [activeMapId]: { ...currentGridFeatures, ...drawPreview } };
        changed = true;
      }
      
      if (toolMode === 'boxWall' && boxWallPreview) {
        const { x1, y1, x2, y2 } = boxWallPreview;
        const minX = Math.min(x1, x2); const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2); const maxY = Math.max(y1, y2);
        
        const newWalls: Record<string, GridFeature> = {};
        for (let x = minX; x <= maxX; x++) {
          newWalls[`h-${x}-${minY - 1}`] = { type: 'wall', color: selectedPaintColor };
          newWalls[`h-${x}-${maxY}`] = { type: 'wall', color: selectedPaintColor };
        }
        for (let y = minY; y <= maxY; y++) {
          newWalls[`v-${minX - 1}-${y}`] = { type: 'wall', color: selectedPaintColor };
          newWalls[`v-${maxX}-${y}`] = { type: 'wall', color: selectedPaintColor };
        }
        
        newState.gridFeatures = { ...gridFeatures, [activeMapId]: { ...currentGridFeatures, ...newWalls } };
        changed = true;
        setBoxWallPreview(null);
      }

      if (changed) {
        onMapStateChange(newState);
      }

      setIsInteracting(false);
      setInteractionStart(null);
      setDrawPreview(null);
    }
  }, [isInteracting, toolMode, drawPreview, boxWallPreview, mapState, onMapStateChange, activeMapId, currentGridFeatures, gridFeatures, selectedPaintColor]);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUpGlobal);
    return () => window.removeEventListener('mouseup', handleMouseUpGlobal);
  }, [handleMouseUpGlobal]);

  const getCoordsFromEvent = (e: React.MouseEvent) => {
    if (!mapContainerRef.current) return {x: 0, y: 0, gridX: 0, gridY: 0};
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gX = Math.floor((x / rect.width) * gridWidth);
    const gY = Math.floor((y / rect.height) * gridHeight);
    return {x, y, gridX: gX, gridY: gY};
  }

  const getLineFromEvent = (e: React.MouseEvent) => {
    if (!mapContainerRef.current) return null;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cellW = rect.width / gridWidth;
    const cellH = rect.height / gridHeight;
    const gridX = Math.floor(x / cellW);
    const gridY = Math.floor(y / cellH);
    const offsetX = x % cellW;
    const offsetY = y % cellH;
    const tolerance = 6;

    const distances = [
        { key: `v-${gridX}-${gridY}`, dist: Math.abs(offsetX - cellW) },
        { key: `h-${gridX}-${gridY}`, dist: Math.abs(offsetY - cellH) },
        { key: `v-${gridX - 1}-${gridY}`, dist: offsetX },
        { key: `h-${gridX}-${gridY - 1}`, dist: offsetY }
    ].sort((a,b) => a.dist - b.dist);

    return distances[0].dist < tolerance ? { key: distances[0].key } : null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsInteracting(true);
    const { gridX, gridY } = getCoordsFromEvent(e);
    
    if (toolMode === 'paint') {
      const newColors = { ...currentTileColors, [`${gridX}-${gridY}`]: selectedPaintColor };
      onMapStateChange({ ...mapState, tileColors: { ...tileColors, [activeMapId]: newColors } });
    } else if (toolMode === 'boxWall') {
      setBoxWallPreview({ x1: gridX, y1: gridY, x2: gridX, y2: gridY });
    } else if (toolMode === 'wall') {
        const line = getLineFromEvent(e);
        if (line) {
            setInteractionStart({ x: e.clientX, y: e.clientY, line: line.key });
            setDrawPreview({ [line.key]: { type: 'wall', color: selectedPaintColor } });
        }
    } else if (toolMode === 'door') {
        const line = getLineFromEvent(e);
        if (line && currentGridFeatures[line.key]?.type === 'wall') {
            const newGridFeatures = { ...currentGridFeatures, [line.key]: { type: 'door', color: selectedPaintColor } as GridFeature };
            onMapStateChange({ ...mapState, gridFeatures: { ...gridFeatures, [activeMapId]: newGridFeatures }});
        }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isInteracting) return;
    const { gridX, gridY } = getCoordsFromEvent(e);

    if (toolMode === 'paint') {
      if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
        const key = `${gridX}-${gridY}`;
        if (currentTileColors[key] !== selectedPaintColor) {
          const newColors = { ...currentTileColors, [key]: selectedPaintColor };
          onMapStateChange({ ...mapState, tileColors: { ...tileColors, [activeMapId]: newColors } });
        }
      }
      return;
    }

    if (toolMode === 'boxWall' && boxWallPreview) {
      setBoxWallPreview({ ...boxWallPreview, x2: gridX, y2: gridY });
      return;
    }

    if (!interactionStart) return;
    const startLineKey = interactionStart.line;
    if (!startLineKey) return;
    const currentLine = getLineFromEvent(e);
    if (!currentLine) return;

    const [startOrientation, startXStr, startYStr] = startLineKey.split('-');
    const [currentOrientation, currentXStr, currentYStr] = currentLine.key.split('-');
    
    const newFeaturesToUpdate: Record<string, GridFeature> = {};
    
    if (startOrientation === currentOrientation) {
        if (startOrientation === 'v' && startXStr === currentXStr) {
            const startY = parseInt(startYStr), currentY = parseInt(currentYStr);
            for (let y = Math.min(startY, currentY); y <= Math.max(startY, currentY); y++) {
                const key = `v-${startXStr}-${y}`;
                if (toolMode === 'wall') newFeaturesToUpdate[key] = { type: 'wall', color: selectedPaintColor };
            }
        } else if (startOrientation === 'h' && startYStr === currentYStr) {
            const startX = parseInt(startXStr), currentX = parseInt(currentXStr);
            for (let x = Math.min(startX, currentX); x <= Math.max(startX, currentX); x++) {
                const key = `h-${x}-${startYStr}`;
                if (toolMode === 'wall') newFeaturesToUpdate[key] = { type: 'wall', color: selectedPaintColor };
            }
        }
    }

    if (toolMode === 'wall') {
      setDrawPreview(newFeaturesToUpdate);
    }
  };
  
  const handleFloodFill = (startX: number, startY: number) => {
    const targetColor = selectedPaintColor;
    const currentColors = tileColors?.[activeMapId] || {};
    const startColor = currentColors[`${startX}-${startY}`] || 'transparent';

    if (targetColor === startColor) return;

    const newColors = { ...currentColors };
    const queue: [number, number][] = [[startX, startY]];
    const visited = new Set<string>([`${startX}-${startY}`]);
    const walls = gridFeatures[activeMapId] || {};

    while (queue.length > 0) {
        const [x, y] = queue.shift()!;
        newColors[`${x}-${y}`] = targetColor;
        const neighbors: {nx: number, ny: number, wallKey: string}[] = [
            {nx: x, ny: y - 1, wallKey: `h-${x}-${y-1}`},
            {nx: x, ny: y + 1, wallKey: `h-${x}-${y}`},
            {nx: x - 1, ny: y, wallKey: `v-${x-1}-${y}`},
            {nx: x + 1, ny: y, wallKey: `v-${x}-${y}`}
        ];
        for (const {nx, ny, wallKey} of neighbors) {
            const neighborKey = `${nx}-${ny}`;
            if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight && !visited.has(neighborKey) && !walls[wallKey]) {
                visited.add(neighborKey);
                queue.push([nx, ny]);
            }
        }
    }
    onMapStateChange(prevState => ({ ...prevState, tileColors: { ...prevState.tileColors, [activeMapId]: newColors } }));
  };

  const handleTileClick = (x: number, y: number) => {
    if (toolMode === 'bucket') {
        handleFloodFill(x, y);
        return;
    }
    if (toolMode === 'select') {
      const token = currentTokens.find(t => t.x === x && t.y === y);
      if (token) setSelectedTokenId(String(token.id));
      else if (selectedTokenId) {
        const newTokens = currentTokens.map(t => String(t.id) === selectedTokenId ? { ...t, x, y } : t);
        onMapStateChange({ ...mapState, tokens: { ...tokens, [activeMapId]: newTokens } });
        setSelectedTokenId(null);
      }
      return;
    }
    if (placingType && placingId) {
      if (!currentTokens.some(t => t.x === x && t.y === y)) {
        const newToken: MapToken = { id: Date.now().toString(), type: placingType, sourceId: placingId, x, y };
        onMapStateChange({ ...mapState, tokens: { ...tokens, [activeMapId]: [...currentTokens, newToken] } });
        setPlacingType(null); setPlacingId(null); setToolMode('select');
      }
    }
  };

  const removeToken = (id: string) => {
    const newTokens = currentTokens.filter(t => String(t.id) !== id);
    onMapStateChange({ ...mapState, tokens: { ...tokens, [activeMapId]: newTokens } });
    if (selectedTokenId === id) setSelectedTokenId(null);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
      e.preventDefault();
      if (id !== draggedId) setDragOverId(id);
  };

  const handleDragLeave = () => setDragOverId(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropId: string) => {
      e.preventDefault();
      if (draggedId && draggedId !== dropId) {
          const draggedIndex = mapOrder.findIndex(id => id === draggedId);
          const dropIndex = mapOrder.findIndex(id => id === dropId);
          const newOrder = [...mapOrder];
          const [removed] = newOrder.splice(draggedIndex, 1);
          newOrder.splice(dropIndex, 0, removed);
          onMapStateChange({ ...mapState, mapOrder: newOrder });
      }
      setDragOverId(null);
      setDraggedId(null);
  };

  const handleDragEnd = () => { setDraggedId(null); setDragOverId(null); };

  const renderFeature = (key: string, feature: GridFeature, isPreview = false) => {
    const [orientation, xStr, yStr] = key.split('-');
    const x = parseInt(xStr); const y = parseInt(yStr);
    const posLeft = (orientation === 'v' ? (x + 1) : x) * (100 / gridWidth);
    const posTop = (orientation === 'h' ? (y + 1) : y) * (100 / gridHeight);
    const width = orientation === 'v' ? '4px' : `${100 / gridWidth}%`;
    const height = orientation === 'h' ? '4px' : `${100 / gridHeight}%`;
    const style: React.CSSProperties = {
      left: orientation === 'v' ? `calc(${posLeft}% - 2px)` : `${posLeft}%`,
      top: orientation === 'h' ? `calc(${posTop}% - 2px)` : `${posTop}%`,
      width,
      height,
      backgroundColor: isPreview ? (activeDrawColor || '#a855f7') + '80' : (feature.color || '#d1d5db')
    };
    let className = 'absolute transition-all pointer-events-none z-40 ';
    if (!isPreview) className += 'shadow-[0_0_5px_rgba(0,0,0,0.5)]';
    if (feature.type === 'door') style.backgroundColor = '#a16207';
    return <div key={key + (isPreview ? '-preview' : '')} style={style} className={className}></div>;
  };

  const renderBoxWallPreview = () => {
    if (!boxWallPreview) return null;
    const { x1, y1, x2, y2 } = boxWallPreview;
    const minX = Math.min(x1, x2); const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2); const maxY = Math.max(y1, y2);
    return (
      <div className="absolute z-30 pointer-events-none border-2 border-purple-500 bg-purple-500/10" style={{ left: `${(minX / gridWidth) * 100}%`, top: `${(minY / gridHeight) * 100}%`, width: `${((maxX - minX + 1) / gridWidth) * 100}%`, height: `${((maxY - minY + 1) / gridHeight) * 100}%`, borderColor: activeDrawColor || '#a855f7' }} />
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[85vh]">
      <div className="w-full lg:w-80 space-y-4 shrink-0 overflow-y-auto custom-scrollbar pr-2">
        <div className="bg-zinc-950 p-6 rounded-2xl border border-purple-900/20 shadow-xl space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><Hammer size={14} className="text-purple-500" /><span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Oficina de Construção</span></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {BUILD_TOOLS.map(tool => (
                <button key={tool.id} onClick={() => setToolMode(tool.id as any)} className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all gap-1.5 ${toolMode === tool.id ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/30' : 'bg-black border-zinc-900 text-zinc-500 hover:border-purple-900/50'}`}>
                    <tool.icon size={18} />
                    <span className="text-[8px] font-black uppercase">{tool.name}</span>
                </button>
            ))}
          </div>
           {(toolMode === 'paint' || toolMode === 'wall' || toolMode === 'boxWall' || toolMode === 'bucket') && (
              <div className="mt-4 pt-4 border-t border-zinc-900 animate-in fade-in slide-in-from-top-1">
                 <div className="flex items-center gap-2 mb-2"><Palette size={14} className="text-purple-500" /><span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cromatismo</span></div>
                 <div className="grid grid-cols-5 gap-2">
                    {PAINT_COLORS.map(color => (
                        <button key={color} onClick={() => setSelectedPaintColor(color)} className={`w-10 h-10 rounded-lg border-2 transition-all ${selectedPaintColor === color ? 'border-white scale-110' : 'border-zinc-800 opacity-70 hover:opacity-100'}`} style={{ backgroundColor: color === 'transparent' ? 'black' : color }}>
                           {color === 'transparent' && <X size={14} className="text-zinc-500 m-auto"/>}
                        </button>
                    ))}
                 </div>
              </div>
           )}
        </div>
        <div className="bg-zinc-950 p-6 rounded-2xl border border-purple-900/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Layers size={14} className="text-purple-500" /> <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cenários</span></div>
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {mapOrder.map(mid => {
                const config = mapConfigs[mid];
                const Icon = (ICON_OPTIONS as any)[config.icon] || MapIcon;
                const isActive = activeMapId === mid;
                return (
                    <div key={mid} draggable onDragStart={(e) => handleDragStart(e, mid)} onDragOver={(e) => handleDragOver(e, mid)} onDrop={(e) => handleDrop(e, mid)} onDragEnd={handleDragEnd} onDragLeave={handleDragLeave} className={`group relative cursor-grab transition-all ${draggedId === mid ? 'opacity-40 border-2 border-dashed border-purple-600 rounded-xl' : ''}`}>
                        {dragOverId === mid && <div className="absolute top-[-2px] left-0 right-0 h-1 bg-purple-500 rounded-full z-30 animate-pulse"></div>}
                        <button onClick={() => onMapStateChange({ ...mapState, activeMapId: mid })} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${isActive ? 'bg-purple-600/20 border-purple-500 shadow-inner' : 'bg-black border-zinc-900 hover:border-purple-900/50'}`} style={isActive ? { borderLeftWidth: '4px', borderLeftColor: config.color } : {}}>
                            <div className="p-2 rounded-lg bg-zinc-900 text-purple-400"><Icon size={16} style={{ color: config.color }} /></div>
                            <div className="flex flex-col min-w-0"><span className={`text-[10px] font-black uppercase truncate ${isActive ? 'text-white' : 'text-zinc-500'}`}>{config.name}</span></div>
                        </button>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button onClick={(e) => { e.stopPropagation(); setEditingMapId(mid); }} type="button" className="p-1.5 bg-zinc-900 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer"><Settings size={12}/></button>
                        </div>
                    </div>
                );
            })}
          </div>
          <div className="pt-2">
            <input type="file" ref={fileInputRef} onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => onMapStateChange({ ...mapState, customBackgrounds: { ...customBackgrounds, [activeMapId]: reader.result as string } });
                reader.readAsDataURL(file);
              }
            }} accept="image/*" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl flex items-center justify-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest">
                <Upload size={14} />{customBackgrounds[activeMapId] ? 'Alterar Fundo' : 'Subir Mapa'}
            </button>
          </div>
        </div>
        <div className="bg-zinc-950 p-6 rounded-2xl border border-purple-900/20 shadow-xl flex flex-col h-[40vh]">
          <div className="flex items-center gap-2 mb-2"><Users size={14} className="text-purple-500" /><span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Almas</span></div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1.5 mb-4">
            {characters.map(item => (
                <button key={item.id} onClick={() => { setPlacingType('character'); setPlacingId(item.id); setToolMode('place'); setSelectedTokenId(null); }} className={`w-full text-left p-2 rounded-xl border transition-all flex items-center gap-3 ${placingId === item.id && placingType === 'character' ? 'bg-purple-900/30 border-purple-500' : 'bg-black border-zinc-900 hover:border-purple-900/30'}`}>
                  <div className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center overflow-hidden ${item.isNPC ? 'bg-zinc-900' : 'bg-purple-900/40 text-purple-400'}`}>{item.imageUrl ? <img src={item.imageUrl} alt={item.nome} className="w-full h-full object-cover" /> : <User size={16} />}</div>
                  <div className="flex flex-col"><span className={`text-[10px] font-black uppercase ${!item.isNPC ? 'text-zinc-300' : 'text-zinc-600'}`}>{item.nome}</span></div>
                </button>
              ))}
          </div>
          <div className="flex items-center gap-2 mb-2 border-t border-zinc-900 pt-4"><Box size={14} className="text-purple-500" /><span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Objetos</span></div>
           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1.5">
            {OBJECT_TYPES.map(item => (
                <button key={item.id} onClick={() => { setPlacingType('object'); setPlacingId(item.id); setToolMode('place'); setSelectedTokenId(null); }} className={`w-full text-left p-2 rounded-xl border transition-all flex items-center gap-3 ${placingId === item.id && placingType === 'object' ? 'bg-purple-900/30 border-purple-500' : 'bg-black border-zinc-900 hover:border-purple-900/30'}`}>
                  <div className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center bg-zinc-900`}><item.icon size={16} /></div>
                  <div className="flex flex-col"><span className={`text-[10px] font-black uppercase text-zinc-600`}>{item.name}</span></div>
                </button>
              ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center overflow-hidden h-full">
        <div className="flex items-center gap-4 self-start mb-4">
            <h3 className="title-font text-2xl text-white uppercase tracking-tighter" style={{ color: currentMapConfig.color }}>{currentMapConfig.name}</h3>
            <button onClick={() => handleResetScenario()} title="Resetar Cenário" className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-600 hover:text-red-500 rounded-lg transition-all"><RefreshCw size={14} /></button>
            <div className="h-6 w-px bg-zinc-800"></div>
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">GRID 60x34 (16:9)</span>
        </div>
        <div className="flex-1 flex items-center justify-center w-full h-full overflow-hidden">
          <div ref={mapContainerRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUpGlobal} className="relative shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden cursor-crosshair bg-zinc-950 border-4 max-h-full max-w-full" style={{ borderColor: currentMapConfig.color, aspectRatio: '60 / 34', width: '100%' }}>
              <div className="absolute inset-0 z-0">
                {customBackgrounds[activeMapId] && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${customBackgrounds[activeMapId]})` }}/>}
                <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${gridWidth}, 1fr)`, gridTemplateRows: `repeat(${gridHeight}, 1fr)` }}>
                  {Array.from({ length: gridWidth * gridHeight }).map((_, i) => {
                    const x = i % gridWidth; const y = Math.floor(i / gridWidth);
                    const color = currentTileColors[`${x}-${y}`];
                    return (
                      <div key={`${x}-${y}`} onClick={() => handleTileClick(x, y)} className="relative z-10 w-full h-full border-r border-b border-white/5" style={{ backgroundColor: color || 'transparent' }}></div>
                    );
                  })}
                </div>
                {renderBoxWallPreview()}
                {currentTokens.map((token) => {
                  const isSelected = selectedTokenId === String(token.id);
                  const char = token.type === 'character' ? characters.find(c => c.id === token.sourceId) : null;
                  const Icon = char ? (RACE_ICONS[char.raca] || User) : User;
                  return (
                    <div key={token.id} className="absolute group" style={{ left: `${(token.x / gridWidth) * 100}%`, top: `${(token.y / gridHeight) * 100}%`, width: `${100 / gridWidth}%`, height: `${100 / gridHeight}%`, cursor: 'pointer', zIndex: isSelected ? 35 : 20 }} onClick={() => handleTileClick(token.x, token.y)}>
                      {token.type === 'character' && char ? (
                        <>
                          <div className="absolute bottom-full mb-2 w-max left-1/2 -translate-x-1/2 bg-zinc-950 p-2 rounded-xl border border-purple-600/50 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 flex items-center gap-3 group-hover:scale-110 origin-bottom shadow-lg animate-in fade-in zoom-in-95 duration-200">
                            <div className="w-10 h-10 rounded-md bg-zinc-800 border border-zinc-700 overflow-hidden flex-shrink-0">{char.imageUrl ? <img src={char.imageUrl} alt={char.nome} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User size={20} className="text-zinc-500" /></div>}</div>
                            <div><span className="text-sm font-black uppercase tracking-wider block text-white">{char.nome}</span><div className="flex items-center gap-2 mt-1"><span className="bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">NV. {char.nivel}</span><span className="text-zinc-400 text-[9px] font-bold uppercase">{char.raca}</span></div></div>
                          </div>
                          <div className={`relative w-full h-full rounded-full flex items-center justify-center border transition-all duration-300 group-hover:scale-125 ${isSelected ? 'scale-110 border-purple-400 ring-2 ring-purple-600/50' : 'border-zinc-700 shadow-2xl'}`} style={{ backgroundColor: char.isNPC ? '#09090b' : '#3b0764' }}><Icon size="60%" className={char.isNPC ? 'text-zinc-600' : 'text-purple-200'} /></div>
                           <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex gap-2 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); removeToken(String(token.id)); }} className="p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-transform hover:scale-110"><Trash2 size={14} /></button>
                            <button onClick={(e) => { e.stopPropagation(); onSelectCharacter(token.sourceId); }} className="p-2 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-transform hover:scale-110"><User size={14} /></button>
                          </div>
                        </>
                      ) : token.type === 'object' ? (() => {
                          const objType = OBJECT_TYPES.find(o => o.id === token.sourceId);
                          const Icon = objType?.icon || Box;
                          return <div className="relative z-20 w-full h-full flex items-center justify-center"><Icon size="70%" className={`${objType?.color} drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`} /></div>;
                      })() : null}
                    </div>
                  );
                })}
                {Object.entries(currentGridFeatures).map(([key, feature]) => renderFeature(key, feature as GridFeature))}
                {drawPreview && Object.entries(drawPreview).map(([key, feature]) => renderFeature(key, feature as GridFeature, true))}
              </div>
          </div>
        </div>
      </div>
      {editingMapId && (
        <div className="fixed inset-0 z-[101] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#0a0a0c] border border-purple-600/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-zinc-900"><h3 className="title-font text-2xl text-purple-500 uppercase tracking-tighter">EDITAR CENÁRIO</h3></div>
            <div className="p-8 space-y-4">
              <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Nome do Cenário</label>
              <input type="text" value={mapConfigs[editingMapId]?.name || ''} onChange={e => onMapStateChange({ ...mapState, mapConfigs: { ...mapConfigs, [editingMapId]: { ...mapConfigs[editingMapId], name: e.target.value } } })} className="w-full bg-black/40 border border-zinc-800 rounded-lg px-4 py-3 text-white outline-none focus:border-purple-600" />
               <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Ícone e Cor</label>
               <div className="flex gap-4">
                  <select value={mapConfigs[editingMapId]?.icon || 'Map'} onChange={e => onMapStateChange({ ...mapState, mapConfigs: { ...mapConfigs, [editingMapId]: { ...mapConfigs[editingMapId], icon: e.target.value } } })} className="flex-1 bg-black/40 border border-zinc-800 rounded-lg px-4 py-3 text-white outline-none focus:border-purple-600">
                     {Object.keys(ICON_OPTIONS).map(iconName => <option key={iconName} value={iconName}>{iconName}</option>)}
                  </select>
                  <input type="color" value={mapConfigs[editingMapId]?.color || '#a855f7'} onChange={e => onMapStateChange({ ...mapState, mapConfigs: { ...mapConfigs, [editingMapId]: { ...mapConfigs[editingMapId], color: e.target.value } } })} className="w-16 bg-transparent border-none" />
               </div>
            </div>
            <div className="p-6 bg-zinc-950/50 flex justify-end gap-3"><button onClick={() => setEditingMapId(null)} className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-lg text-[10px] font-bold uppercase tracking-widest">Fechar</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
