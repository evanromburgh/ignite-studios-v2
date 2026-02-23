import React, { useEffect, useState } from 'react';
import { Unit } from '../types';
import { unitService } from '../services/unitService';
import { formatPrice } from './UnitCard';

/**
 * PaymentSuccess page shown after PayFast redirect to /payment-success.
 * Shows thank you / congrats and a unit summary when a ref (or payment_reference) is available.
 * Does not rely on any changes to the reservation or redirect flow.
 */
export const PaymentSuccess: React.FC = () => {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      // Prefer ref from URL (PayFast may append), then m_payment_id, then localStorage (set by ReservationView before redirect)
      let paymentRef = urlParams.get('ref') || urlParams.get('m_payment_id') || localStorage.getItem('payment_reference');
      if (paymentRef) {
        try {
          paymentRef = decodeURIComponent(paymentRef);
        } catch {
          // use as-is
        }
      }

      if (!paymentRef) {
        if (!cancelled) setLoading(false);
        return;
      }

      const parts = paymentRef.split('-');
      const unitId = parts[0]?.trim();
      if (!unitId) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const fullUnit = await unitService.getUnit(unitId);
        if (!cancelled && fullUnit) setUnit(fullUnit);
      } catch (err) {
        console.warn('Could not fetch unit for success page:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-6 sm:px-10 md:px-16">
      <div className="text-center w-full max-w-5xl">
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-4">
          Your Reservation Confirmed
        </h1>
        <p className="text-zinc-400 text-base sm:text-lg mb-8 max-w-[42rem] mx-auto text-center">
          Congratulations on securing your unit. Our sales team will contact you within 24 hours to complete the process.
        </p>

        {loading ? (
          <div className="group relative flex flex-col sm:flex-row items-stretch gap-4 rounded-xl p-4 border border-white/5 bg-zinc-900/40 overflow-hidden w-full max-w-4xl mx-auto animate-pulse">
            <div className="shrink-0 w-full sm:w-[65%] rounded-lg aspect-[3/2] bg-white/10" />
            <div className="flex-1 flex flex-col gap-4 sm:w-[35%]">
              <div className="rounded-lg bg-white/[0.03] border border-white/5 p-6">
                <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
                <div className="h-6 bg-white/10 rounded w-1/4 mb-6" />
                <div className="pt-6 border-t border-white/5 flex flex-wrap gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-5 w-12 bg-white/10 rounded" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : unit ? (
          <div className="group relative flex flex-col sm:flex-row items-stretch sm:items-stretch gap-4 rounded-xl p-4 border border-white/5 bg-zinc-900/40 overflow-hidden w-full max-w-4xl mx-auto text-left">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="relative shrink-0 w-full sm:w-[65%]">
              <div className="relative overflow-hidden rounded-lg aspect-[3/2] bg-white/[0.02]">
                <img
                  src={unit.imageUrl}
                  alt={`Unit ${unit.unitNumber}`}
                  className="object-cover w-full h-full opacity-70 grayscale-[20%] group-hover:opacity-100 transition-opacity duration-300"
                />
              </div>
            </div>
            <div className="flex-1 flex flex-col min-w-0 min-h-0 relative z-10 gap-4 sm:w-[35%]">
              <div className="rounded-lg bg-white/[0.03] border border-white/5 p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
                  Your reservation
                </p>
                <h3 className="text-xl font-medium text-white tracking-tight leading-none mb-2">
                  Unit {unit.unitNumber}
                </h3>
                <p className="text-lg text-zinc-400 mb-6">R {formatPrice(unit.price)}</p>
                <div className="pt-6 border-t border-white/5 flex flex-col gap-2 text-sm">
                  <p className="text-zinc-500"><span className="text-zinc-400">Bedrooms:</span> {unit.bedrooms}</p>
                  <p className="text-zinc-500"><span className="text-zinc-400">Bathrooms:</span> {unit.bathrooms}</p>
                  <p className="text-zinc-500"><span className="text-zinc-400">Parking:</span> {unit.parking}</p>
                  <p className="text-zinc-500"><span className="text-zinc-400">Unit Type:</span> {unit.unitType}</p>
                  <p className="text-zinc-500"><span className="text-zinc-400">Unit Size:</span> {unit.sizeSqm} m²</p>
                </div>
              </div>
              <div className="flex-1 flex min-h-0 items-center justify-center rounded-[0.5rem] bg-emerald-500/15 px-3 py-1.5">
                <span className="text-sm font-semibold text-emerald-400">Deposit Paid</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <a
        href="/reservations"
        className="mt-4 h-[46px] px-8 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-zinc-200 transition-all inline-flex items-center justify-center"
      >
        My Reservations
      </a>
    </div>
  );
};
