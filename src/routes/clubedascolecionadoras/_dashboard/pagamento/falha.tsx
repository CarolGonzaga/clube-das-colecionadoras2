import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/pagamento/falha")({
  component: PaymentFailurePage,
});

function PaymentFailurePage() {
  return (
    <main className="screen payment-result-screen">
      <section className="payment-result-card failure">
        <AlertCircle size={42} />
        <h1>Pagamento não concluído</h1>
        <p>O Mercado Pago não confirmou essa compra. Você pode voltar para a loja e tentar novamente.</p>
        <Link to="/clubedascolecionadoras/loja" className="btn">
          <ShoppingBag size={16} />
          Voltar para loja
        </Link>
      </section>
    </main>
  );
}
