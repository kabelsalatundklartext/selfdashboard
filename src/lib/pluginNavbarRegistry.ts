'use client'

import type { ComponentType } from 'react'
import type { Locale } from '@/lib/i18n'

export type NavbarSlotProps = { locale: Locale }

const slots = new Map<string, ComponentType<NavbarSlotProps>>()
const listeners = new Set<() => void>()
let version = 0

function notifyNavbarSlots() {
  version += 1
  for (const fn of listeners) fn()
}

export function subscribeNavbarSlots(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange)
  return () => listeners.delete(onStoreChange)
}

export function getNavbarSlotsVersion(): number {
  return version
}

export function registerNavbarSlot(id: string, component: ComponentType<NavbarSlotProps>): void {
  slots.set(id, component)
  notifyNavbarSlots()
}

export function unregisterNavbarSlot(id: string): void {
  slots.delete(id)
  notifyNavbarSlots()
}

export function getNavbarSlots(): { id: string; component: ComponentType<NavbarSlotProps> }[] {
  return Array.from(slots.entries()).map(([id, component]) => ({ id, component }))
}

export function hasNavbarSlot(id: string): boolean {
  return slots.has(id)
}
