import { GuestType } from '../shared/schemas/guest.schema';

export interface GuestSeed {
  id: string;
  name: string;
  phone: string | null;
  type: GuestType;
  groupKey: string;
  groupName: string;
}

export const GUESTS_SEED: GuestSeed[] = [
  { id: 'elizabeth-maury', name: 'Elizabeth Maury', phone: '3005775845', type: 'familia', groupKey: 'familia-1', groupName: 'Grupo 1' },
  { id: 'valdejuli-varela', name: 'Valdejuli Varela', phone: '3242462210', type: 'familia', groupKey: 'familia-1', groupName: 'Grupo 1' },

  { id: 'leonardo-varela', name: 'Leonardo Varela', phone: '3158600703', type: 'familia', groupKey: 'familia-2', groupName: 'Grupo 2' },
  { id: 'silvana-perez', name: 'Silvana Pérez', phone: '3013095020', type: 'familia', groupKey: 'familia-2', groupName: 'Grupo 2' },

  { id: 'melany-varela', name: 'Melany Varela', phone: '3014559727', type: 'familia', groupKey: 'familia-3', groupName: 'Grupo 3' },
  { id: 'rix-varela-y-juanma', name: 'Rix Varela Y Juanma', phone: '3007907453', type: 'familia', groupKey: 'familia-3', groupName: 'Grupo 3' },

  { id: 'ruben-gomez', name: 'Rubén Gómez', phone: '3128994670', type: 'familia', groupKey: 'familia-4', groupName: 'Grupo 4' },
  { id: 'keren', name: 'Keren', phone: '3225369150', type: 'familia', groupKey: 'familia-4', groupName: 'Grupo 4' },

  { id: 'jonathan-gomez', name: 'Jonathan Gómez', phone: '3028307242', type: 'familia', groupKey: 'familia-5', groupName: 'Grupo 5' },
  { id: 'gledis-calderon', name: 'Gledis Calderón', phone: '3247396030', type: 'familia', groupKey: 'familia-5', groupName: 'Grupo 5' },

  { id: 'miriam-calderon', name: 'Miriam Calderón', phone: '3145074158', type: 'familia', groupKey: 'familia-6', groupName: 'Grupo 6' },
  { id: 'marbel', name: 'Marbel', phone: '3332523515', type: 'familia', groupKey: 'familia-6', groupName: 'Grupo 6' },
  { id: 'juan-sebastian', name: 'Juan Sebastián', phone: '3011206727', type: 'familia', groupKey: 'familia-6', groupName: 'Grupo 6' },
  { id: 'daniela-navarro', name: 'Daniela Navarro', phone: '3052406899', type: 'familia', groupKey: 'familia-6', groupName: 'Grupo 6' },

  { id: 'tia-edith', name: 'Tía Edith', phone: '3209744256', type: 'familia', groupKey: 'familia-7', groupName: 'Grupo 7' },
  { id: 'nelfy', name: 'Nelfy', phone: '3014371727', type: 'familia', groupKey: 'familia-7', groupName: 'Grupo 7' },

  { id: 'millo', name: 'Millo', phone: '3127321118', type: 'familia', groupKey: 'familia-8', groupName: 'Grupo 8' },
  { id: 'william-rangel', name: 'William Rangel', phone: null, type: 'familia', groupKey: 'familia-8', groupName: 'Grupo 8' },
  { id: 'matthias-rangel', name: 'Matthias Rangel', phone: null, type: 'familia', groupKey: 'familia-8', groupName: 'Grupo 8' },

  { id: 'marlene-varela', name: 'Marlene Varela', phone: '3004422670', type: 'familia', groupKey: 'familia-9', groupName: 'Grupo 9' },
  { id: 'elith-varela', name: 'Elith Varela', phone: '3015376598', type: 'familia', groupKey: 'familia-9', groupName: 'Grupo 9' },

  { id: 'nay-reales', name: 'Nay Reales', phone: '3152520201', type: 'amigos', groupKey: 'amigos-1', groupName: 'Grupo 1' },
  { id: 'el-esposo-nay', name: 'El esposo', phone: null, type: 'amigos', groupKey: 'amigos-1', groupName: 'Grupo 1' },

  { id: 'kristell-uribe', name: 'Kristell Uribe', phone: '3013611953', type: 'amigos', groupKey: 'amigos-sola-kristell-uribe', groupName: 'Persona sola' },

  { id: 'isa-arteaga', name: 'Isa Arteaga', phone: '3012910120', type: 'amigos', groupKey: 'amigos-2', groupName: 'Grupo 2' },
  { id: 'aidita', name: 'Aidita', phone: '3205578787', type: 'amigos', groupKey: 'amigos-2', groupName: 'Grupo 2' },
  { id: 'la-nina', name: 'la niña', phone: null, type: 'amigos', groupKey: 'amigos-2', groupName: 'Grupo 2' },

  { id: 'edith-yadira', name: 'Edith Yadira', phone: '3115787880', type: 'amigos', groupKey: 'amigos-3', groupName: 'Grupo 3' },
  { id: 'edinson', name: 'Edinson', phone: '3022182258', type: 'amigos', groupKey: 'amigos-3', groupName: 'Grupo 3' },

  { id: 'angelica', name: 'Angelica', phone: '3042015656', type: 'amigos', groupKey: 'amigos-sola-angelica', groupName: 'Persona sola' },

  { id: 'julieth', name: 'Julieth', phone: '3104846036', type: 'amigos', groupKey: 'amigos-4', groupName: 'Grupo 4' },
  { id: 'farit', name: 'Farit', phone: '3104846036', type: 'amigos', groupKey: 'amigos-4', groupName: 'Grupo 4' },

  { id: 'emir-llerena', name: 'Emir Llerena', phone: '3227191260', type: 'amigos', groupKey: 'amigos-sola-emir-llerena', groupName: 'Persona sola' },

  { id: 'adriana-camacho', name: 'Adriana Camacho', phone: '3004245176', type: 'amigos', groupKey: 'amigos-5', groupName: 'Grupo 5' },

  { id: 'alison-almanza', name: 'Alison Almanza', phone: '3022998557', type: 'amigos', groupKey: 'amigos-sola-alison-almanza', groupName: 'Persona sola' },

  { id: 'frank-perez', name: 'Frank Pérez', phone: '3183650610', type: 'amigos', groupKey: 'amigos-7', groupName: 'Grupo 7' },
  { id: 'sofia', name: 'Sofia', phone: '3183650610', type: 'amigos', groupKey: 'amigos-7', groupName: 'Grupo 7' },

  { id: 'dina-charris', name: 'Dina Charris', phone: '3017467406', type: 'amigos', groupKey: 'amigos-8', groupName: 'Grupo 8' },
  { id: 'esposo-dina', name: 'Esposo', phone: '3017467406', type: 'amigos', groupKey: 'amigos-8', groupName: 'Grupo 8' },

  { id: 'jesus-torres', name: 'Jesús Torres', phone: '3112744200', type: 'amigos', groupKey: 'amigos-sola-jesus-torres', groupName: 'Persona sola' },
  { id: 'janina-charris', name: 'Janina Charris', phone: '3012474978', type: 'amigos', groupKey: 'amigos-sola-janina-charris', groupName: 'Persona sola' },
  { id: 'melissa-david', name: 'Melissa David', phone: '3017544802', type: 'amigos', groupKey: 'amigos-sola-melissa-david', groupName: 'Persona sola' },
  { id: 'maria-fernanda-molinares', name: 'María Fernanda Molinares', phone: '3004219520', type: 'amigos', groupKey: 'amigos-sola-maria-fernanda-molinares', groupName: 'Persona sola' },
];
