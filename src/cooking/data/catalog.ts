/** 烹饪内容目录：定义食材分类、操作、厨具及兼容范围。 */
import type {
  Ingredient,
  IngredientGroup,
  Operation,
  ProfileId,
  Tool,
} from '../types'

/** 程序内部食材大类 ID 对应的中文名称。 */
export const profileLabels: Record<ProfileId, string> = {
  red_meat: '红肉', poultry: '禽肉', fish: '鱼肉', shellfish: '贝类与软体海鲜', egg: '蛋',
  firm_vegetable: '结实蔬菜', leafy_vegetable: '叶菜', grain_noodle: '谷物与面食',
  legume: '豆类', dough: '面团', dairy: '乳制品', fruit: '水果', aromatic: '葱蒜与香草',
  spice: '香辛料', nut_seed: '坚果与种子', liquid: '液体', fat: '油脂', seasoning: '调味料',
}

/** 供选择器展示的食材分组及其所属烹饪大类。 */
export const ingredientGroups: IngredientGroup[] = [
  { label: '红肉', profile: 'red_meat', names: ['牛肉', '猪肉', '羊肉'] },
  { label: '禽肉', profile: 'poultry', names: ['鸡肉', '鸡腿', '鸡翅'] },
  { label: '鱼类', profile: 'fish', names: ['白肉鱼', '三文鱼'] },
  { label: '其他海鲜', profile: 'shellfish', names: ['虾', '鱿鱼'] },
  { label: '蛋', profile: 'egg', names: ['鸡蛋'] },
  { label: '豆类蛋白', profile: 'legume', names: ['豆腐', '鹰嘴豆', '扁豆', '黑豆'] },
  { label: '主食谷物', profile: 'grain_noodle', names: ['米饭', '小麦面条', '意面', '米粉'] },
  { label: '面团', profile: 'dough', names: ['面包', '饼皮', '披萨面团', '玉米饼'] },
  { label: '结实蔬菜', profile: 'firm_vegetable', names: ['土豆', '胡萝卜', '红薯', '洋葱', '番茄', '甜椒', '辣椒', '茄子', '西兰花', '菜花', '黄瓜', '蘑菇', '玉米'] },
  { label: '叶菜', profile: 'leafy_vegetable', names: ['菠菜', '生菜', '白菜', '卷心菜'] },
  { label: '芳香食材', profile: 'aromatic', names: ['大蒜', '葱', '姜', '香菜', '欧芹', '罗勒', '薄荷'] },
  { label: '水果', profile: 'fruit', names: ['柠檬', '青柠', '苹果', '香蕉', '牛油果'] },
  { label: '乳制品', profile: 'dairy', names: ['牛奶', '奶油', '黄油', '奶酪', '酸奶'] },
  { label: '坚果种子', profile: 'nut_seed', names: ['花生', '芝麻', '腰果'] },
  { label: '基础液体', profile: 'liquid', names: ['水', '高汤', '椰奶'] },
  { label: '基础油脂', profile: 'fat', names: ['植物油', '橄榄油'] },
  { label: '调味料', profile: 'seasoning', names: ['盐', '糖', '酱油', '醋', '辣椒酱', '番茄酱'] },
  { label: '香辛料', profile: 'spice', names: ['黑胡椒', '孜然', '辣椒粉', '咖喱香料', '肉桂'] },
]

/** 将展示分组展开成计算层使用的独立食材记录。 */
export const ingredients: Ingredient[] = ingredientGroups.flatMap(({ label, profile, names }) =>
  names.map((name) => ({ name, group: label, profile })),
)

const allProfiles = Object.keys(profileLabels) as ProfileId[]
const solidProfiles = allProfiles.filter((profile) => !['liquid', 'fat', 'seasoning'].includes(profile))
const cookableProfiles = allProfiles.filter((profile) => !['spice', 'fat'].includes(profile))
const cuttableProfiles = solidProfiles.filter((profile) => !['spice', 'grain_noodle'].includes(profile))

/** 全部操作及其类型、兼容大类和即时外观描述。 */
export const operations: Record<string, Operation> = {
  halved: { label: '对半', kind: 'instant', profiles: cuttableProfiles, appearance: '切成大小相近的两半' },
  sliced_thin: { label: '切薄片', kind: 'instant', profiles: cuttableProfiles, appearance: '切成均匀薄片' },
  sliced_thick: { label: '切厚片', kind: 'instant', profiles: cuttableProfiles, appearance: '切成均匀厚片' },
  strips: { label: '切丝 / 条', kind: 'instant', profiles: cuttableProfiles, appearance: '切成细长均匀的丝或条' },
  diced_small: { label: '切小丁', kind: 'instant', profiles: cuttableProfiles, appearance: '切成均匀小丁' },
  diced_large: { label: '切大丁', kind: 'instant', profiles: cuttableProfiles, appearance: '切成均匀大丁' },
  chunks: { label: '切块', kind: 'instant', profiles: cuttableProfiles, appearance: '切成大小相近的块' },
  minced: { label: '剁碎', kind: 'instant', profiles: cuttableProfiles, appearance: '细密剁碎' },
  grated: { label: '擦碎', kind: 'instant', profiles: ['firm_vegetable', 'dairy', 'fruit'], appearance: '擦成细碎均匀的丝屑' },
  flattened: { label: '压扁', kind: 'instant', profiles: ['dough'], appearance: '压成均匀扁平形状' },
  rolled: { label: '擀薄', kind: 'instant', profiles: ['dough'], appearance: '擀成薄而均匀的面片' },
  crushed: { label: '压碎', kind: 'instant', profiles: ['spice', 'nut_seed', 'aromatic', 'firm_vegetable'], appearance: '压成粗细不一的碎粒' },
  ground: { label: '研磨', kind: 'instant', profiles: ['spice', 'nut_seed'], appearance: '研磨成细颗粒或粉末' },
  paste: { label: '捣成泥', kind: 'instant', profiles: ['spice', 'nut_seed', 'aromatic', 'firm_vegetable', 'fruit'], appearance: '捣成具有细腻质感的泥或酱' },
  mixed: { label: '混合', kind: 'instant', profiles: allProfiles, appearance: '与其他成分均匀混合' },
  whipped: { label: '打发', kind: 'instant', profiles: ['egg', 'dairy'], appearance: '打发至蓬松并充满细小气泡' },
  seasoned: { label: '调味', kind: 'instant', profiles: allProfiles, appearance: '表面均匀附着调味料' },
  boiled: { label: '水煮', kind: 'progressive', profiles: cookableProfiles },
  simmered: { label: '慢煮', kind: 'progressive', profiles: cookableProfiles },
  braised: { label: '炖 / 焖', kind: 'progressive', profiles: ['red_meat', 'poultry', 'fish', 'firm_vegetable', 'legume'] },
  poached: { label: '汆 / 低温水煮', kind: 'progressive', profiles: ['red_meat', 'poultry', 'fish', 'shellfish', 'egg', 'firm_vegetable'] },
  steamed: { label: '蒸', kind: 'progressive', profiles: cookableProfiles },
  pan_fried: { label: '煎', kind: 'progressive', profiles: ['red_meat', 'poultry', 'fish', 'shellfish', 'egg', 'firm_vegetable', 'leafy_vegetable', 'legume', 'dough'] },
  caramelized: { label: '焦糖化', kind: 'progressive', profiles: ['firm_vegetable', 'fruit', 'seasoning'] },
  toasted: { label: '烘香', kind: 'progressive', profiles: ['grain_noodle', 'dough', 'spice', 'nut_seed', 'aromatic'] },
  stir_fried: { label: '炒', kind: 'progressive', profiles: ['red_meat', 'poultry', 'fish', 'shellfish', 'egg', 'firm_vegetable', 'leafy_vegetable', 'grain_noodle', 'legume', 'aromatic'] },
  roasted: { label: '烤制', kind: 'progressive', profiles: ['red_meat', 'poultry', 'fish', 'firm_vegetable', 'fruit', 'nut_seed'] },
  baked: { label: '烘焙', kind: 'progressive', profiles: ['dough', 'egg', 'dairy', 'fruit', 'firm_vegetable'] },
  grilled: { label: '烧烤 / 炙烤', kind: 'progressive', profiles: ['red_meat', 'poultry', 'fish', 'shellfish', 'firm_vegetable', 'fruit', 'dough'] },
  deep_fried: { label: '油炸', kind: 'progressive', profiles: ['red_meat', 'poultry', 'fish', 'shellfish', 'egg', 'firm_vegetable', 'grain_noodle', 'legume', 'dough'] },
  drained: { label: '沥干', kind: 'instant', profiles: ['red_meat', 'poultry', 'fish', 'shellfish', 'egg', 'firm_vegetable', 'leafy_vegetable', 'grain_noodle', 'legume'], appearance: '沥去表面和缝隙中的多余水分' },
  skewered: { label: '穿串', kind: 'instant', profiles: ['red_meat', 'poultry', 'fish', 'shellfish', 'firm_vegetable', 'fruit', 'dough'], appearance: '切配后整齐穿在串签上' },
  shaped: { label: '压制成型', kind: 'instant', profiles: ['dough', 'grain_noodle', 'legume'], appearance: '压制成大小一致的扁平形状' },
  griddled: { label: '烙制', kind: 'progressive', profiles: ['dough', 'grain_noodle', 'legume'] },
  oiled: { label: '刷油', kind: 'instant', profiles: solidProfiles, appearance: '表面覆盖薄而均匀的油层' },
  sauced: { label: '刷酱', kind: 'instant', profiles: solidProfiles, appearance: '表面均匀涂覆一层酱汁' },
  glazed: { label: '挂汁', kind: 'instant', profiles: solidProfiles, appearance: '表面包裹光亮而均匀的浓稠汁液' },
}

/** 厨具可用操作和厨具自身提供的菜系倾向。 */
export const tools: Tool[] = [
  { id: 'knife', name: '菜刀 + 砧板', operationIds: ['halved', 'sliced_thin', 'sliced_thick', 'strips', 'diced_small', 'diced_large', 'chunks', 'minced'], cuisine: { 中餐: 1, 日料: 1, 法餐: 1 } },
  { id: 'grater', name: '擦丝器', operationIds: ['grated'], cuisine: { 欧洲菜: 1, 南亚菜: 1, 墨西哥菜: 1 } },
  { id: 'rolling-pin', name: '擀面杖', operationIds: ['flattened', 'rolled'], cuisine: { 中餐: 1, 意大利菜: 1, 南亚菜: 1, 中东菜: 1 } },
  { id: 'mortar', name: '研钵', operationIds: ['crushed', 'ground', 'paste'], cuisine: { 东南亚菜: 2, 南亚菜: 1, 中东菜: 1, 拉美菜: 1 } },
  { id: 'mixing-bowl', name: '搅拌碗', operationIds: ['mixed', 'whipped', 'seasoned'], cuisine: {} },
  { id: 'frying-pan', name: '平底锅', operationIds: ['pan_fried', 'caramelized', 'toasted'], cuisine: {} },
  { id: 'wok', name: '炒锅', operationIds: ['stir_fried', 'toasted'], cuisine: { 中餐: 2, 东南亚菜: 1 } },
  { id: 'pot', name: '汤锅', operationIds: ['boiled', 'simmered', 'braised', 'poached'], cuisine: {} },
  { id: 'steamer', name: '蒸锅', operationIds: ['steamed'], cuisine: { 中餐: 1, 东亚菜: 1, 东南亚菜: 1 } },
  { id: 'oven', name: '烤箱', operationIds: ['roasted', 'baked'], cuisine: { 欧洲菜: 1, 北美菜: 1, 中东菜: 1 } },
  { id: 'grill', name: '烤架', operationIds: ['grilled'], cuisine: { 中东菜: 1, 美洲菜: 1, 东亚菜: 1 } },
  { id: 'fryer', name: '油炸锅', operationIds: ['deep_fried'], cuisine: {} },
  { id: 'strainer', name: '滤网', operationIds: ['drained'], cuisine: {} },
  { id: 'skewer', name: '串签', operationIds: ['skewered'], cuisine: { 中东菜: 1, 东亚菜: 1, 南亚菜: 1 } },
  { id: 'press', name: '压模 / 饼铛', operationIds: ['shaped', 'griddled'], cuisine: { 拉美菜: 1, 南亚菜: 1, 欧洲菜: 1 } },
  { id: 'brush', name: '刷子', operationIds: ['oiled', 'sauced', 'glazed'], cuisine: { 烧烤菜: 1 } },
]

/** 厨具允许额外加入、不受操作主体兼容范围限制的辅助食材大类。 */
export const supportByTool: Record<string, ProfileId[]> = {
  'mixing-bowl': ['seasoning', 'spice', 'aromatic', 'fat', 'liquid', 'dairy'],
  'frying-pan': ['seasoning', 'spice', 'aromatic', 'fat', 'liquid'],
  wok: ['seasoning', 'spice', 'aromatic', 'fat', 'liquid'],
  pot: ['seasoning', 'spice', 'aromatic', 'fat', 'liquid'],
  steamer: ['seasoning', 'spice', 'aromatic', 'fat', 'liquid'],
  oven: ['seasoning', 'spice', 'aromatic', 'fat', 'liquid'],
  grill: ['seasoning', 'spice', 'aromatic', 'fat'],
  fryer: ['seasoning', 'spice', 'aromatic', 'fat'],
  press: ['seasoning', 'spice', 'aromatic', 'fat', 'liquid'],
  brush: ['seasoning', 'fat', 'liquid'],
}
