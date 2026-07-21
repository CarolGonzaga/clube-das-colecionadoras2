import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, PackageOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { getMyOrder, reconcileMercadoPagoPayment } from "@/lib/checkout";

const searchSchema = z.object({
  order: z.string().uuid().optional(),
  payment_id: z.coerce.string().optional(),
  collection_id: z.coerce.string().optional(),
  collection_status: z.string().optional(),
  status: z.string().optional(),
  external_reference: z.string().optional(),
  payment_type: z.string().optional(),
  merchant_order_id: z.coerce.string().optional(),
  preference_id: z.string().optional(),
  site_id: z.string().optional(),
  processing_mode: z.string().optional(),
  merchant_account_id: z.coerce.string().optional(),
});

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/pagamento/pendente")({
  validateSearch: searchSchema,
  component: PaymentPendingPage,
});

function PaymentPendingPage() {
  const search = Route.useSearch();
  const [order, setOrder] = useState<any>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);

  useEffect(() => {
    if (!search.order) return;
    let alive = true;
    let checking = false;
    let permanentFailure = false;

    const reconcileAndLoad = async () => {
      if (checking || permanentFailure) return;
      checking = true;
      try {
        if (search.payment_id) {
          const paymentId = decodeURIComponent(String(search.payment_id)).replace(/[^0-9]/g, "");
          await reconcileMercadoPagoPayment({
            data: { orderId: search.order!, paymentId },
          });
        }

        const result = await getMyOrder({ data: { orderId: search.order! } });
        if (alive) {
          setOrder(result.order);
          setConfirmationError(null);
        }
      } catch (error: any) {
        const message = error?.message || "Ainda não conseguimos confirmar o pagamento.";
        permanentFailure = /unauthorized use of live credentials/i.test(message);
        if (alive) {
          setConfirmationError(message);
        }
      } finally {
        checking = false;
      }
    };

    reconcileAndLoad();
    const timer = window.setInterval(reconcileAndLoad, 5000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [search.order, search.payment_id]);

  const approved = order?.payment_status === "approved";

  return (
    <main className="screen payment-result-screen">
      <section className="payment-result-card">
        {approved ? <CheckCircle2 size={42} /> : <Clock size={42} />}
        <h1>{approved ? "Pagamento aprovado" : "Pagamento pendente"}</h1>
        <p>
          {approved
            ? "Pagamento confirmado. Seus itens já estão disponíveis em Registros."
            : "Estamos consultando o Mercado Pago. Esta página atualiza automaticamente após a aprovação."}
        </p>
        {!approved && confirmationError && (
          <p className="payment-result-warning">
            Ainda não foi possível concluir a confirmação.
            <br />
            <small>Detalhe técnico: {confirmationError}</small>
          </p>
        )}
        <Link to="/clubedascolecionadoras/registros" className="btn">
          <PackageOpen size={16} />
          {approved ? "Abrir meus pedidos" : "Acompanhar pedidos"}
        </Link>
      </section>
    </main>
  );
}
