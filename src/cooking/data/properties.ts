/** 操作兼容性所需的物理特征，以及食材的菜系倾向。 */
import type { ProfileId, ScoreMap, TraitId } from '../types'

export const profileTraits: Record<ProfileId, ScoreMap<TraitId>> = {
  red_meat: { protein: 3, fat: 2, water: 2 }, poultry: { protein: 3, fat: 1, water: 2 }, fish: { protein: 3, fat: 1, water: 3 },
  shellfish: { protein: 2, water: 3 }, egg: { protein: 2, fat: 1, water: 2 }, firm_vegetable: { water: 2, sugar: 1, starch: 1 },
  leafy_vegetable: { water: 3 }, grain_noodle: { starch: 3, water: 1 }, legume: { protein: 2, starch: 2 }, dough: { starch: 3 },
  dairy: { fat: 2, water: 1 }, fruit: { water: 3, sugar: 2 }, aromatic: { water: 1, sugar: 1 }, spice: {},
  nut_seed: { fat: 3, protein: 1 }, liquid: { water: 4 }, fat: { fat: 4 }, seasoning: {},
}

export const ingredientTraits: Record<string, ScoreMap<TraitId>> = {
  糖: { sugar: 4 }, 洋葱: { sugar: 2, water: 2 }, 大蒜: { sugar: 1 }, 植物油: { fat: 5 },
  橄榄油: { fat: 5 }, 黄油: { fat: 4 }, 水: { water: 5 }, 高汤: { water: 5 },
}

export const ingredientCuisine: Record<string, ScoreMap> = {
  米饭: { 东亚菜: 1, 南亚菜: 1, 东南亚菜: 1, 拉美菜: 1 }, 酱油: { 中餐: 2, 日料: 2, 韩餐: 2 },
  姜: { 中餐: 1, 日料: 1, 南亚菜: 1, 东南亚菜: 1 }, 意面: { 意大利菜: 3 }, 披萨面团: { 意大利菜: 3 },
  橄榄油: { 地中海菜: 2, 意大利菜: 1 }, 孜然: { 中东菜: 2, 南亚菜: 2, 拉美菜: 1 },
  咖喱香料: { 南亚菜: 3, 东南亚菜: 1 }, 椰奶: { 东南亚菜: 2, 南亚菜: 1 }, 玉米饼: { 墨西哥菜: 3 },
  青柠: { 墨西哥菜: 1, 东南亚菜: 1 }, 豆腐: { 中餐: 1, 日料: 1, 东亚菜: 1 }, 芝麻: { 东亚菜: 1, 中东菜: 1 },
  酸奶: { 南亚菜: 1, 中东菜: 1 }, 罗勒: { 意大利菜: 1, 地中海菜: 1 },
}
