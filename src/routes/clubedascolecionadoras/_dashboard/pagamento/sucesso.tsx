import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, PackageOpen } from "lucide-react";
import { z } from "zod";
import { usePaymentOrderPolling } from "@/hooks/usePaymentOrderPolling";

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
  const { order, confirmationError } = usePaymentOrderPolling(search.order, search.payment_id);

  const released =
    order?.payment_status === "approved" &&
    ["pending_opening", "partially_opened", "released"].includes(order?.fulfillment_status ?? "");

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
            Pagamento localizado, mas a liberação automática ainda não foi concluída. Tente
            atualizar em alguns segundos.
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
