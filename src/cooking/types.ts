export type ProfileId =
  | 'red_meat'
  | 'poultry'
  | 'fish'
  | 'shellfish'
  | 'egg'
  | 'firm_vegetable'
  | 'leafy_vegetable'
  | 'grain_noodle'
  | 'legume'
  | 'dough'
  | 'dairy'
  | 'fruit'
  | 'aromatic'
  | 'spice'
  | 'nut_seed'
  | 'liquid'
  | 'fat'
  | 'seasoning'

export type SenseId =
  | 'salty'
  | 'sweet'
  | 'sour'
  | 'umami'
  | 'spicy'
  | 'pungent'
  | 'aromatic'
  | 'roasted'
  | 'smoky'
  | 'bloody'
  | 'moist'
  | 'dry'
  | 'crisp'
  | 'rich'

export type TraitId = 'protein' | 'fat' | 'water' | 'sugar' | 'starch'
export type ScoreMap<K extends string = string> = Partial<Record<K, number>>

export interface Ingredient {
  name: string
  group: string
  profile: ProfileId
}

export interface IngredientGroup {
  label: string
  profile: ProfileId
  names: string[]
}

export interface InstantOperation {
  label: string
  kind: 'instant'
  profiles: ProfileId[]
  appearance: string
}

export interface ProgressiveOperation {
  label: string
  kind: 'progressive'
  profiles: ProfileId[]
}

export type Operation = InstantOperation | ProgressiveOperation

export interface ProgressModel {
  axis: string
  default: [string, string, string, string, string]
  overrides?: Partial<Record<ProfileId, [string, string, string, string, string]>>
}

export interface Tool {
  id: string
  name: string
  operationIds: string[]
  cuisine: ScoreMap
}

export interface CookingStep {
  toolId: string
  operationId: string
  levelsByName: Record<string, number | null>
  activeNames: string[]
  appearancesByName: Record<string, string>
}

export interface ProcessedItem {
  id: number
  title: string
  ingredients: Ingredient[]
  history: CookingStep[]
  sensory: Record<SenseId, number>
}

export interface BatchInput {
  kind: 'raw' | 'item'
  key: string
  label: string
  profile: ProfileId
  ingredients: Ingredient[]
  history: CookingStep[]
  itemId?: number
  level: number | null
}

export interface CuisineScore {
  name: string
  score: number
}

export interface SensoryContribution {
  source: string
  scores: ScoreMap<SenseId>
}

export interface SensoryCalculation {
  contributions: SensoryContribution[]
  beforeClamp: Record<SenseId, number>
  result: Record<SenseId, number>
}

export interface DishSensoryCalculation {
  itemContributions: Array<{
    itemId: number
    title: string
    scores: Record<SenseId, number>
  }>
  summed: Record<SenseId, number>
  clamped: Record<SenseId, number>
  bloodyMask: number
  result: Record<SenseId, number>
}

export interface CuisineContribution {
  source: string
  scores: ScoreMap
}

export interface ItemCuisineCalculation {
  itemId: number
  title: string
  contributions: CuisineContribution[]
}

export interface CuisineCalculation {
  items: ItemCuisineCalculation[]
  result: CuisineScore[]
}
