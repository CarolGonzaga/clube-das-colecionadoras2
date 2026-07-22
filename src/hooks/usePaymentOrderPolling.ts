import { useEffect, useState } from "react";
import { getMyOrder, reconcileMercadoPagoPayment } from "@/lib/checkout";

const MAX_POLL_ATTEMPTS = 20;

type PaymentOrder = {
  payment_status?: string | null;
  fulfillment_status?: string | null;
  [key: string]: unknown;
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function usePaymentOrderPolling(orderId?: string | null, rawPaymentId?: string | null) {
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    let alive = true;
    let checking = false;
    let attempts = 0;
    let timer: number | undefined;
    let reconciliationDisabled = false;

    const paymentId = rawPaymentId
      ? decodeURIComponent(String(rawPaymentId)).replace(/[^0-9]/g, "")
      : "";

    const schedule = () => {
      if (!alive || attempts >= MAX_POLL_ATTEMPTS) return;
      const delay = Math.min(5_000 * 2 ** Math.floor(attempts / 3), 30_000);
      timer = window.setTimeout(run, delay);
    };

    const run = async () => {
      if (!alive || checking) return;
      if (document.visibilityState === "hidden") {
        timer = window.setTimeout(run, 15_000);
        return;
      }

      checking = true;
      attempts += 1;
      let reconciliationError: string | null = null;

      try {
        if (paymentId && !reconciliationDisabled) {
          try {
            await reconcileMercadoPagoPayment({ data: { orderId, paymentId } });
          } catch (error: unknown) {
            const message = errorMessage(
              error,
              "Ainda não conseguimos confirmar automaticamente este pagamento.",
            );
            reconciliationError = message;
            reconciliationDisabled = /unauthorized use of live credentials/i.test(message);
          }
        }

        const result = await getMyOrder({ data: { orderId } });
        if (!alive) return;

        const currentOrder = result.order as unknown as PaymentOrder;
        setOrder(currentOrder);
        setConfirmationError(reconciliationError);

        if (currentOrder?.payment_status === "approved") return;
      } catch (error: unknown) {
        if (alive) {
          setConfirmationError(
            reconciliationError ||
              errorMessage(error, "Ainda não conseguimos consultar este pedido."),
          );
        }
      } finally {
        checking = false;
      }

      schedule();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible" || checking || !alive) return;
      if (timer) window.clearTimeout(timer);
      void run();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    void run();

    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [orderId, rawPaymentId]);

  return { order, confirmationError };
}
