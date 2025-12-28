import { parseISO } from "date-fns";

export interface Holiday {
  date: Date;
  name: string;
  type: "national" | "religious";
}

// Liste des jours fériés tunisiens pour 2025
// Les dates religieuses sont approximatives et doivent être confirmées chaque année.
export const tunisianHolidays2025: Holiday[] = [
  { date: parseISO("2025-01-01"), name: "Nouvel An", type: "national" },
  { date: parseISO("2025-01-14"), name: "Fête de la Révolution et de la Jeunesse", type: "national" },
  { date: parseISO("2025-03-20"), name: "Fête de l'Indépendance", type: "national" },
  { date: parseISO("2025-03-31"), name: "Aïd el-Fitr (1er jour)", type: "religious" }, // Date approximative
  { date: parseISO("2025-04-01"), name: "Aïd el-Fitr (2ème jour)", type: "religious" }, // Date approximative
  { date: parseISO("2025-04-09"), name: "Journée des Martyrs", type: "national" },
  { date: parseISO("2025-05-01"), name: "Fête du Travail", type: "national" },
  { date: parseISO("2025-06-06"), name: "Aïd el-Idha (1er jour)", type: "religious" }, // Date approximative
  { date: parseISO("2025-06-07"), name: "Aïd el-Idha (2ème jour)", type: "religious" }, // Date approximative
  { date: parseISO("2025-06-26"), name: "Nouvel An Hégirien", type: "religious" }, // Date approximative
  { date: parseISO("2025-07-25"), name: "Fête de la République", type: "national" },
  { date: parseISO("2025-08-13"), name: "Fête Nationale de la Femme", type: "national" },
  { date: parseISO("2025-09-04"), name: "Mouled", type: "religious" }, // Date approximative
  { date: parseISO("2025-10-15"), name: "Fête de l'Évacuation", type: "national" },
];