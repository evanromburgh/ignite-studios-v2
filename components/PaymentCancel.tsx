import React, { useEffect } from 'react';

export const PAYMENT_CANCELLED_TOAST_KEY = 'show_payment_cancelled_toast';

/**
 * PaymentCancel component handles PayFast redirects to the cancel URL.
 * It sends a webhook notification and redirects back to the properties page.
 */
export const PaymentCancel: React.FC = () => {
  useEffect(() => {
    const sendCancellationWebhook = async () => {
      // Get payment reference from URL or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      let paymentRef = urlParams.get('ref') || localStorage.getItem('payment_reference');
      
      // Decode the payment reference in case it was URL encoded
      if (paymentRef) {
        try {
          paymentRef = decodeURIComponent(paymentRef);
        } catch (e) {
          console.warn('Failed to decode payment reference, using as-is:', e);
        }
      }
      
      console.log('Payment reference from URL/localStorage:', paymentRef);
      
      if (!paymentRef) {
        console.warn('No payment reference found for cancellation');
        window.location.href = '/';
        return;
      }

      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const releaseUrl = `${baseUrl}/functions/v1/release-reservation-lock`;
      const webhookUrl = `${baseUrl}/functions/v1/payment-webhook`;

      try {
        await fetch(releaseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ ref: paymentRef }).toString(),
        });
      } catch (e) {
        console.error('Failed to release unit lock:', e);
      }

      try {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            m_payment_id: paymentRef,
            payment_status: 'CANCELLED',
          }).toString(),
        });
      } catch (e) {
        console.error('Failed to send cancellation webhook:', e);
      }

      sessionStorage.removeItem('ignite_reservation_redirecting');
      sessionStorage.setItem(PAYMENT_CANCELLED_TOAST_KEY, 'true');
      window.location.href = '/';
    };

    sendCancellationWebhook();
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-5">
      <div className="flex items-center animate-pulse">
        <span className="text-2xl sm:text-4xl font-black tracking-tighter text-white leading-none">IGNITE</span>
        <div className="h-4 sm:h-6 w-[1px] bg-zinc-800 mx-3 sm:mx-4"></div>
        <span className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] sm:tracking-[0.5em] leading-none">STUDIOS</span>
      </div>
      <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      <p className="text-zinc-500 text-sm">Taking you back to properties...</p>
    </div>
  );
};
