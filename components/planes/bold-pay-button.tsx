"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";

type BoldCheckoutInstance = { open: () => void };

declare global {
  interface Window {
    BoldCheckout: new (config: Record<string, unknown>) => BoldCheckoutInstance;
  }
}

export function BoldPayButton({
  orderId,
  amount,
  currency,
  identityKey,
  integritySignature,
  description,
  redirectionUrl,
}: {
  orderId: string;
  amount: number;
  currency: string;
  identityKey: string;
  integritySignature: string;
  description: string;
  redirectionUrl: string;
}) {
  const [scriptReady, setScriptReady] = useState(false);
  const checkoutRef = useRef<BoldCheckoutInstance | null>(null);

  useEffect(() => {
    if (!scriptReady || typeof window.BoldCheckout === "undefined") return;

    checkoutRef.current = new window.BoldCheckout({
      orderId,
      currency,
      amount: String(amount),
      apiKey: identityKey,
      integritySignature,
      description,
      redirectionUrl,
    });
  }, [scriptReady, orderId, amount, currency, identityKey, integritySignature, description, redirectionUrl]);

  return (
    <>
      <Script src="https://checkout.bold.co/library/boldPaymentButton.js" onReady={() => setScriptReady(true)} />
      <Button
        type="button"
        className="bg-yellow-500 text-black hover:bg-yellow-600"
        disabled={!scriptReady}
        onClick={() => checkoutRef.current?.open()}
      >
        Pagar {formatCurrency(amount)}
      </Button>
    </>
  );
}
