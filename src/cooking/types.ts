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

/** 用于判断操作兼容性的基础物理特征。 */
export type TraitId = 'protein' | 'fat' | 'water' | 'sugar' | 'starch'

/** 产物在最终成品中的主要结构与摆盘功能。 */
export type PlatingRoleId = 'base' | 'main' | 'covering' | 'side' | 'sauce' | 'garnish'

/** 可只填写有贡献项目的通用数值映射。 */
export type ScoreMap<K extends string = string> = Partial<Record<K, number>>

/** 一种可投入加工的基础食材。 */
export interface Ingredient {
  name: string
  profile: ProfileId
}

/** 同一烹饪大类下供选择器展示的食材名称。 */
export interface IngredientGroup {
  profile: ProfileId
  names: string[]
}

/** operation 对整个批次提出的一项必要组成条件。 */
export type OperationRequirement =
  | { kind: 'profile', profiles: ProfileId[], label: string }
  | { kind: 'trait', trait: TraitId, minimum: number, label: string }

/** operation 共有的主体、辅助投入和批次要求。 */
interface OperationCompatibility {
  label: string
  profiles: ProfileId[]
  targetTraits?: TraitId[]
  supportProfiles?: ProfileId[]
  requirements?: OperationRequirement[]
}

/** 执行后立即完成、不记录加工程度的操作。 */
export interface InstantOperation extends OperationCompatibility {
  kind: 'instant'
}

/** 具有五档加工程度，并按湿热或干热分类的操作。 */
export interface ProgressiveOperation extends OperationCompatibility {
  kind: 'progressive'
  heat: 'wet' | 'dry'
}

export type Operation = InstantOperation | ProgressiveOperation

/** 厨具、可执行操作以及其菜系贡献。 */
export interface Tool {
  id: string
  name: string
  operationIds: string[]
  cuisine: ScoreMap
}

/** 一次已执行加工事件在产物历史中的不可变事实。 */
export interface CookingStep {
  toolId: string
  operationId: string
  levelsByName: Record<string, number | null>
  activeNames: string[]
}

/** 可继续投入加工的产物。提示标签和菜系均由组成与历史实时派生。 */
export interface ProcessedItem {
  id: number
  title: string
  ingredients: Ingredient[]
  history: CookingStep[]
  platingRole: PlatingRoleId | null
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

/** 面向模型的三个产物级粗粒度提示标签。 */
export interface ProcessingTags {
  doneness: string
  surface: string
  moisture: string
}

/** 排序后的单项菜系总分。 */
export interface CuisineScore {
  name: string
  score: number
}

/** 一个食材或厨具对菜系倾向造成的增量。 */
export interface CuisineContribution {
  source: string
  scores: ScoreMap
}

/** 单个产物下首次出现的菜系贡献来源。 */
export interface ItemCuisineCalculation {
  itemId: number
  title: string
  contributions: CuisineContribution[]
}

/** 所有产物的菜系贡献和最终排序结果。 */
export interface CuisineCalculation {
  items: ItemCuisineCalculation[]
  result: CuisineScore[]
}
