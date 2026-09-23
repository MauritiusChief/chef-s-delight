/** 跨操作的食材、批次和整菜反应数值配置。 */
import type {
  BatchReaction,
  IngredientReaction,
  ProfileReaction,
  SensoryMaskRule,
  TraitReaction,
} from '../types'

/** 会触发糖分褐化和油脂蛋白质反应的干热操作。 */
const dryHeatOperationIds = [
  'pan_fried',
  'stir_fried',
  'baked',
  'grilled',
  'deep_fried',
  'toasted',
  'caramelized',
]

/** 食材大类在所有渐进式加工中共有的反应。 */
export const profileReactions: ProfileReaction[] = [
  {
    label: '肉类受热降低血味感知',
    profiles: ['red_meat', 'poultry', 'fish', 'shellfish'],
    effects: { bloody: [0, -1, -4, -5, -5] },
  },
]

/** 特定食材在所有渐进式加工中共有的反应。 */
export const ingredientReactions: IngredientReaction[] = [
  {
    label: '葱姜类受热变化',
    ingredients: ['大蒜', '姜'],
    effects: {
      pungent: [0, -1, -2, -2, -2],
      aromatic: [0, 1, 2, 3, 3],
    },
  },
]

/** 由食材物理特征和操作共同触发的逐食材反应。 */
export const traitReactions: TraitReaction[] = [
  {
    label: '糖分干热褐化',
    trait: 'sugar',
    operationIds: dryHeatOperationIds,
    effects: {
      sweet: [0, 0, 1, 1, 1],
      roasted: [0, 0, 1, 2, 2],
    },
  },
]

/** 需要检查整个加工批次组成的反应。 */
export const batchReactions: BatchReaction[] = [
  {
    label: '油脂与蛋白质批次反应',
    operationIds: dryHeatOperationIds,
    requiredTraits: ['fat', 'protein'],
    levelTrait: 'protein',
    minimumLevel: 2,
    sense: 'roasted',
    levelOffset: 1,
    maximumBonus: 3,
  },
]

/** 所有产物汇总后应用的感官遮盖规则。 */
export const dishMaskRules: SensoryMaskRule[] = [
  {
    target: 'bloody',
    weights: {
      pungent: 0.3,
      spicy: 0.2,
      sour: 0.4,
      aromatic: 0.2,
    },
  },
]
