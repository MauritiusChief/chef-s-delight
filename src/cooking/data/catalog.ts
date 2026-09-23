/** 烹饪内容目录：定义食材分类以及厨具可执行的操作 ID。 */
import type {
  Ingredient,
  IngredientGroup,
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
  { profile: 'red_meat', names: ['牛肉', '猪肉', '羊肉'] },
  { profile: 'poultry', names: ['鸡肉', '鸡腿', '鸡翅'] },
  { profile: 'fish', names: ['白肉鱼', '三文鱼'] },
  { profile: 'shellfish', names: ['虾', '鱿鱼'] },
  { profile: 'egg', names: ['鸡蛋'] },
  { profile: 'legume', names: ['豆腐', '鹰嘴豆', '扁豆', '黑豆'] },
  { profile: 'grain_noodle', names: ['米饭', '小麦面条', '意面', '米粉'] },
  { profile: 'dough', names: ['面包', '饼皮', '披萨面团', '玉米饼'] },
  { profile: 'firm_vegetable', names: ['土豆', '胡萝卜', '红薯', '洋葱', '番茄', '甜椒', '辣椒', '茄子', '西兰花', '菜花', '黄瓜', '蘑菇', '玉米'] },
  { profile: 'leafy_vegetable', names: ['菠菜', '生菜', '白菜', '卷心菜'] },
  { profile: 'aromatic', names: ['大蒜', '葱', '姜', '香菜', '欧芹', '罗勒', '薄荷'] },
  { profile: 'fruit', names: ['柠檬', '青柠', '苹果', '香蕉', '牛油果'] },
  { profile: 'dairy', names: ['牛奶', '奶油', '黄油', '奶酪', '酸奶'] },
  { profile: 'nut_seed', names: ['花生', '芝麻', '腰果'] },
  { profile: 'liquid', names: ['水', '高汤', '椰奶'] },
  { profile: 'fat', names: ['植物油', '橄榄油'] },
  { profile: 'seasoning', names: ['盐', '糖', '酱油', '醋', '辣椒酱', '番茄酱'] },
  { profile: 'spice', names: ['黑胡椒', '孜然', '辣椒粉', '咖喱香料', '肉桂'] },
]

/** 将展示分组展开成计算层使用的独立食材记录。 */
export const ingredients: Ingredient[] = ingredientGroups.flatMap(({ profile, names }) =>
  names.map((name) => ({ name, profile })),
)

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
