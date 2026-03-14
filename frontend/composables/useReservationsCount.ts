/** Reservation count from profile.reserved_unit_ids (updated by payment-webhook). */
export function useReservationsCount() {
  const { reservedUnitIds } = useReservedUnitIds()
  const reservationsCount = computed(() => reservedUnitIds.value.length)
  return { reservationsCount }
}
