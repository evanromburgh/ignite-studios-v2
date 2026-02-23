-- Add Zoho reservation ID to pending_reservations so payment-webhook can update by ID instead of searching Zoho
ALTER TABLE pending_reservations
  ADD COLUMN IF NOT EXISTS zoho_reservation_id TEXT;

COMMENT ON COLUMN pending_reservations.zoho_reservation_id IS 'Zoho Unit_Reservations record id; set by submit-reservation, used by payment-webhook to update Payment_Status without Zoho search';
