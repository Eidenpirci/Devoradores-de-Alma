export enum Race {
  HUMANO = 'Humano',
  ZUMBI = 'Zumbi',
  OVOS_KISHIN = 'Ovos de Kishin',
  FANTASMAS = 'Fantasmas',
  BRUXA = 'Bruxa',
  FEITICEIRO = 'Feiticeiro',
  LOBISOMEM = 'Lobisomem',
  VAMPIRO = 'Vampiro',
  ONI = 'Oni',
  YOKAI = 'Yōkai',
  MAJIN = 'Majin'
}

export enum Role {
  ARTESAO = 'Artesão',
  INDIVIDUAL = 'Individual'
}

export enum SoulAlignment {
  IMACULADO = 'Imaculado',
  CORAJOSO = 'Corajoso',
  NEUTRO = 'Neutro',
  LOUCO = 'Louco',
  INSANO = 'Insano'
}

export interface Attributes {
  forca: number;
  destreza: number;
  inteligencia: number;
  constituicao: number;
  percepcao: number;
  porte: number;
}

export interface ArmorItem {
  equipado: boolean;
  nome: string;
  fisica: number;
  espiritual: number;
  efeitos: string;
}

export interface ArmorSlots {
  cabeca: ArmorItem;
  superior: ArmorItem;
  inferior: ArmorItem;
}

export interface Character {
  id: string;
  isNPC: boolean;
  nome: string;
  titulo: string;
  raca: Race;
  racaEscolhaAtributo?: keyof Attributes;
  racaEscolhaPericia?: string[];
  idade: string;
  nacionalidade: string;
  dinheiro: string;
  nivel: number;
  funcao: Role;
  alinhamento: SoulAlignment;
  
  gloria: number;
  maxGloria: number;
  exaustao: number;
  maxExaustao: number;
  armaduraFisica: number;
  armaduraEspiritual: number;
  
  hp: number;
  maxHp: number;
  al: number;
  maxAl: number;
  st: number;
  maxSt: number;
  experiencia: number;
  experienciaGasta: number;
  insanidade: number;
  coragem: number;
  
  atributosBase: Attributes;
  pericias: Record<string, number>;
  
  maestriaCombate: string;
  maestriaRessonancia: string;
  maestriaMagia: string;
  // Estrutura: { maestriaKey: { Rank: SkillName } }
  masterySkills: Record<string, Record<string, string>>;
  
  vantagens: string;
  vantagemRaca: string;
  vantagensSelecionadas: Record<string, number>;
  blindadoChoice?: 'fisica' | 'espiritual';
  armaduras: ArmorSlots;
  
  ovosKishin?: number;
  almasBruxa?: number;
  
  companionId?: string;
  companionId2?: string;
  
  // Novos campos
  imageUrl?: string;
  weaponType?: 'Ataque' | 'Defesa' | 'Suporte';
}

export interface LogEntry {
  id: string;
  timestamp: number;
  text: string;
  type: 'dice' | 'system' | 'ai';
}

export type EffectRank = 'D' | 'C' | 'B' | 'A' | 'S';

export interface ActiveEffect {
  id: string;
  duration: number;
  rank?: EffectRank;
}

export interface CustomEffect {
  id: string;
  type: 'buff' | 'debuff';
  value: number;
  target: string;
  duration: number;
}

export interface Combatant {
  id: string;
  charId: string;
  initiative: number;
  currentHp: number;
  currentAl: number;
  currentSt: number;
  currentInsanidade: number;
  currentCoragem: number;
  activeEffects: ActiveEffect[];
  customEffects: CustomEffect[];
  lastDamageType?: 'physical' | 'spiritual' | 'alma' | 'stamina' | 'initiative' | 'heal' | 'dot-hp' | 'dot-al';
  animating?: boolean;
  deathTimer?: number;
}

export interface CombatState {
  combatants: Combatant[];
  turn: number;
  activeCombatantIndex: number;
}

export interface SavedBattle {
  id: number;
  name: string;
  state: CombatState;
}

// Interfaces de Mapa
export interface MapToken {
  id: string;
  type: 'character' | 'object';
  sourceId: string;
  x: number;
  y: number;
  color?: string;
}

export interface Shape {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface MapConfig {
  name: string;
  icon: string;
  color: string;
}

export interface GridFeature {
  type: 'wall' | 'door' | 'window';
  color?: string;
}

export interface MapState {
  tokens: Record<string, MapToken[]>;
  shapes: Record<string, Shape[]>;
  tileColors: Record<string, Record<string, string>>; // mapId -> { "x-y": hexColor }
  mapConfigs: Record<string, MapConfig>;
  mapOrder: string[];
  activeMapId: string;
  customBackgrounds: Record<string, string>;
  gridWidth: number; // Substituindo gridSize por width/height
  gridHeight: number;
  cellSize: number;
  gridFeatures: Record<string, Record<string, GridFeature>>;
  viewOffsets: Record<string, { x: number, y: number }>;
}

export interface Roll {
  type: number;
  value: number;
  source?: string;
}

export interface RollData {
  description: string;
  rolls: Roll[];
  modifier: number;
  total: number;
}