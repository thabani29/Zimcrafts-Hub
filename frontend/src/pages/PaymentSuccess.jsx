import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import apiService from "../services/api";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("Confirming your Paynow payment...");

  useEffect(() => {
    const reference = searchParams.get("reference");

    if (!reference) {
      setStatus("error");
      setMessage("Missing payment reference. We could not verify your payment.");
      return;
    }

    let isActive = true;
    let timeoutId = null;
    let attempts = 0;

    const confirmPayment = async () => {
      try {
        const res = await apiService.confirmPaynowCheckout(reference);
        const payload = res?.data || res;

        if (payload?.paymentStatus === "paid" && payload?.orderId) {
          clearCart();
          navigate(`/order-success/${payload.orderId}`, { replace: true });
          return;
        }

        if (payload?.paymentStatus === "pending") {
          if (!isActive) return;
          setStatus("pending");
          setMessage("Your payment is still being processed. We are checking again automatically...");
          attempts += 1;

          if (attempts < 8) {
            timeoutId = window.setTimeout(confirmPayment, 4000);
          }
          return;
        }

        if (!isActive) return;
        setStatus("failed");
        setMessage("Your payment was not completed, so the order was not created.");
      } catch (error) {
        if (!isActive) return;
        setStatus("error");
        setMessage(error.message || "We could not confirm your payment.");
      }
    };

    confirmPayment();

    return () => {
      isActive = false;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [clearCart, navigate, searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-[0_25px_75px_-35px_rgba(15,23,42,0.2)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-orange/10 text-3xl font-semibold text-primary-orange">
          {status === "checking" ? "..." : status === "failed" || status === "error" ? "!" : "OK"}
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Paynow Payment</h1>
        <p className="mt-4 text-slate-600">{message}</p>

        {status !== "checking" && (
          <div className="mt-8 space-y-3">
            <Link
              to="/orders"
              className="block rounded-full bg-primary-orange px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-brown"
            >
              View my orders
            </Link>
            <Link
              to="/checkout"
              className="block rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
