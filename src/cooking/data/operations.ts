/** 操作目录：只定义操作名称、兼容范围、必要条件和热加工类型。 */
import type {
  InstantOperation,
  Operation,
  OperationRequirement,
  ProfileId,
  ProgressiveOperation,
  TraitId,
} from '../types'
import { profileLabels } from './catalog'

const allProfiles = Object.keys(profileLabels) as ProfileId[]
const solidProfiles = allProfiles.filter((profile) => !['liquid', 'fat', 'seasoning'].includes(profile))
const cuttableProfiles = solidProfiles.filter((profile) => !['spice', 'grain_noodle'].includes(profile))
const heatedFoodProfiles = allProfiles.filter((profile) => !['liquid', 'fat', 'seasoning', 'spice'].includes(profile))
const marinatableProfiles: ProfileId[] = ['red_meat', 'poultry', 'fish', 'shellfish', 'egg', 'firm_vegetable', 'leafy_vegetable', 'legume', 'fruit']
const brushableProfiles = heatedFoodProfiles

const liquidRequirement: OperationRequirement = {
  kind: 'profile', profiles: ['liquid'], label: '需要水或其他液体',
}
const fatRequirement: OperationRequirement = {
  kind: 'profile', profiles: ['fat'], label: '需要烹饪油脂',
}
const sugarRequirement: OperationRequirement = {
  kind: 'trait', trait: 'sugar', minimum: 1, label: '需要含糖成分',
}
const marinadeRequirement: OperationRequirement = {
  kind: 'profile', profiles: ['seasoning', 'spice'], label: '需要调味料或香辛料',
}
const sauceRequirement: OperationRequirement = {
  kind: 'profile', profiles: ['seasoning'], label: '需要酱料或其他调味料',
}

/**
 * 创建执行后立即完成、没有加工程度的 operation。
 *
 * @param label 选择器、历史记录和提示词中使用的操作名称。
 * @param profiles 可以作为实际加工主体的食材大类；批次至少要包含一个主体。
 * @param supportProfiles 可以随主体加入批次、但不作为该操作主体的辅助食材大类。
 * @param requirements 整个批次必须满足的组成条件；存在多项时需要全部满足。
 */
function instant(
  label: string,
  profiles: ProfileId[],
  supportProfiles: ProfileId[] = [],
  requirements: OperationRequirement[] = [],
): InstantOperation {
  return { label, kind: 'instant', profiles, supportProfiles, requirements }
}

/**
 * 创建具有五档中性程度的湿热或干热 operation。
 *
 * @param label 选择器、历史记录和提示词中使用的操作名称。
 * @param heat 用于派生产物表面程度和含水倾向的湿热或干热分类。
 * @param profiles 可以作为实际加工主体的食材大类；批次至少要包含一个主体。
 * @param supportProfiles 可以随主体加入批次、但不作为该操作主体的辅助食材大类。
 * @param requirements 整个批次必须满足的组成条件；存在多项时需要全部满足。
 * @param targetTraits 除 profiles 外也可成为加工主体的物理特征，例如糖分可作为焦糖化主体。
 */
function progressive(
  label: string,
  heat: ProgressiveOperation['heat'],
  profiles: ProfileId[],
  supportProfiles: ProfileId[] = [],
  requirements: OperationRequirement[] = [],
  targetTraits: TraitId[] = [],
): ProgressiveOperation {
  return { label, kind: 'progressive', heat, profiles, targetTraits, supportProfiles, requirements }
}

export const operations: Record<string, Operation> = {
  halved: instant('对半', cuttableProfiles),
  sliced: instant('切片', cuttableProfiles),
  strips: instant('切丝 / 条', cuttableProfiles),
  diced: instant('切丁', cuttableProfiles),
  chunks: instant('切块', cuttableProfiles),
  minced: instant('剁碎', cuttableProfiles),
  grated: instant('擦碎', ['firm_vegetable', 'dairy', 'fruit']),
  flattened: instant('压扁', ['dough']),
  rolled: instant('擀薄', ['dough']),
  crushed: instant('压碎', ['spice', 'nut_seed', 'aromatic', 'firm_vegetable']),
  ground: instant('研磨', ['spice', 'nut_seed']),
  paste: instant('捣成泥', ['spice', 'nut_seed', 'aromatic', 'firm_vegetable', 'fruit']),
  mixed: instant('混合', allProfiles),
  whipped: instant('打发', ['egg', 'dairy', 'seasoning', 'spice', 'aromatic', 'fat', 'liquid']),
  marinated: instant('腌制', marinatableProfiles, ['seasoning', 'spice', 'aromatic', 'fat', 'liquid', 'dairy'], [marinadeRequirement]),
  boiled: progressive('煮 / 汆煮', 'wet', heatedFoodProfiles, ['liquid', 'seasoning', 'spice', 'fat'], [liquidRequirement]),
  braised: progressive('炖 / 焖', 'wet', ['red_meat', 'poultry', 'fish', 'firm_vegetable', 'legume', 'aromatic'], ['seasoning', 'spice', 'fat', 'liquid'], [liquidRequirement]),
  steamed: progressive('蒸', 'wet', heatedFoodProfiles, ['seasoning', 'spice', 'fat', 'liquid']),
  pan_fried: progressive('煎 / 烙', 'dry', ['red_meat', 'poultry', 'fish', 'shellfish', 'egg', 'firm_vegetable', 'leafy_vegetable', 'grain_noodle', 'legume', 'dough', 'aromatic'], ['seasoning', 'spice', 'fat', 'liquid']),
  caramelized: progressive('焦糖化', 'dry', ['firm_vegetable', 'fruit', 'aromatic'], ['seasoning', 'spice', 'fat', 'liquid'], [sugarRequirement], ['sugar']),
  toasted: progressive('烘香', 'dry', ['grain_noodle', 'dough', 'spice', 'nut_seed', 'aromatic'], ['seasoning', 'fat']),
  stir_fried: progressive('炒', 'dry', ['red_meat', 'poultry', 'fish', 'shellfish', 'egg', 'firm_vegetable', 'leafy_vegetable', 'grain_noodle', 'legume', 'aromatic', 'spice'], ['seasoning', 'fat', 'liquid']),
  baked: progressive('烤制 / 烘焙', 'dry', ['red_meat', 'poultry', 'fish', 'firm_vegetable', 'fruit', 'nut_seed', 'spice', 'aromatic', 'dough', 'egg', 'dairy'], ['seasoning', 'fat', 'liquid']),
  grilled: progressive('烧烤 / 炙烤', 'dry', ['red_meat', 'poultry', 'fish', 'shellfish', 'firm_vegetable', 'fruit', 'dough', 'aromatic'], ['seasoning', 'spice', 'fat']),
  deep_fried: progressive('油炸', 'dry', ['red_meat', 'poultry', 'fish', 'shellfish', 'egg', 'firm_vegetable', 'grain_noodle', 'legume', 'dough', 'aromatic'], ['seasoning', 'spice', 'fat'], [fatRequirement]),
  drained: instant('沥干', ['red_meat', 'poultry', 'fish', 'shellfish', 'egg', 'firm_vegetable', 'leafy_vegetable', 'grain_noodle', 'legume']),
  skewered: instant('穿串', ['red_meat', 'poultry', 'fish', 'shellfish', 'firm_vegetable', 'fruit', 'dough']),
  shaped: instant('压制成型', ['dough', 'grain_noodle', 'legume', 'seasoning', 'spice', 'aromatic', 'fat', 'liquid']),
  oiled: instant('刷油', brushableProfiles, ['fat']),
  sauced: instant('刷酱 / 挂汁', brushableProfiles, ['seasoning', 'spice', 'fat', 'liquid'], [sauceRequirement]),
}
