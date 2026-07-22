import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, PackageOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { reconcileInfinitePayPayment } from "@/lib/checkout";
import { usePaymentOrderPolling } from "@/hooks/usePaymentOrderPolling";

const searchSchema = z.object({
  order: z.string().optional(),
  order_nsu: z.string().optional(),
  transaction_nsu: z.string().optional(),
  slug: z.string().optional(),
});

export const Route = createFileRoute(
  "/clubedascolecionadoras/_dashboard/pagamento/infinitepay",
)({
  validateSearch: searchSchema,
  component: InfinitePayReturnPage,
});

function InfinitePayReturnPage() {
  const search = Route.useSearch();
  const orderId = search.order_nsu || search.order;
  const { order } = usePaymentOrderPolling(orderId, null);
  const [confirmationDelayed, setConfirmationDelayed] = useState(false);

  useEffect(() => {
    if (!orderId || !search.transaction_nsu || !search.slug) return;
    let alive = true;
    reconcileInfinitePayPayment({
      data: {
        orderId,
        transactionNsu: search.transaction_nsu,
        slug: search.slug,
      },
    }).catch(() => {
      if (alive) {
        setConfirmationDelayed(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [orderId, search.transaction_nsu, search.slug]);

  const released =
    order?.payment_status === "approved" &&
    ["pending_opening", "partially_opened", "released"].includes(
      String(order?.fulfillment_status || ""),
    );

  return (
    <main className="screen payment-result-screen">
      <section className="payment-result-card">
        {released ? <CheckCircle2 size={42} /> : <Clock size={42} />}
        <h1>{released ? "Pagamento aprovado" : "Confirmando pagamento"}</h1>
        <p>
          {released
            ? "Suas figurinhas já foram adicionadas aos Registros para abertura."
            : "Estamos confirmando a transação diretamente com a InfinitePay."}
        </p>
        {!released && confirmationDelayed && (
          <p className="payment-result-warning">
            A confirmação pode levar alguns instantes. Você pode acompanhar o pedido na página de
            Registros.
          </p>
        )}
        <Link to="/clubedascolecionadoras/registros" className="btn">
          <PackageOpen size={16} />
          Ver meus pedidos
        </Link>
      </section>
    </main>
  );
}
