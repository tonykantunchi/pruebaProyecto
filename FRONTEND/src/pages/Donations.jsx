import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const STRIPE_PUBLIC_KEY =
  process.env.REACT_APP_STRIPE_PK || "pk_test_TU_CLAVE_PUBLICA_AQUI";

const CURRENCIES = {
  MXN: {
    code: "MXN",
    symbol: "$",
    flag: "🇲🇽",
    country: "México",
    amounts: [50, 100, 200, 500, 1000],
    min: 20,
    placeholder: "Ej. 150",
  },
  COP: {
    code: "COP",
    symbol: "$",
    flag: "🇨🇴",
    country: "Colombia",
    amounts: [5000, 10000, 25000, 50000, 100000],
    min: 2000,
    placeholder: "Ej. 15000",
  },
};

export default function Donations() {
  const [currency, setCurrency] = useState("MXN");
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [step, setStep] = useState("form"); // 'form' | 'payment' | 'success' | 'error'
  const [loading, setLoading] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeError, setStripeError] = useState("");
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);
  const cardRef = useRef(null);
  const cardMounted = useRef(false);

  const cur = CURRENCIES[currency];
  const finalAmount =
    selectedAmount ||
    (customAmount ? Number(String(customAmount).replace(/\D/g, "")) : 0);

  // Cargar Stripe.js
  useEffect(() => {
    if (window.Stripe) {
      stripeRef.current = window.Stripe(STRIPE_PUBLIC_KEY);
      setStripeReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.onload = () => {
      stripeRef.current = window.Stripe(STRIPE_PUBLIC_KEY);
      setStripeReady(true);
    };
    document.head.appendChild(script);
  }, []);

  // Montar tarjeta al entrar al paso de pago
  useEffect(() => {
    if (step !== "payment" || !stripeReady || cardMounted.current) return;
    const elements = stripeRef.current.elements();
    elementsRef.current = elements;
    const card = elements.create("card", {
      style: {
        base: {
          fontFamily: "Merriweather, serif",
          fontSize: "16px",
          color: "#123C69",
          "::placeholder": { color: "#a0aec0" },
        },
        invalid: { color: "#e53e3e" },
      },
      hidePostalCode: true,
    });
    card.mount("#stripe-card-element");
    cardRef.current = card;
    cardMounted.current = true;
    card.on("change", (e) => setStripeError(e.error ? e.error.message : ""));
  }, [step, stripeReady]);

  useEffect(() => {
    return () => {
      if (cardRef.current) {
        cardRef.current.destroy();
        cardRef.current = null;
        cardMounted.current = false;
      }
    };
  }, []);

  function handleCurrencyChange(code) {
    setCurrency(code);
    setSelectedAmount(null);
    setCustomAmount("");
  }

  function handleCustomAmountChange(e) {
    const raw = e.target.value.replace(/\D/g, "");
    setCustomAmount(raw);
    setSelectedAmount(null);
  }

  function handleNext() {
    if (finalAmount < cur.min) return;
    cardMounted.current = false;
    setStep("payment");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripeReady || !cardRef.current) return;
    setLoading(true);
    setStripeError("");
    try {
      /* ── Producción: descomenta y conecta tu backend ──
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount, currency: currency.toLowerCase() }),
      });
      const { clientSecret } = await res.json();
      const { error } = await stripeRef.current.confirmCardPayment(clientSecret, {
        payment_method: { card: cardRef.current },
      });
      if (error) throw new Error(error.message);
      ─────────────────────────────────────────────── */
      await new Promise((res) => setTimeout(res, 1800)); // simulación
      setStep("success");
    } catch (err) {
      setStripeError(err.message || "Error al procesar el pago.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-transparent relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #FFB600 0%, transparent 70%)" }} />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #C0574A 0%, transparent 70%)" }} />
      </div>

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 relative z-10">
        <Link to="/"
          className="inline-flex items-center gap-2 text-[#123C69] font-medium mb-8 hover:opacity-70 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al inicio
        </Link>

        {/* ── SELECTOR DE MONTO ── */}
        {step === "form" && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-[#e8cdbb]/60 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C0574A]/10 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 fill-[#C0574A]" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-[#123C69]" style={{ fontFamily: "Merriweather, serif" }}>
                Apoya a Illari
              </h1>
              <p className="mt-2 text-[#123C69]/60 text-sm">
                Tu donación mantiene este espacio accesible para todos.
              </p>
            </div>

            {/* Moneda */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#123C69] mb-2">Moneda</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(CURRENCIES).map((c) => (
                  <button key={c.code} onClick={() => handleCurrencyChange(c.code)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition font-medium
                      ${currency === c.code
                        ? "border-[#C0574A] bg-[#C0574A]/10 text-[#C0574A]"
                        : "border-[#e0c2a5] bg-white/60 text-[#123C69] hover:border-[#C0574A]/40"}`}>
                    <span className="text-2xl">{c.flag}</span>
                    <div className="text-left">
                      <div className="text-sm font-bold">{c.code}</div>
                      <div className="text-xs opacity-70">{c.country}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Montos rápidos */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#123C69] mb-2">Monto</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {cur.amounts.map((amt) => (
                  <button key={amt}
                    onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
                    className={`py-2 px-1 rounded-xl border-2 text-sm font-semibold transition
                      ${selectedAmount === amt
                        ? "border-[#FFB600] bg-[#FFB600] text-white shadow-md"
                        : "border-[#e0c2a5] bg-white/60 text-[#123C69] hover:border-[#FFB600]/60"}`}>
                    {cur.symbol}{Number(amt).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Monto personalizado */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-[#123C69] mb-2">
                Otro monto{" "}
                <span className="font-normal text-[#123C69]/50">
                  (mín. {cur.symbol}{Number(cur.min).toLocaleString()} {cur.code})
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#123C69]/40 font-bold">{cur.symbol}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={cur.placeholder}
                  value={customAmount ? Number(customAmount).toLocaleString() : ""}
                  onChange={handleCustomAmountChange}
                  className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-[#e0c2a5] bg-white/80 text-[#123C69] focus:outline-none focus:border-[#FFB600] transition"
                />
              </div>
            </div>

            {finalAmount >= cur.min && (
              <div className="mb-6 p-4 rounded-2xl bg-[#EEDBB8]/60 border border-[#e0c2a5] text-center">
                <span className="text-[#123C69]/60 text-xs block mb-1">Vas a donar</span>
                <span className="text-2xl font-bold text-[#C0574A]" style={{ fontFamily: "Merriweather, serif" }}>
                  {cur.symbol}{Number(finalAmount).toLocaleString()} {cur.code}
                </span>
              </div>
            )}

            <button onClick={handleNext} disabled={finalAmount < cur.min}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200
                ${finalAmount >= cur.min
                  ? "bg-[#C0574A] hover:bg-[#A84639] text-white shadow-xl shadow-[#C0574A]/30 hover:scale-[1.02]"
                  : "bg-[#e0c2a5]/60 text-[#123C69]/40 cursor-not-allowed"}`}>
              Continuar →
            </button>

            <p className="mt-4 text-center text-[#123C69]/40 text-xs flex items-center justify-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Pago seguro con Stripe · SSL
            </p>
          </div>
        )}

        {/* ── TARJETA ── */}
        {step === "payment" && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-[#e8cdbb]/60 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#123C69]" style={{ fontFamily: "Merriweather, serif" }}>
                Datos de pago
              </h2>
              <p className="text-[#123C69]/60 text-sm mt-1">
                Donando{" "}
                <span className="font-bold text-[#C0574A]">
                  {cur.symbol}{Number(finalAmount).toLocaleString()} {cur.code}
                </span>
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#123C69] mb-2">Tarjeta</label>
                <div id="stripe-card-element"
                  className="px-4 py-4 rounded-xl border-2 border-[#e0c2a5] bg-white/90 min-h-[48px]" />
                {stripeError && <p className="text-red-500 text-sm mt-2">{stripeError}</p>}
              </div>

              <div className="mb-6 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-600">
                🧪 <strong>Modo prueba:</strong> usa{" "}
                <code className="font-mono bg-blue-100 px-1 rounded">4242 4242 4242 4242</code>
                {" "}· fecha futura · cualquier CVC
              </div>

              <div className="flex gap-3">
                <button type="button"
                  onClick={() => { setStep("form"); cardMounted.current = false; }}
                  className="flex-1 py-3 rounded-2xl border-2 border-[#e0c2a5] text-[#123C69] font-semibold hover:bg-[#EEDBB8]/40 transition">
                  ← Volver
                </button>
                <button type="submit" disabled={loading || !stripeReady}
                  className={`flex-1 py-3 rounded-2xl font-bold text-white transition-all duration-200
                    ${loading
                      ? "bg-[#C0574A]/60 cursor-not-allowed"
                      : "bg-[#C0574A] hover:bg-[#A84639] shadow-lg hover:scale-[1.02]"}`}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                        <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Procesando...
                    </span>
                  ) : (
                    `Donar ${cur.symbol}${Number(finalAmount).toLocaleString()}`
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── ÉXITO ── */}
        {step === "success" && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-[#e8cdbb]/60 p-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-[#123C69] mb-3" style={{ fontFamily: "Merriweather, serif" }}>
              ¡Gracias!
            </h2>
            <p className="text-[#123C69]/70 mb-8">
              Tu donación de{" "}
              <span className="font-bold text-[#C0574A]">
                {cur.symbol}{Number(finalAmount).toLocaleString()} {cur.code}
              </span>{" "}
              fue procesada exitosamente. 🤍
            </p>
            <Link to="/"
              className="inline-block px-8 py-3 rounded-full bg-[#123C69] hover:bg-[#0e2f55] text-white font-bold transition">
              Volver al inicio
            </Link>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === "error" && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-red-200/60 p-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#123C69] mb-3" style={{ fontFamily: "Merriweather, serif" }}>
              Algo salió mal
            </h2>
            <p className="text-red-500 text-sm mb-8">{stripeError || "Error al procesar el pago."}</p>
            <button
              onClick={() => { setStep("payment"); cardMounted.current = false; }}
              className="px-8 py-3 rounded-full bg-[#C0574A] hover:bg-[#A84639] text-white font-bold transition">
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </main>
  );
}