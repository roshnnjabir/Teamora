import { useEffect, useState } from "react";
import apiClient from "../../../api/apiClient";

export default function PaymentRequired() {
  const [loading, setLoading] = useState(true);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [error, setError] = useState("");

  // 🔄 Fetch tenant/payment info
  useEffect(() => {
    async function fetchInfo() {
      try {
        const res = await apiClient.get("/api/payment-info/");
        setTenantInfo(res.data);
      } catch (err) {
        console.error("Failed to fetch tenant info:", err);
        setError("Failed to fetch payment info.");
      } finally {
        setLoading(false);
      }
    }
    fetchInfo();
  }, []);

  // 💳 Trigger Stripe checkout
  const handlePayment = async () => {
    try {
      const res = await apiClient.post("/api/stripe/create-checkout-session/");
      window.location.href = res.data.checkout_url;
    } catch (err) {
      console.error("Stripe session error:", err);
      setError("Error creating checkout session.");
    }
  };

  // ⏳ Loading state
  if (loading) {
    return <p className="text-center mt-10">Loading payment details...</p>;
  }

  // ❌ Error state
  if (error) {
    return <p className="text-red-600 text-center mt-10">{error}</p>;
  }

  // ✅ UI
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-[95%] sm:w-[500px] text-center">
        <h1 className="text-2xl font-semibold mb-4">⚠️ Access Restricted</h1>
        <p className="mb-4 text-gray-700">
          {tenantInfo?.tenant_name} – Your trial has expired or payment is overdue.
        </p>
        <p className="mb-6">Please make a payment to regain access.</p>

        <button
          onClick={handlePayment}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
}