import type { ProfileId, ScoreMap, SenseId, TraitId } from '../types'

export const senseLabels: Record<SenseId, string> = {
  salty: '咸味', sweet: '甜味', sour: '酸味', umami: '鲜味', spicy: '辣味', pungent: '辛味',
  aromatic: '芳香', roasted: '焦香', smoky: '烟火味', bloody: '血味感知', moist: '湿润', dry: '干燥',
  crisp: '酥脆', rich: '丰润',
}

export const senseIds = Object.keys(senseLabels) as SenseId[]

export const profileSensory: Record<ProfileId, ScoreMap<SenseId>> = {
  red_meat: { umami: 2, bloody: 4, moist: 2, rich: 2 }, poultry: { umami: 2, bloody: 3, moist: 2, rich: 1 },
  fish: { umami: 2, bloody: 2, moist: 3 }, shellfish: { umami: 3, bloody: 1, moist: 2 }, egg: { umami: 1, moist: 2, rich: 1 },
  firm_vegetable: { sweet: 1, moist: 2 }, leafy_vegetable: { moist: 3 }, grain_noodle: {}, legume: { umami: 1 }, dough: {},
  dairy: { rich: 2 }, fruit: { sweet: 2, sour: 1, moist: 2 }, aromatic: { aromatic: 2, pungent: 1 }, spice: { aromatic: 2, pungent: 1 },
  nut_seed: { rich: 2, aromatic: 1 }, liquid: { moist: 4 }, fat: { rich: 4 }, seasoning: {},
}

export const profileTraits: Record<ProfileId, ScoreMap<TraitId>> = {
  red_meat: { protein: 3, fat: 2, water: 2 }, poultry: { protein: 3, fat: 1, water: 2 }, fish: { protein: 3, fat: 1, water: 3 },
  shellfish: { protein: 2, water: 3 }, egg: { protein: 2, fat: 1, water: 2 }, firm_vegetable: { water: 2, sugar: 1, starch: 1 },
  leafy_vegetable: { water: 3 }, grain_noodle: { starch: 3, water: 1 }, legume: { protein: 2, starch: 2 }, dough: { starch: 3 },
  dairy: { fat: 2, water: 1 }, fruit: { water: 3, sugar: 2 }, aromatic: { water: 1, sugar: 1 }, spice: {},
  nut_seed: { fat: 3, protein: 1 }, liquid: { water: 4 }, fat: { fat: 4 }, seasoning: {},
}

export const ingredientSensory: Record<string, ScoreMap<SenseId>> = {
  盐: { salty: 4 }, 酱油: { salty: 3, umami: 3 }, 糖: { sweet: 4 }, 醋: { sour: 4 }, 辣椒: { spicy: 3, pungent: 1 },
  辣椒粉: { spicy: 4 }, 辣椒酱: { spicy: 3, salty: 1, sour: 1 }, 大蒜: { pungent: 3, aromatic: 1 }, 姜: { pungent: 2, aromatic: 2 },
  黑胡椒: { pungent: 3, aromatic: 1 }, 孜然: { aromatic: 3, pungent: 1 }, 咖喱香料: { aromatic: 4, pungent: 2 },
  柠檬: { sour: 4, aromatic: 1, moist: 1 }, 青柠: { sour: 4, aromatic: 2, moist: 1 }, 番茄: { sour: 1, sweet: 1, umami: 1, moist: 3 },
  高汤: { umami: 3, moist: 4, salty: 1 }, 椰奶: { sweet: 1, moist: 3, rich: 3 }, 水: { moist: 5 },
  植物油: { rich: 4 }, 橄榄油: { rich: 4, aromatic: 1 }, 黄油: { rich: 4, aromatic: 1 },
  奶酪: { salty: 2, umami: 2, rich: 3 }, 蘑菇: { umami: 3, moist: 2 }, 三文鱼: { umami: 2, bloody: 1, moist: 3, rich: 2 },
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
