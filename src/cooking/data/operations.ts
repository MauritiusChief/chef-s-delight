/** 操作目录：每个操作在同一处定义类型、兼容范围和结果描述。 */
import type {
  InstantOperation,
  Operation,
  ProfileId,
  ProgressiveDescription,
  ProgressiveOperation,
  SensoryEffectCurves,
} from '../types'
import { profileLabels } from './catalog'

const allProfiles = Object.keys(profileLabels) as ProfileId[]
const solidProfiles = allProfiles.filter((profile) => !['liquid', 'fat', 'seasoning'].includes(profile))
const cuttableProfiles = solidProfiles.filter((profile) => !['spice', 'grain_noodle'].includes(profile))

/** 湿热操作共有的含水变化。 */
const wetHeatEffects: SensoryEffectCurves = {
  moist: [0, 1, 2, 3, 3],
  dry: [0, 0, 0, 0, 1],
}

/** 干热操作共有的失水和焦香变化。 */
const dryHeatEffects: SensoryEffectCurves = {
  moist: [0, 0, -1, -2, -3],
  dry: [0, 0, 0, 1, 3],
  roasted: [0, 1, 2, 3, 4],
}

/** 煎、烤、烘焙和烙制共有的表面酥化变化。 */
const brownedSurfaceEffects: SensoryEffectCurves = {
  crisp: [0, 0, 1, 2, 3],
}

/** 创建即时操作，使操作表中的重复字段保持简洁。 */
function instant(label: string, profiles: ProfileId[], description: string): InstantOperation {
  return { label, kind: 'instant', profiles, description }
}

/** 创建渐进式操作，并将五档描述绑定到操作本身。 */
function progressive(
  label: string,
  profiles: ProfileId[],
  description: ProgressiveDescription,
  effects: SensoryEffectCurves,
): ProgressiveOperation {
  return { label, kind: 'progressive', profiles, description, effects }
}

/** 全部操作的唯一数据源。 */
export const operations: Record<string, Operation> = {
  halved: instant('对半', cuttableProfiles, '切成大小相近的两半'),
  sliced_thin: instant('切薄片', cuttableProfiles, '切成均匀薄片'),
  sliced_thick: instant('切厚片', cuttableProfiles, '切成均匀厚片'),
  strips: instant('切丝 / 条', cuttableProfiles, '切成细长均匀的丝或条'),
  diced_small: instant('切小丁', cuttableProfiles, '切成均匀小丁'),
  diced_large: instant('切大丁', cuttableProfiles, '切成均匀大丁'),
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
  seasoned: instant('调味', allProfiles, '表面均匀附着调味料'),

  boiled: progressive('水煮', allProfiles, {
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
  }, wetHeatEffects),
  simmered: progressive('慢煮', allProfiles, {
    levels: ['保持生鲜状态，尚未开始慢煮', '开始受热并接触汤汁', '已经熟透并吸收部分汤汁', '充分软化，味汁渗入且结构开始松散', '长时间慢煮，主体接近融入汤汁'],
    byProfile: {
      red_meat: ['生肉状态，纤维紧实', '表面受热，内部仍接近生鲜', '肉已熟透，纤维仍完整', '肉质软烂，纤维容易分离', '肉质极为松散，部分融入汤汁'],
      legume: ['干硬或生鲜状态', '开始吸水膨胀', '熟透且保持颗粒形状', '柔软，部分颗粒开裂', '大量颗粒分解，汤汁变得浓稠'],
    },
  }, wetHeatEffects),
  braised: progressive('炖 / 焖', ['red_meat', 'poultry', 'fish', 'firm_vegetable', 'legume', 'seasoning', 'spice', 'aromatic', 'fat', 'liquid'], {
    levels: ['原料保持生鲜状态', '表面受热，开始接触调味液', '已经熟透，外层附着汤汁', '充分软化，颜色加深并吸收汤汁', '结构非常松散，浓稠汤汁深入主体'],
    byProfile: {
      red_meat: ['生肉状态，纤维紧实', '表面开始变色，内部仍接近生鲜', '肉已熟透，表面附着汤汁', '肉质软烂，纤维容易分离', '肉质极为松散，浓稠汤汁深入纤维'],
      firm_vegetable: ['结构生硬，颜色自然', '外层开始受热并沾染汤汁', '熟透且保持块状结构', '充分软化，颜色加深', '结构开始崩解，表面覆盖浓稠汤汁'],
    },
  }, wetHeatEffects),
  poached: progressive('汆 / 低温水煮', ['red_meat', 'poultry', 'fish', 'shellfish', 'egg', 'firm_vegetable', 'seasoning', 'spice', 'aromatic', 'fat', 'liquid'], {
    levels: ['保持生鲜状态', '外层轻微熟化，中心仍接近生鲜', '温和熟透，质地柔嫩', '进一步凝固，质地较紧实', '长时间受热，质地明显变紧或变散'],
    byProfile: {
      egg: ['蛋白与蛋黄均为液态', '蛋白部分凝固，蛋黄保持流动', '蛋白柔嫩凝固，蛋黄保持浓稠流动', '蛋白完全凝固，蛋黄中心柔软', '蛋白紧实，蛋黄完全凝固'],
      fish: ['鱼肉生鲜且略透明', '外层转为不透明，中心仍接近生鲜', '鱼肉温和熟透，保持柔嫩分层', '鱼肉完全凝固，层片容易分开', '鱼肉偏紧实，边缘开始碎开'],
    },
  }, wetHeatEffects),
  steamed: progressive('蒸', allProfiles, {
    levels: ['保持生鲜状态', '表层受热，内部仍接近生鲜', '已经蒸熟，质地湿润且结构完整', '充分蒸软，结构开始松弛', '长时间蒸制，质地非常柔软或偏湿'],
    byProfile: {
      fish: ['鱼肉生鲜且略透明', '表层转为不透明，中心仍接近生鲜', '鱼肉蒸熟，柔嫩湿润且分层完整', '鱼肉非常柔软，层片容易分开', '鱼肉结构松散，水分明显流失'],
      firm_vegetable: ['生鲜且结构坚实', '略微软化，仍保持脆度', '蒸熟且保有形状与鲜明颜色', '质地柔软，颜色开始变化', '结构松散，容易压碎'],
      dough: ['面团保持生坯状态', '外层开始定型，内部仍黏软', '完全蒸熟，内部柔软且结构稳定', '含水充分，质地更柔软', '过度吸收蒸汽，表面湿软且结构松弛'],
    },
  }, wetHeatEffects),
  pan_fried: progressive('煎', ['red_meat', 'poultry', 'fish', 'shellfish', 'egg', 'firm_vegetable', 'leafy_vegetable', 'legume', 'dough', 'seasoning', 'spice', 'aromatic', 'fat', 'liquid'], {
    levels: ['保持生鲜状态，表面没有煎制痕迹', '表面开始定型并轻微上色', '表面均匀褐化，内部已经熟化', '表面颜色较深，内部进一步失水', '表面深度褐化或焦黑，整体明显失水'],
    byProfile: {
      red_meat: ['生肉状态，表面湿润', '表面轻微上色，内部仍保持明显生肉状态', '表面形成褐色煎痕，内部已经熟化', '外层深度褐化，内部汁水减少', '表面焦黑，肉质明显紧缩偏干'],
      egg: ['蛋白与蛋黄均为液态', '蛋白边缘凝固，蛋黄仍流动', '蛋白完全凝固并轻微焦边，蛋黄柔软', '蛋白焦边明显，蛋黄基本凝固', '蛋白深度焦化，蛋黄完全凝固偏干'],
      firm_vegetable: ['生鲜且表面湿润', '表面轻微上色，内部仍脆', '表面褐化，内部熟而保有结构', '焦边明显，内部柔软', '表面焦黑，内部明显失水'],
    },
  }, { ...dryHeatEffects, ...brownedSurfaceEffects }),
  caramelized: progressive('焦糖化', ['firm_vegetable', 'fruit', 'seasoning', 'spice', 'aromatic', 'fat', 'liquid'], {
    levels: ['保持原始颜色与质地', '边缘开始泛黄并释放甜香', '均匀呈现金褐色，质地柔软黏润', '颜色较深，表面形成浓厚光泽', '深褐接近焦化，质地浓稠或偏硬'],
  }, dryHeatEffects),
  toasted: progressive('烘香', ['grain_noodle', 'dough', 'spice', 'nut_seed', 'aromatic', 'seasoning', 'fat', 'liquid'], {
    levels: ['保持原始状态', '表面轻微干燥，香气开始释放', '表面均匀金黄并呈现烘香质感', '颜色加深，质地更干脆', '深度褐化或焦黑，产生明显焦化质感'],
  }, dryHeatEffects),
  stir_fried: progressive('炒', ['red_meat', 'poultry', 'fish', 'shellfish', 'egg', 'firm_vegetable', 'leafy_vegetable', 'grain_noodle', 'legume', 'aromatic', 'seasoning', 'spice', 'fat', 'liquid'], {
    levels: ['保持生鲜状态', '表面快速受热，仍保留明显生鲜质感', '均匀熟化，颜色鲜明并保有结构', '质地进一步软化，出现明显焦边', '高度失水，边缘深色焦化'],
    byProfile: {
      poultry: ['生禽肉，质地略显半透明', '外层变白，内部仍接近生鲜', '完全熟透，表面上色且保有汁水', '表面焦边明显，肉质趋于紧实', '深度焦化，肉质明显偏干'],
      leafy_vegetable: ['叶片生鲜舒展', '叶片开始萎蔫，颜色仍鲜亮', '叶片熟软且颜色鲜明', '叶片明显软塌，边缘略干', '叶片深度萎缩，边缘焦化'],
    },
  }, dryHeatEffects),
  roasted: progressive('烤制', ['red_meat', 'poultry', 'fish', 'firm_vegetable', 'fruit', 'nut_seed', 'seasoning', 'spice', 'aromatic', 'fat', 'liquid'], {
    levels: ['保持生鲜状态', '外层开始干燥并轻微上色', '内部熟化，表面呈均匀金褐色', '表面颜色加深，内部更加柔软或紧实', '表面深度焦化，整体明显失水'],
    byProfile: {
      firm_vegetable: ['生鲜且结构坚实', '表面开始干燥，内部仍脆硬', '边缘金黄，内部熟软且保持形状', '外层褐化明显，内部充分柔软', '边缘焦黑，内部失水并开始塌缩'],
      poultry: ['生禽肉，表面湿润', '表皮开始收紧并轻微上色', '表皮金黄，内部熟透且保有汁水', '表皮深色酥化，内部汁水减少', '表皮焦黑，肉质紧缩偏干'],
    },
  }, { ...dryHeatEffects, ...brownedSurfaceEffects }),
  baked: progressive('烘焙', ['dough', 'egg', 'dairy', 'fruit', 'firm_vegetable', 'seasoning', 'spice', 'aromatic', 'fat', 'liquid'], {
    levels: ['保持未烘焙状态', '外层开始定型，内部仍柔软湿润', '整体定型并均匀熟化', '表面深度上色，内部进一步失水', '表面焦化，质地明显干硬'],
    byProfile: {
      dough: ['面团保持生坯状态', '外层开始定型，内部仍黏软', '面团完全膨胀并烤熟，表面金黄', '外壳颜色较深，内部水分减少', '外壳焦黑，内部明显干硬'],
    },
  }, { ...dryHeatEffects, ...brownedSurfaceEffects }),
  grilled: progressive('烧烤 / 炙烤', ['red_meat', 'poultry', 'fish', 'shellfish', 'firm_vegetable', 'fruit', 'dough', 'seasoning', 'spice', 'aromatic', 'fat'], {
    levels: ['保持生鲜状态', '表面出现浅色烤痕，内部仍接近生鲜', '烤痕清晰，内部已经熟化', '焦边明显，内部水分减少', '表面深度焦黑，整体明显失水'],
    byProfile: {
      red_meat: ['生肉状态，表面湿润', '出现浅色烤痕，内部仍保持生肉状态', '烤痕清晰，内部已经熟化并保有汁水', '焦边明显，肉质更加紧实', '表面焦黑，肉质紧缩偏干'],
      firm_vegetable: ['生鲜且结构坚实', '出现浅色烤痕，内部仍脆', '烤痕清晰，内部熟而保有结构', '焦边明显，内部充分柔软', '表面焦黑，内部明显失水'],
    },
  }, { ...dryHeatEffects, smoky: [0, 1, 2, 3, 4] }),
  deep_fried: progressive('油炸', ['red_meat', 'poultry', 'fish', 'shellfish', 'egg', 'firm_vegetable', 'grain_noodle', 'legume', 'dough', 'seasoning', 'spice', 'aromatic', 'fat'], {
    levels: ['保持生鲜或生坯状态', '外层开始定型，颜色仍浅', '外壳金黄酥脆，内部已经熟化', '外壳颜色较深，整体进一步脱水', '外壳深褐或焦黑，内部明显偏干'],
    byProfile: {
      poultry: ['生禽肉，表面湿润', '外层开始定型，内部仍接近生鲜', '外壳金黄酥脆，内部熟透且保有汁水', '外壳深金色，内部汁水减少', '外壳深褐，肉质明显偏干'],
      firm_vegetable: ['生鲜且结构坚实', '外层开始定型，内部仍脆硬', '外层金黄酥脆，内部熟软', '外层颜色较深，内部水分减少', '外层深褐，整体干硬'],
    },
  }, { ...dryHeatEffects, crisp: [0, 1, 3, 4, 5] }),
  drained: instant('沥干', ['red_meat', 'poultry', 'fish', 'shellfish', 'egg', 'firm_vegetable', 'leafy_vegetable', 'grain_noodle', 'legume'], '沥去表面和缝隙中的多余水分'),
  skewered: instant('穿串', ['red_meat', 'poultry', 'fish', 'shellfish', 'firm_vegetable', 'fruit', 'dough'], '切配后整齐穿在串签上'),
  shaped: instant('压制成型', ['dough', 'grain_noodle', 'legume', 'seasoning', 'spice', 'aromatic', 'fat', 'liquid'], '压制成大小一致的扁平形状'),
  griddled: progressive('烙制', ['dough', 'grain_noodle', 'legume', 'seasoning', 'spice', 'aromatic', 'fat', 'liquid'], {
    levels: ['保持未加热状态', '接触面开始定型并轻微上色', '两面定型并呈现金黄色', '表面颜色加深，内部水分减少', '接触面焦黑，整体明显偏干'],
  }, { ...dryHeatEffects, ...brownedSurfaceEffects }),
  oiled: instant('刷油', allProfiles, '表面覆盖薄而均匀的油层'),
  sauced: instant('刷酱', allProfiles, '表面均匀涂覆一层酱汁'),
  glazed: instant('挂汁', allProfiles, '表面包裹光亮而均匀的浓稠汁液'),
}
