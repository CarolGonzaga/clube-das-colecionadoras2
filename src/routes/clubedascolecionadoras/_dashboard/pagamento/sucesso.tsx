import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, PackageOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { getMyOrder, reconcileMercadoPagoPayment } from "@/lib/checkout";

const searchSchema = z.object({
  order: z.string().optional(),
  payment_id: z.coerce.string().optional(),
});

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/pagamento/sucesso")({
  validateSearch: searchSchema,
  component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
  const search = Route.useSearch();
  const [order, setOrder] = useState<any>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);

  useEffect(() => {
    if (!search.order) return;
    let alive = true;
    let reconciled = false;

    const load = async () => {
      try {
        if (!reconciled && search.payment_id) {
          reconciled = true;
          await reconcileMercadoPagoPayment({
            data: { orderId: search.order!, paymentId: search.payment_id },
          });
          if (alive) setConfirmationError(null);
        }

        const result = await getMyOrder({ data: { orderId: search.order! } });
        if (alive) setOrder(result.order);
      } catch (error: any) {
        if (alive && search.payment_id) {
          setConfirmationError(error?.message || "Ainda não conseguimos confirmar automaticamente este pagamento.");
        }
      }
    };

    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [search.order, search.payment_id]);

  const released =
    order?.payment_status === "approved" &&
    ["pending_opening", "partially_opened", "released"].includes(order?.fulfillment_status);

  return (
    <main className="screen payment-result-screen">
      <section className="payment-result-card">
        {released ? <CheckCircle2 size={42} /> : <Clock size={42} />}
        <h1>{released ? "Pagamento aprovado" : "Recebemos seu pagamento"}</h1>
        <p>
          {released
            ? "Suas figurinhas já foram adicionadas aos Registros para abertura."
            : "Estamos confirmando a transação com o Mercado Pago. Esta página atualiza automaticamente."}
        </p>
        {!released && confirmationError && (
          <p className="payment-result-warning">
            Pagamento localizado, mas a liberação automática ainda não foi concluída. Tente atualizar em alguns segundos.
            <br />
            <small>Detalhe técnico: {confirmationError}</small>
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
