import { Race, Attributes } from './types';

export interface LevelData {
  xpCost: number;
  attrPoints: number;
  attrLimit: number;
  skillPoints: number;
  skillLimit: number;
  vantPoints: number;
  hpBonus: number;
  alBonus: number;
  stBonus: number;
  extraAttr: number;
}

export const LEVELING_TABLE: Record<number, LevelData> = {
  1: { xpCost: 0, attrPoints: 8, attrLimit: 2, skillPoints: 12, skillLimit: 2, vantPoints: 12, hpBonus: 0, alBonus: 0, stBonus: 0, extraAttr: 0 },
  2: { xpCost: 200, attrPoints: 0, attrLimit: 2, skillPoints: 12, skillLimit: 3, vantPoints: 0, hpBonus: 30, alBonus: 15, stBonus: 15, extraAttr: 0 },
  3: { xpCost: 300, attrPoints: 6, attrLimit: 3, skillPoints: 5, skillLimit: 3, vantPoints: 3, hpBonus: 0, alBonus: 0, stBonus: 0, extraAttr: 0 },
  4: { xpCost: 400, attrPoints: 0, attrLimit: 3, skillPoints: 12, skillLimit: 4, vantPoints: 0, hpBonus: 30, alBonus: 15, stBonus: 15, extraAttr: 0 },
  5: { xpCost: 500, attrPoints: 8, attrLimit: 5, skillPoints: 8, skillLimit: 5, vantPoints: 3, hpBonus: 0, alBonus: 0, stBonus: 0, extraAttr: 0 },
  6: { xpCost: 600, attrPoints: 0, attrLimit: 5, skillPoints: 20, skillLimit: 6, vantPoints: 0, hpBonus: 30, alBonus: 15, stBonus: 15, extraAttr: 0 },
  7: { xpCost: 700, attrPoints: 10, attrLimit: 7, skillPoints: 8, skillLimit: 7, vantPoints: 3, hpBonus: 0, alBonus: 0, stBonus: 0, extraAttr: 0 },
  8: { xpCost: 800, attrPoints: 0, attrLimit: 7, skillPoints: 20, skillLimit: 8, vantPoints: 0, hpBonus: 30, alBonus: 15, stBonus: 15, extraAttr: 1 },
  9: { xpCost: 900, attrPoints: 8, attrLimit: 9, skillPoints: 8, skillLimit: 9, vantPoints: 3, hpBonus: 0, alBonus: 0, stBonus: 0, extraAttr: 0 },
  10: { xpCost: 1000, attrPoints: 10, attrLimit: 10, skillPoints: 15, skillLimit: 10, vantPoints: 6, hpBonus: 50, alBonus: 30, stBonus: 45, extraAttr: 1 },
};

export interface RaceData {
  attributes: Partial<Attributes>;
  attributeChoices?: (keyof Attributes)[];
  skills: Record<string, number>;
  skillChoices?: { count: number, values: number[], options?: string[] } | null;
  masteryDefaults: string[];
  advantage: string;
}

export const RACE_DATA: Record<Race, RaceData> = {
  [Race.HUMANO]: {
    attributes: {},
    attributeChoices: ['porte', 'destreza'],
    skills: {},
    skillChoices: { count: 2, values: [2, 1] },
    masteryDefaults: ['Ressonância', 'Combate'],
    advantage: '+2 em testes de Coragem'
  },
  [Race.ZUMBI]: {
    attributes: { forca: 2 },
    skills: {},
    skillChoices: { count: 1, values: [2], options: ['Atletismo', 'Tenacidade'] },
    masteryDefaults: ['Combate', 'Ressonância'],
    advantage: 'Morto-Vivo — Só morre quando HP e AL chegam a 0.'
  },
  [Race.OVOS_KISHIN]: {
    attributes: { forca: 2 },
    attributeChoices: ['porte', 'destreza'],
    skills: {},
    skillChoices: { count: 2, values: [2, 1] },
    masteryDefaults: ['Combate', 'Ressonância', 'Magia'],
    advantage: 'Agente do Caos — +2 em rolagens envolvendo Insanidade.'
  },
  [Race.FANTASMAS]: {
    attributes: { porte: 2 },
    skills: { Furtividade: 3 },
    masteryDefaults: ['Ressonância'],
    advantage: 'Intangível — Imune a golpes físicos; só causa/recebe dano espiritual. Ganha [Sensorial].'
  },
  [Race.BRUXA]: {
    attributes: { porte: 2, inteligencia: 2 },
    skills: { Sabedoria: 1, Enganação: 1 },
    masteryDefaults: ['Magia'],
    advantage: 'Agente do Caos — +2 para rolagens de Insanidade (exceto resistir). Restrição: Não pode ter alinhamento Imaculado ou Corajoso.'
  },
  [Race.FEITICEIRO]: {
    attributes: { porte: 1, inteligencia: 2 },
    skills: { Sabedoria: 2, Enganação: 1 },
    masteryDefaults: ['Magia', 'Ressonância'],
    advantage: 'Agente do Caos — +2 para rolagens envolvendo Insanidade. Restrição: Não pode ter alinhamento Imaculado.'
  },
  [Race.LOBISOMEM]: {
    attributes: { percepcao: 2, forca: 3 },
    skills: { Atletismo: 2, Acrobacia: 2 },
    masteryDefaults: ['Combate'],
    advantage: 'Herança Amaldiçoada — Metade do dano físico; -3 para resistir à Insanidade. Restrição: Não pode ter Bruxa ou Feiticeiro como Companion.'
  },
  [Race.VAMPIRO]: {
    attributes: { destreza: 2, inteligencia: 3 },
    skills: { Vitalidade: 2, Diplomacia: 2 },
    masteryDefaults: ['Magia', 'Combate'],
    advantage: 'Sede Implacável — Drena (2d6+Medicina) de HP ao causar dano mágico em Ordem. Restrição: Não pode ter alinhamento Imaculado.'
  },
  [Race.ONI]: {
    attributes: { forca: 3, porte: 1 },
    skills: { Intimidação: 2, Resistência: 2 },
    masteryDefaults: ['Combate'],
    advantage: 'Fúria Encarnada — Modo berserker 1x/dia (+1 dano cumulativo até +4). Ganha [Sensorial].'
  },
  [Race.YOKAI]: {
    attributes: { inteligencia: 2, destreza: 2 },
    skills: { Furtividade: 2, Observação: 1 },
    masteryDefaults: ['Magia', 'Ressonância'],
    advantage: 'Forma Etérea — 1x/dia, +1 em rolagens (+2 contra exorcismo). Ganha [Sensorial].'
  },
  [Race.MAJIN]: {
    attributes: { constituicao: 2, inteligencia: 1, porte: 1 },
    skills: { Tenacidade: 2, Sabedoria: 1 },
    masteryDefaults: ['Magia', 'Ressonância'],
    advantage: 'Corpo Arcano — Ativa +5 armadura espiritual ao perder 25% HP. Ganha [Sensorial].'
  }
};

export const INITIAL_ATTRIBUTES: Attributes = {
  forca: 0,
  destreza: 0,
  inteligencia: 0,
  constituicao: 0,
  percepcao: 0,
  porte: 0
};

export const SKILLS_GROUPS = {
  "Físico": ["Atletismo", "Acrobacia", "Vitalidade", "Furtividade", "Resistência"],
  "Mental": ["Intuição", "Sabedoria", "Tenacidade", "Observação", "Investigação"],
  "Social": ["Enganação", "Diplomacia", "Adestração", "Negociação", "Intimidação"],
  "Técnico": ["Runas", "Alquimia", "Medicina", "Geografia", "Engenharia"]
};

export interface MasterySkill {
  name: string;
  description: string;
}

export const MASTERY_XP_COSTS: Record<string, number> = {
  "C": 100,
  "B": 200,
  "A": 300,
  "S": 400
};

export const MASTERY_SKILLS_DATA: Record<string, Record<string, MasterySkill[]>> = {
  "maestriaCombate": {
    "C": [
      { name: "Treinamento", description: "Cria técnicas de Combate gastando -1/4 de XP" },
      { name: "Fortalecimento", description: "Causa +2 de dano com ataques básicos de Combate" },
      { name: "Condicionamento", description: "Gasta -2 de ST em técnicas de Combate (mínimo -1)" }
    ],
    "B": [
      { name: "Monstro", description: "Causa +2 de dano em técnicas de Combate para cada 1 de Força" },
      { name: "Calejado", description: "Recebe metade do dano contra ataques básicos e técnicas de Combate" },
      { name: "Velocista", description: "+1 para acertar ataques básicos de Combate para cada 10 de Velocidade" }
    ],
    "A": [
      { name: "Intuição", description: "+4 para reagir contra ataques básicos de Combate" },
      { name: "Coordenação", description: "Ignora efeito de Ataque Conjunto; +1 para acertar alvo diferente" },
      { name: "Inesgotável", description: "Gasta metade do ST para técnicas de Combate de Rank B ou inferior" }
    ],
    "S": [
      { name: "Imortal", description: "Recebe metade do dano se falhar em defesa" },
      { name: "Imparável", description: "+3 contra paralisias/aprisionamento; imune a medo, lentidão, provocação" },
      { name: "Imprevisível", description: "+2 para acertar ao usar técnica de Combate diferente da última; +1 ataque múltiplo" }
    ]
  },
  "maestriaRessonancia": {
    "C": [
      { name: "Treinamento", description: "Cria técnicas de Ressonância gastando -1/4 de XP" },
      { name: "Fundamento", description: "Gasta -2 de AL em técnicas de Ressonância(mínimo -1)" },
      { name: "Complemento", description: "Realiza UMA técnica de Ressonância Rank D de Ação Secundária sem gastar ação" }
    ],
    "B": [
      { name: "Curandeiro", description: "Realiza técnicas de cura de Ressonância com Ação Secundária" },
      { name: "Eficiente", description: "Realiza UMA técnica de Ressonância Rank B de Ação Secundária sem gastar ação" },
      { name: "Castigador", description: "Ganha +2 de acerto para ataques básicos de Ressonância" }
    ],
    "A": [
      { name: "Paciente", description: "Adiciona sua (Viatalidade) na duração de turnos de suas técnicas SÓ DE EFEITO de Ressonância" },
      { name: "Poderoso", description: "+2 de dano com técnicas e ataques básicos de Ressonância para cada 2 de Porte" },
      { name: "Inesgotável", description: "Gasta metade do AL para técnicas de Ressonância Rank B ou inferior" }
    ],
    "S": [
      { name: "Grão-Mestre", description: "+2 adicional para acertar técnicas de Ressonância" },
      { name: "Conjurador", description: "Usa técnica de Ressonância de Ação Primária como Secundária" },
      { name: "Artesão Coringa", description: "É capaz de utilizar uma Arma Demoníaca que não seja sua" }
    ]
  },
  "maestriaMagia": {
    "C": [
      { name: "Treinamento", description: "Cria técnicas de Magia gastando -1/4 de XP" },
      { name: "Fundamento", description: "Gasta -2 de AL em técnicas de Magia (mínimo -1)" },
      { name: "Complemento", description: "Realiza UMA técnica de Magia de Rank D de Ação Secundária sem gastar ação" }
    ],
    "B": [
      { name: "Eficiente", description: "Realiza técnicas de cura de Magia com Ação Secundária" },
      { name: "Espiritual", description: "Realiza UMA técnica de Magia Rank B de Ação Secundária sem gastar ação" },
      { name: "Agressor", description: "+4 de dano com técnicas de Magia" }
    ],
    "A": [
      { name: "Miragem", description: "Adiciona sua (Viatalidade) na duração de turnos de suas técnicas SÓ DE EFEITO de Magia" },
      { name: "Alucinação", description: "+2 na Dificuldade de suas magias de ilusão se alvo foi pego na mesma magia consecutivamente" },
      { name: "Inesgotável", description: "Gasta metade do AL para técnicas de Magia de Rank B ou inferior" }
    ],
    "S": [
      { name: "Sanguessuga", description: "Rouba +2 de AL do alvo por turno sob efeito de magia que dure turnos" },
      { name: "Conjurador", description: "Realiza UMA técnica de Magia de Ação Primária como Secundária" },
      { name: "Bruxa Mãe", description: "Realiza DUAS técnicas de Magia Rank B ou inferior sem gastar ação" }
    ]
  }
};

export interface VantageDef {
  id: string;
  name: string;
  description: string;
  cost: number | 'variable';
  maxLevel?: number;
  bonuses?: {
    hp?: number;
    al?: number;
    st?: number;
    speed?: number;
    attributes?: Partial<Attributes>;
    armor?: number;
  };
  restriction?: 'artesao' | 'arma';
}

export const VANTAGES_DATA: VantageDef[] = [
  // Variáveis
  { id: 'corpo_ferro', name: 'Corpo de Ferro', description: '+4 HP por nível (1-5)', cost: 'variable', maxLevel: 5, bonuses: { hp: 4 } },
  { id: 'alma_abundante', name: 'Alma Abundante', description: '+5 AL por nível (1-5)', cost: 'variable', maxLevel: 5, bonuses: { al: 5 } },
  { id: 'energia_sobra', name: 'Energia de Sobra', description: '+5 ST por nível (1-5)', cost: 'variable', maxLevel: 5, bonuses: { st: 5 } },
  { id: 'ligeiro', name: 'Ligeiro', description: '+4 Velocidade por nível (1-3)', cost: 'variable', maxLevel: 3, bonuses: { speed: 4 } },

  // 1 Ponto
  { id: 'resistencia_mental', name: 'Resistência Mental', description: '+2 para resistir a efeitos de medo ou pânico', cost: 1 },
  { id: 'vigoroso', name: 'Vigoroso', description: 'Recebe em 1.5x do que receberia de recuperação', cost: 1 },
  { id: 'ladrao', name: 'Ladrão', description: '+2 em furtos e arrombamentos', cost: 1 },
  { id: 'noturno', name: 'Noturno', description: '+2 em Observação à noite/locais escuros', cost: 1 },
  { id: 'discreto', name: 'Discreto', description: '+2 em Furtividade fora de combate', cost: 1 },

  // 2 Pontos
  { id: 'blindado', name: 'Blindado', description: '+3 de Armadura Física ou Espiritual (Escolha Única)', cost: 2 },
  { id: 'estudioso', name: 'Estudioso', description: 'Reduz 1/4 do XP para criar técnicas e +1 em Sabedoria', cost: 2, bonuses: { attributes: { inteligencia: 0 } } },
  { id: 'resistente', name: 'Resistente', description: 'Imunidade contra qualquer veneno (Rank C ou inferior)', cost: 2 },
  { id: 'ambidestro', name: 'Ambidestro', description: '+1 ataque múltiplo básico sem técnica por turno', cost: 2 },
  { id: 'aura_inquebravel', name: 'Aura Inquebrável', description: '+2 para resistir a efeitos negativos mentais ou na alma', cost: 2 },
  { id: 'olhos_aguia', name: 'Olhos de Águia', description: '+2 em testes de Observação à distância', cost: 2 },

  // 3 Pontos
  { id: 'lutador', name: 'Lutador', description: 'Ignora 3 da Armadura do alvo com golpes físicos', cost: 3 },
  { id: 'lancador', name: 'Lançador', description: 'Usa Destreza em vez de Percepção para arremessar projéteis', cost: 3 },
  { id: 'especialista', name: 'Especialista', description: '+2 para Defender usando técnicas', cost: 3 },
  { id: 'mentalidade_forte', name: 'Mentalidade Forte', description: '+2 para resistir à Insanidade', cost: 3 },
  { id: 'briguento', name: 'Briguento', description: '+2 para atacar sem uma Arma Demoníaca', cost: 3 },
  { id: 'alma_veloz', name: 'Alma Veloz', description: 'Reduz custo de ST de técnicas de Combate em -2 sem Arma', cost: 3 },
  { id: 'sensorial', name: 'Sensorial', description: 'Desbloqueia a Percepção de Alma, e ganha +2 para esses testes', cost: 3, restriction: 'artesao' },
  { id: 'carcereiro', name: 'Carcereiro', description: 'Técnicas de aprisionamento têm dificuldade +2', cost: 3 },
  { id: 'estudioso_runico', name: 'Estudioso Rúnico', description: '+2 para entender, decifrar e confeccionar runas', cost: 3 },
  { id: 'ressonante_experiente', name: 'Ressonante Experiente', description: 'Transformar e equipar companion como ação livre', cost: 3 },

  // 4 Pontos
  { id: 'medico', name: 'Médico', description: 'Aplica o dobro de cura total com técnicas', cost: 4 },
  { id: 'arcanista', name: 'Arcanista', description: 'Escolhe causar Dano Natural com Porte ou Força', cost: 4 },
  { id: 'barbaro', name: 'Bárbaro', description: 'Ataques e técnicas de Combate com Força em vez de Destreza', cost: 4 },
  { id: 'mago', name: 'Mago', description: 'Ataques e técnicas de Magia com Inteligência em vez de Porte', cost: 4 },
  { id: 'elusivo', name: 'Elusivo', description: 'Ataques e técnicas de Ressonância com Destreza em vez de Porte', cost: 4 },

  // 5 Pontos
  { id: 'conversor', name: 'Conversor', description: 'Converte AL em ST e vice-versa livremente (Ação Secundária)', cost: 5 },
  { id: 'constante', name: 'Constante', description: 'Realiza golpes e técnicas sem Ressonância como Ação Secundária', cost: 5 },
  { id: 'inabalavel', name: 'Inabalável', description: 'Limite de morte em -50%. Não fica incapacitado com 0 HP/AL', cost: 5 },
  { id: 'sortudo', name: 'Sortudo', description: 'Dobra número de dados de contagem de turnos em técnicas', cost: 5 },
  { id: 'loucos_sabem', name: 'Só os Loucos Sabem', description: 'Anula penalidades de Insanidade e permite benefícios de Coragem Neutra', cost: 5 },
  { id: 'multiformas', name: 'Multiformas', description: 'Pode mudar de forma seguindo um tema (limite 4 formas)', cost: 5, restriction: 'arma' },

  // 6 Pontos
  { id: 'trio_ternura', name: 'Trio Ternura', description: 'Recebe um Companion Arma Demoníaca extra', cost: 6, restriction: 'artesao' },
  { id: 'nexo_almas', name: 'Nexo de Almas', description: 'Rolar usando perícia de um e atributo do outro (Vinculado)', cost: 6, restriction: 'artesao' },
  { id: 'dia_cada_vez', name: 'Um Dia de Cada Vez', description: 'Pode rolar novamente qualquer dado UMA VEZ por dia', cost: 6, restriction: 'artesao' },
  { id: 'essencia_bivalente', name: 'Essência Bivalente', description: 'Escolhe um tipo adicional de Classe de Arma', cost: 6, restriction: 'arma' },
];

export const LORE_DATA = {
  world: "O mundo de Soul Eater é um lugar onde as almas podem se tornar demoníacas. No centro deste mundo está a Shibusen, uma academia técnica para artesãos e suas armas.",
  shibusen: "A Academia Técnica de Armas e Artesãos Shinigami (Shibusen) foi fundada pelo próprio Shinigami para treinar jovens para combater o mal.",
  kishin: "Os Ovos de Kishin são almas humanas que se desviaram do caminho e começaram a consumir outras almas humanas para ganhar poder, arriscando-se a se tornar um Kishin - um deus demônio da insanidade."
};