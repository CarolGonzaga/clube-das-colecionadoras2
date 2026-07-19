import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import crypto from "crypto";

export const APIRoute = createAPIFileRoute("/api/webhooks/mercado-pago")({
  POST: async ({ request }) => {
    try {
      const signatureHeader = request.headers.get("x-signature");
      const requestId = request.headers.get("x-request-id");

      const payloadText = await request.text();
      let payload;
      try {
        payload = JSON.parse(payloadText);
      } catch (e) {
        return json({ error: "Invalid JSON" }, { status: 400 });
      }

      const dataId = payload?.data?.id;

      if (!signatureHeader || !requestId || !dataId) {
        return json({ error: "Missing headers or data.id" }, { status: 400 });
      }

      // Extrai ts e v1 de x-signature (ex: ts=1689260124,v1=0a1b2c3d4e5f...)
      const parts = signatureHeader.split(",");
      let ts = "";
      let v1 = "";
      for (const part of parts) {
        const [key, value] = part.split("=");
        if (key === "ts") ts = value;
        if (key === "v1") v1 = value;
      }

      const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
      if (!secret) {
        throw new Error("MERCADO_PAGO_WEBHOOK_SECRET is not set");
      }

      const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
      const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

      if (hmac !== v1) {
        return json({ error: "Invalid signature" }, { status: 403 });
      }

      // Assinatura válida! Importar supabase admin para burlar RLS (é um webhook do servidor)
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      // Chamar a RPC do Supabase para processar o pagamento e liberar as figurinhas
      const { error } = await supabaseAdmin.rpc("process_mercado_pago_payment", {
        payment_payload: {
          ...payload,
          x_request_id: requestId,
          x_signature: signatureHeader,
        },
      });

      if (error) {
        console.error("Webhook Supabase RPC error:", error);
        return json(
          { error: "Database processing failed", details: error.message },
          { status: 500 },
        );
      }

      return json({ success: true, processed: true }, { status: 200 });
    } catch (err) {
      console.error("Webhook processing error:", err);
      return json({ error: "Internal Server Error" }, { status: 500 });
    }
  },
});
