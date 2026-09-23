/** 操作目录：每个操作在同一处定义类型、兼容范围和结果描述。 */
import type {
  InstantOperation,
  Operation,
  OperationRequirement,
  ProfileId,
  ProgressiveDescription,
  ProgressiveOperation,
  SensoryEffectRule,
} from '../types'
import { profileLabels } from './catalog'

const allProfiles = Object.keys(profileLabels) as ProfileId[]
const solidProfiles = allProfiles.filter((profile) => !['liquid', 'fat', 'seasoning'].includes(profile))
const cuttableProfiles = solidProfiles.filter((profile) => !['spice', 'grain_noodle'].includes(profile))
const heatedFoodProfiles = allProfiles.filter((profile) => !['liquid', 'fat', 'seasoning', 'spice'].includes(profile))
const dryableProfiles = allProfiles.filter((profile) => !['liquid', 'fat', 'seasoning'].includes(profile))
const crispableProfiles = allProfiles.filter((profile) => !['liquid', 'fat', 'seasoning', 'spice'].includes(profile))
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

/** 湿热操作共有的含水变化。 */
const wetHeatEffects: SensoryEffectRule[] = [{
  label: '湿热变化',
  profiles: heatedFoodProfiles,
  effects: { moist: [0, 1, 2, 3, 3], dry: [0, 0, 0, 0, 1] },
}]

/** 干热操作共有的失水和焦香变化。 */
const dryHeatEffects: SensoryEffectRule[] = [{
  label: '干热变化',
  profiles: dryableProfiles,
  effects: { moist: [0, 0, -1, -2, -3], dry: [0, 0, 0, 1, 3], roasted: [0, 1, 2, 3, 4] },
}]

/** 煎、烤、烘焙和烙制共有的表面酥化变化。 */
const brownedSurfaceEffects: SensoryEffectRule[] = [{
  label: '表面酥化',
  profiles: crispableProfiles,
  effects: { crisp: [0, 0, 1, 2, 3] },
}]

/**
 * 创建执行后立即完成、没有加工进度的 operation。
 *
 * @param label 选择器、历史记录和提示词中使用的操作名称。
 * @param profiles 可以作为实际加工主体的食材大类；批次至少要包含一个主体。
 * @param description 应用于主体食材的加工结果描述，辅助投入不会使用此描述。
 * @param supportProfiles 可以随主体加入批次、但不接受操作效果的辅助食材大类；允许加入不代表必须加入。
 * @param requirements 整个批次必须满足的组成条件；存在多项时需要全部满足。
 */
function instant(
  label: string,
  profiles: ProfileId[],
  description: string,
  supportProfiles: ProfileId[] = [],
  requirements: OperationRequirement[] = [],
): InstantOperation {
  return { label, kind: 'instant', profiles, supportProfiles, requirements, description }
}

/**
 * 创建具有 0/4 至 4/4 加工进度的 operation。
 *
 * @param label 选择器、历史记录和提示词中使用的操作名称。
 * @param profiles 可以作为实际加工主体的食材大类；批次至少要包含一个主体。
 * @param description 五档通用外观描述及可选的食材大类专属描述。
 * @param effects 感官变化规则；每条规则只作用于其 `profiles` 声明的大类。
 * @param supportProfiles 可以随主体加入批次、但不接受主体描述或操作效果的辅助大类；允许加入不代表必须加入。
 * @param requirements 整个批次必须满足的组成条件；存在多项时需要全部满足。
 * @param targetTraits 除 `profiles` 外也可成为加工主体的物理特征，例如让糖作为焦糖化主体。
 */
function progressive(
  label: string,
  profiles: ProfileId[],
  description: ProgressiveDescription,
  effects: SensoryEffectRule[],
  supportProfiles: ProfileId[] = [],
  requirements: OperationRequirement[] = [],
  targetTraits: ProgressiveOperation['targetTraits'] = [],
): ProgressiveOperation {
  return { label, kind: 'progressive', profiles, targetTraits, supportProfiles, requirements, description, effects }
}

/** 全部操作的唯一数据源。 */
export const operations: Record<string, Operation> = {
  halved: instant('对半', cuttableProfiles, '切成大小相近的两半'),
  sliced: instant('切片', cuttableProfiles, '切成厚薄均匀的片'),
  strips: instant('切丝 / 条', cuttableProfiles, '切成细长均匀的丝或条'),
  diced: instant('切丁', cuttableProfiles, '切成大小均匀的丁'),
  chunks: instant('切块', cuttableProfiles, '切成大小相近的块'),
  minced: instant('剁碎', cuttableProfiles, '细密剁碎'),
  grated: instant('擦碎', ['firm_vegetable', 'dairy', 'fruit'], '擦成细碎均匀的丝屑'),
  flattened: instant('压扁', ['dough'], '压成均匀扁平形状'),
  rolled: instant('擀薄', ['dough'], '擀成薄而均匀的面片'),
  crushed: instant('压碎', ['spice', 'nut_seed', 'aromatic', 'firm_vegetable'], '压成粗细不一的碎粒'),
  ground: instant('研磨', ['spice', 'nut_seed'], '研磨成细颗粒或粉末'),
  paste: instant('捣成泥', ['spice', 'nut_seed', 'aromatic', 'firm_vegetable', 'fruit'], '捣成具有细腻质感的泥或酱'),
  mixed: instant('混合', allProfiles, '与其他成分均匀混合'),
  whipped: instant('打发', ['egg', 'dairy', 'seasoning', 'spice', 'aromatic', 'fat', 'liquid'], '打发至蓬松并充满细小气泡'),
  marinated: instant('腌制', marinatableProfiles, '与腌料充分拌匀并腌制入味', ['seasoning', 'spice', 'aromatic', 'fat', 'liquid', 'dairy'], [marinadeRequirement]),

  boiled: progressive('煮 / 汆煮', heatedFoodProfiles, {
    levels: ['生鲜，保持原始结构', '表层开始受热，内部仍接近生鲜状态', '已经煮熟，整体结构完整', '充分软化，结构开始松散', '经过长时间煮制，结构明显分解'],
    byProfile: {
      red_meat: ['生肉状态，内部颜色鲜明且纤维紧实', '外层变色，内部仍保持生肉质感', '完全熟透，肉纤维完整', '肉质柔软，纤维容易分离', '肉纤维松散，部分碎裂'],
      poultry: ['生禽肉，肉质略显半透明', '外层变白，内部仍呈生肉质感', '完全熟透，纤维完整且保有水分', '肉质柔软，纤维容易分离', '肉纤维松散，部分碎裂'],
      fish: ['生鱼肉，表面湿润且略透明', '外层开始变得不透明，中心仍接近生鲜', '鱼肉熟透，保持完整分层', '鱼肉柔软，层片容易分开', '鱼肉明显松散，部分碎开'],
      shellfish: ['生鲜，颜色浅且组织柔软', '颜色开始变化，内部仍接近生鲜', '已经熟透，质地紧实有弹性', '继续受热后收缩，弹性减弱', '明显收缩，质地偏硬或松散'],
      egg: ['蛋白与蛋黄均保持液态', '蛋白边缘开始凝固，蛋黄仍为液态', '蛋白完全凝固，蛋黄形成柔软固态', '蛋白紧实，蛋黄完全凝固', '整体质地紧实偏干'],
      firm_vegetable: ['生鲜，颜色与结构完整', '略微受热，仍保持明显脆度', '已经熟透，颜色鲜明且保有结构', '明显软化，颜色开始变化', '结构松散，容易压碎'],
      leafy_vegetable: ['叶片生鲜舒展', '叶片开始萎蔫，颜色仍鲜明', '叶片熟软，保留一定形状', '叶片明显软塌并释放水分', '叶片深度软化，结构细碎'],
      grain_noodle: ['干硬或生面状态', '开始吸水，中心仍硬', '已经煮熟，保持弹性', '质地偏软，弹性减弱', '充分吸水，质地软烂'],
      legume: ['质地坚实，保持原始形态', '开始吸水，中心仍偏硬', '已经熟透，内部柔软', '充分软化，容易压碎', '表皮开裂，部分形成泥状'],
    },
  }, wetHeatEffects, ['liquid', 'seasoning', 'spice', 'fat'], [liquidRequirement]),
  braised: progressive('炖 / 焖', ['red_meat', 'poultry', 'fish', 'firm_vegetable', 'legume', 'aromatic'], {
    levels: ['原料保持生鲜状态', '表面受热，开始接触调味液', '已经熟透，外层附着汤汁', '充分软化，颜色加深并吸收汤汁', '结构非常松散，浓稠汤汁深入主体'],
    byProfile: {
      red_meat: ['生肉状态，纤维紧实', '表面开始变色，内部仍接近生鲜', '肉已熟透，表面附着汤汁', '肉质软烂，纤维容易分离', '肉质极为松散，浓稠汤汁深入纤维'],
      firm_vegetable: ['结构生硬，颜色自然', '外层开始受热并沾染汤汁', '熟透且保持块状结构', '充分软化，颜色加深', '结构开始崩解，表面覆盖浓稠汤汁'],
    },
  }, wetHeatEffects, ['seasoning', 'spice', 'fat', 'liquid'], [liquidRequirement]),
  steamed: progressive('蒸', heatedFoodProfiles, {
    levels: ['保持生鲜状态', '表层受热，内部仍接近生鲜', '已经蒸熟，质地湿润且结构完整', '充分蒸软，结构开始松弛', '长时间蒸制，质地非常柔软或偏湿'],
    byProfile: {
      fish: ['鱼肉生鲜且略透明', '表层转为不透明，中心仍接近生鲜', '鱼肉蒸熟，柔嫩湿润且分层完整', '鱼肉非常柔软，层片容易分开', '鱼肉结构松散，水分明显流失'],
      firm_vegetable: ['生鲜且结构坚实', '略微软化，仍保持脆度', '蒸熟且保有形状与鲜明颜色', '质地柔软，颜色开始变化', '结构松散，容易压碎'],
      dough: ['面团保持生坯状态', '外层开始定型，内部仍黏软', '完全蒸熟，内部柔软且结构稳定', '含水充分，质地更柔软', '过度吸收蒸汽，表面湿软且结构松弛'],
    },
  }, wetHeatEffects, ['seasoning', 'spice', 'fat', 'liquid']),
  pan_fried: progressive('煎 / 烙', ['red_meat', 'poultry', 'fish', 'shellfish', 'egg', 'firm_vegetable', 'leafy_vegetable', 'grain_noodle', 'legume', 'dough', 'aromatic'], {
    levels: ['保持生鲜状态，表面没有煎制痕迹', '表面开始定型并轻微上色', '表面均匀褐化，内部已经熟化', '表面颜色较深，内部进一步失水', '表面深度褐化或焦黑，整体明显失水'],
    byProfile: {
      red_meat: ['生肉状态，表面湿润', '表面轻微上色，内部仍保持明显生肉状态', '表面形成褐色煎痕，内部已经熟化', '外层深度褐化，内部汁水减少', '表面焦黑，肉质明显紧缩偏干'],
      egg: ['蛋白与蛋黄均为液态', '蛋白边缘凝固，蛋黄仍流动', '蛋白完全凝固并轻微焦边，蛋黄柔软', '蛋白焦边明显，蛋黄基本凝固', '蛋白深度焦化，蛋黄完全凝固偏干'],
      firm_vegetable: ['生鲜且表面湿润', '表面轻微上色，内部仍脆', '表面褐化，内部熟而保有结构', '焦边明显，内部柔软', '表面焦黑，内部明显失水'],
    },
  }, [...dryHeatEffects, ...brownedSurfaceEffects], ['seasoning', 'spice', 'fat', 'liquid']),
  caramelized: progressive('焦糖化', ['firm_vegetable', 'fruit', 'aromatic'], {
    levels: ['保持原始颜色与质地', '边缘开始泛黄并释放甜香', '均匀呈现金褐色，质地柔软黏润', '颜色较深，表面形成浓厚光泽', '深褐接近焦化，质地浓稠或偏硬'],
  }, dryHeatEffects, ['seasoning', 'spice', 'fat', 'liquid'], [sugarRequirement], ['sugar']),
  toasted: progressive('烘香', ['grain_noodle', 'dough', 'spice', 'nut_seed', 'aromatic'], {
    levels: ['保持原始状态', '表面轻微干燥，香气开始释放', '表面均匀金黄并呈现烘香质感', '颜色加深，质地更干脆', '深度褐化或焦黑，产生明显焦化质感'],
  }, dryHeatEffects, ['seasoning', 'fat']),
  stir_fried: progressive('炒', ['red_meat', 'poultry', 'fish', 'shellfish', 'egg', 'firm_vegetable', 'leafy_vegetable', 'grain_noodle', 'legume', 'aromatic', 'spice'], {
    levels: ['保持生鲜状态', '表面快速受热，仍保留明显生鲜质感', '均匀熟化，颜色鲜明并保有结构', '质地进一步软化，出现明显焦边', '高度失水，边缘深色焦化'],
    byProfile: {
      poultry: ['生禽肉，质地略显半透明', '外层变白，内部仍接近生鲜', '完全熟透，表面上色且保有汁水', '表面焦边明显，肉质趋于紧实', '深度焦化，肉质明显偏干'],
      leafy_vegetable: ['叶片生鲜舒展', '叶片开始萎蔫，颜色仍鲜亮', '叶片熟软且颜色鲜明', '叶片明显软塌，边缘略干', '叶片深度萎缩，边缘焦化'],
    },
  }, dryHeatEffects, ['seasoning', 'fat', 'liquid']),
  baked: progressive('烤制 / 烘焙', ['red_meat', 'poultry', 'fish', 'firm_vegetable', 'fruit', 'nut_seed', 'spice', 'aromatic', 'dough', 'egg', 'dairy'], {
    levels: ['保持生鲜状态', '外层开始干燥并轻微上色', '内部熟化，表面呈均匀金褐色', '表面颜色加深，内部更加柔软或紧实', '表面深度焦化，整体明显失水'],
    byProfile: {
      firm_vegetable: ['生鲜且结构坚实', '表面开始干燥，内部仍脆硬', '边缘金黄，内部熟软且保持形状', '外层褐化明显，内部充分柔软', '边缘焦黑，内部失水并开始塌缩'],
      poultry: ['生禽肉，表面湿润', '表皮开始收紧并轻微上色', '表皮金黄，内部熟透且保有汁水', '表皮深色酥化，内部汁水减少', '表皮焦黑，肉质紧缩偏干'],
      dough: ['面团保持生坯状态', '外层开始定型，内部仍黏软', '面团完全膨胀并烤熟，表面金黄', '外壳颜色较深，内部水分减少', '外壳焦黑，内部明显干硬'],
    },
  }, [...dryHeatEffects, ...brownedSurfaceEffects], ['seasoning', 'fat', 'liquid']),
  grilled: progressive('烧烤 / 炙烤', ['red_meat', 'poultry', 'fish', 'shellfish', 'firm_vegetable', 'fruit', 'dough', 'aromatic'], {
    levels: ['保持生鲜状态', '表面出现浅色烤痕，内部仍接近生鲜', '烤痕清晰，内部已经熟化', '焦边明显，内部水分减少', '表面深度焦黑，整体明显失水'],
    byProfile: {
      red_meat: ['生肉状态，表面湿润', '出现浅色烤痕，内部仍保持生肉状态', '烤痕清晰，内部已经熟化并保有汁水', '焦边明显，肉质更加紧实', '表面焦黑，肉质紧缩偏干'],
      firm_vegetable: ['生鲜且结构坚实', '出现浅色烤痕，内部仍脆', '烤痕清晰，内部熟而保有结构', '焦边明显，内部充分柔软', '表面焦黑，内部明显失水'],
    },
  }, [...dryHeatEffects, {
    label: '烟火熏烤', profiles: dryableProfiles, effects: { smoky: [0, 1, 2, 3, 4] },
  }], ['seasoning', 'spice', 'fat']),
  deep_fried: progressive('油炸', ['red_meat', 'poultry', 'fish', 'shellfish', 'egg', 'firm_vegetable', 'grain_noodle', 'legume', 'dough', 'aromatic'], {
    levels: ['保持生鲜或生坯状态', '外层开始定型，颜色仍浅', '外壳金黄酥脆，内部已经熟化', '外壳颜色较深，整体进一步脱水', '外壳深褐或焦黑，内部明显偏干'],
    byProfile: {
      poultry: ['生禽肉，表面湿润', '外层开始定型，内部仍接近生鲜', '外壳金黄酥脆，内部熟透且保有汁水', '外壳深金色，内部汁水减少', '外壳深褐，肉质明显偏干'],
      firm_vegetable: ['生鲜且结构坚实', '外层开始定型，内部仍脆硬', '外层金黄酥脆，内部熟软', '外层颜色较深，内部水分减少', '外层深褐，整体干硬'],
    },
  }, [...dryHeatEffects, {
    label: '油炸酥化', profiles: crispableProfiles, effects: { crisp: [0, 1, 3, 4, 5] },
  }], ['seasoning', 'spice', 'fat'], [fatRequirement]),
  drained: instant('沥干', ['red_meat', 'poultry', 'fish', 'shellfish', 'egg', 'firm_vegetable', 'leafy_vegetable', 'grain_noodle', 'legume'], '沥去表面和缝隙中的多余水分'),
  skewered: instant('穿串', ['red_meat', 'poultry', 'fish', 'shellfish', 'firm_vegetable', 'fruit', 'dough'], '切配后整齐穿在串签上'),
  shaped: instant('压制成型', ['dough', 'grain_noodle', 'legume', 'seasoning', 'spice', 'aromatic', 'fat', 'liquid'], '压制成大小一致的扁平形状'),
  oiled: instant('刷油', brushableProfiles, '表面覆盖薄而均匀的油层', ['fat']),
  sauced: instant('刷酱 / 挂汁', brushableProfiles, '表面均匀覆盖一层酱汁', ['seasoning', 'spice', 'fat', 'liquid'], [sauceRequirement]),
}
