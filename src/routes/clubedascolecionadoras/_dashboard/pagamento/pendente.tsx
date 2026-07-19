import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, PackageOpen } from "lucide-react";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/pagamento/pendente")({
  component: PaymentPendingPage,
});

function PaymentPendingPage() {
  return (
    <main className="screen payment-result-screen">
      <section className="payment-result-card">
        <Clock size={42} />
        <h1>Pagamento pendente</h1>
        <p>
          Alguns meios de pagamento podem demorar para confirmar. Assim que o Mercado Pago aprovar,
          seus itens aparecerão em Registros.
        </p>
        <Link to="/clubedascolecionadoras/registros" className="btn">
          <PackageOpen size={16} />
          Acompanhar pedidos
        </Link>
      </section>
    </main>
  );
}
