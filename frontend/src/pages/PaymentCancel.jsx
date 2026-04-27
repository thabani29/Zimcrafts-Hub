import React from "react";
import { Link } from "react-router-dom";

const PaymentCancel = () => {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-xl rounded-[2rem] bg-white p-10 text-center shadow-[0_25px_75px_-35px_rgba(15,23,42,0.2)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-700">
          !
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Payment Cancelled</h1>
        <p className="mt-4 text-slate-600">
          Your Paynow payment was cancelled, so your order was not completed.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            to="/checkout"
            className="block rounded-full bg-primary-orange px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-brown"
          >
            Return to checkout
          </Link>
          <Link
            to="/cart"
            className="block rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to cart
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
