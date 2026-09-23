/** 烹饪领域的共享类型，供静态数据、计算层、状态层和页面共同使用。 */

/** 决定操作兼容性和默认属性的食材烹饪大类。 */
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

/** 最终料理使用的十四个感官维度。 */
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

/** 用于触发糖化、蛋白质与油脂反应的物理特征。 */
export type TraitId = 'protein' | 'fat' | 'water' | 'sugar' | 'starch'

/** 可只填写有贡献项目的通用数值映射。 */
export type ScoreMap<K extends string = string> = Partial<Record<K, number>>

/** 一种可投入加工的基础食材。 */
export interface Ingredient {
  name: string
  group: string
  profile: ProfileId
}

/** 选择器中的食材展示分组。 */
export interface IngredientGroup {
  label: string
  profile: ProfileId
  names: string[]
}

/** 执行后直接产生固定外观、不记录进度的操作。 */
export interface InstantOperation {
  label: string
  kind: 'instant'
  profiles: ProfileId[]
  appearance: string
}

/** 根据 0/4 至 4/4 进度解析结果的操作。 */
export interface ProgressiveOperation {
  label: string
  kind: 'progressive'
  profiles: ProfileId[]
}

/** 所有操作定义的联合类型。 */
export type Operation = InstantOperation | ProgressiveOperation

/** 一个渐进式操作的五档描述及按食材大类设置的覆盖。 */
export interface ProgressModel {
  axis: string
  default: [string, string, string, string, string]
  overrides?: Partial<Record<ProfileId, [string, string, string, string, string]>>
}

/** 厨具、可执行操作以及其菜系贡献。 */
export interface Tool {
  id: string
  name: string
  operationIds: string[]
  cuisine: ScoreMap
}

/** 一次已执行加工事件在产物历史中的不可变记录。 */
export interface CookingStep {
  toolId: string
  operationId: string
  levelsByName: Record<string, number | null>
  activeNames: string[]
  appearancesByName: Record<string, string>
}

/** 可继续投入加工的产物，包含组成、完整历史和当前感官值。 */
export interface ProcessedItem {
  id: number
  title: string
  ingredients: Ingredient[]
  history: CookingStep[]
  sensory: Record<SenseId, number>
}

/** 尚未执行的批次投入，可以来自基础食材或已有产物。 */
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

/** 排序后的单项菜系总分。 */
export interface CuisineScore {
  name: string
  score: number
}

/** 一个来源对若干感官维度造成的增减。 */
export interface SensoryContribution {
  source: string
  scores: ScoreMap<SenseId>
}

/** 单个已处理食材从贡献项到限制后结果的完整计算。 */
export interface SensoryCalculation {
  contributions: SensoryContribution[]
  beforeClamp: Record<SenseId, number>
  result: Record<SenseId, number>
}

/** 全部产物汇总、限制和血味遮盖后的整菜感官计算。 */
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

/** 一个食材或厨具对菜系倾向造成的增量。 */
export interface CuisineContribution {
  source: string
  scores: ScoreMap
}

/** 单个已处理食材组内的全部菜系贡献来源。 */
export interface ItemCuisineCalculation {
  itemId: number
  title: string
  contributions: CuisineContribution[]
}

/** 所有食材组的菜系贡献和最终排序结果。 */
export interface CuisineCalculation {
  items: ItemCuisineCalculation[]
  result: CuisineScore[]
}
