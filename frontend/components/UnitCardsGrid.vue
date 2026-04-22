<template>
  <div class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,24rem),1fr))] gap-[1.25rem]">
    <UnitCard
      v-for="unit in props.units"
      :key="unit.id"
      :unit="unit"
      :is-wishlisted="props.alwaysWishlisted || props.wishlistIds.includes(unit.id)"
      :server-clock-offset-ms="props.serverClockOffsetMs"
      :current-user-id="props.currentUserId ?? null"
      :reserving-unit-id="props.reservingUnitId"
      :is-my-units-card="props.myUnitsMode"
      @select="emit('select', unit)"
      @reserve="emit('reserve', unit)"
      @toggle-wishlist="emit('toggleWishlist', unit.id)"
    />
  </div>
</template>

<script setup lang="ts">
import UnitCard from '~/components/UnitCard.vue'
import type { Unit } from '~/types'

const props = withDefaults(
  defineProps<{
    units: Unit[]
    wishlistIds?: string[]
    alwaysWishlisted?: boolean
    myUnitsMode?: boolean
    serverClockOffsetMs?: number
    currentUserId?: string | null
    reservingUnitId?: string | null
  }>(),
  {
    wishlistIds: () => [],
    alwaysWishlisted: false,
    myUnitsMode: false,
    serverClockOffsetMs: 0,
    currentUserId: null,
    reservingUnitId: null,
  },
)

const emit = defineEmits<{
  select: [unit: Unit]
  reserve: [unit: Unit]
  toggleWishlist: [unitId: string]
}>()
</script>
