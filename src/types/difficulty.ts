/**
 * Tipos y configuraciones globales para niveles de dificultad
 */

/**
 * Niveles de dificultad disponibles en la aplicación
 */
export type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";

/**
 * Configuración completa de cada nivel de dificultad
 */
export interface DifficultyConfig {
  minValue: number;
  maxValue: number;
  centerValue: number;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  barColor: string;
  sliderColor: string;
}

/**
 * Configuración de dificultad con rangos numéricos (0-10)
 * Rangos simétricos: 0-2.5, 2.5-5, 5-7.5, 7.5-10
 */
export const DIFFICULTY_CONFIG: Record<DifficultyLevel, DifficultyConfig> = {
  Beginner: {
    minValue: 0,
    maxValue: 2.5,
    centerValue: 1.25,
    label: "Beginner",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-300",
    barColor: "bg-emerald-500",
    sliderColor: "#10b981",
  },
  Intermediate: {
    minValue: 2.5,
    maxValue: 5,
    centerValue: 3.75,
    label: "Intermediate",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-300",
    barColor: "bg-yellow-500",
    sliderColor: "#eab308",
  },
  Advanced: {
    minValue: 5,
    maxValue: 7.5,
    centerValue: 6.25,
    label: "Advanced",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-300",
    barColor: "bg-orange-500",
    sliderColor: "#f97316",
  },
  Expert: {
    minValue: 7.5,
    maxValue: 10,
    centerValue: 8.75,
    label: "Expert",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-300",
    barColor: "bg-red-600",
    sliderColor: "#dc2626",
  },
};

/**
 * Array con todos los niveles de dificultad en orden
 */
export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
];

/**
 * Convierte un valor numérico (0-10) a un nivel de dificultad
 */
export const numberToDifficulty = (value: number): DifficultyLevel => {
  if (value < 2.5) return "Beginner";
  if (value < 5) return "Intermediate";
  if (value < 7.5) return "Advanced";
  return "Expert";
};

/**
 * Convierte un nivel de dificultad a su valor central numérico
 */
export const difficultyToNumber = (difficulty: DifficultyLevel): number => {
  return DIFFICULTY_CONFIG[difficulty].centerValue;
};

/**
 * Constantes para el rango de dificultad
 */
export const DIFFICULTY_RANGE = {
  MIN: 0,
  MAX: 10,
  STEP: 0.1,
  STEP_SMOOTH: 0.1, // Para slider arrastrable
  STEP_CLICK: 0.5, // Para clicks en la barra
} as const;

/**
 * Marcadores visuales para el slider (valores centrales de cada franja)
 */
export const DIFFICULTY_MARKERS = [
  { value: 1.25, label: "Beginner", subLabel: "0-2.5", level: "Beginner" as DifficultyLevel },
  { value: 3.75, label: "Intermediate", subLabel: "2.5-5", level: "Intermediate" as DifficultyLevel },
  { value: 6.25, label: "Advanced", subLabel: "5-7.5", level: "Advanced" as DifficultyLevel },
  { value: 8.75, label: "Expert", subLabel: "7.5-10", level: "Expert" as DifficultyLevel },
] as const;
