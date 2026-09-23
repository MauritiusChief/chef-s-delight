/** 最终料理的结构角色，用于 UI 选择以及模型提示词。 */
import type { PlatingRoleId } from '../types'

export interface PlatingRole {
  id: PlatingRoleId
  label: string
}

export const platingRoles: PlatingRole[] = [
  { id: 'base', label: '基底 / 载体' },
  { id: 'main', label: '主体' },
  { id: 'covering', label: '覆盖 / 夹馅' },
  { id: 'side', label: '配菜' },
  { id: 'sauce', label: '汤汁 / 酱汁' },
  { id: 'garnish', label: '点缀' },
]

/** 根据稳定 ID 返回展示名称。 */
export function platingRoleLabel(id: PlatingRoleId) {
  return platingRoles.find((role) => role.id === id)?.label ?? id
}
