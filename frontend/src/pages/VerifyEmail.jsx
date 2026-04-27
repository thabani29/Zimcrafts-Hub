import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiService from "../services/api";

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setErrorMessage("No token provided");
        return;
      }

      try {
        await apiService.verifyEmail(token);
        setStatus("success");
        setErrorMessage("");
      } catch (err) {
        setStatus("error");
        setErrorMessage(err.message || "Invalid or expired link");
        setShowResend(true); // show resend option
      }
    };

    verify();
  }, [token]);

  const handleResend = async () => {
    if (!email) {
      alert("Please enter your email to resend verification link.");
      return;
    }

    try {
      await apiService.resendVerification(email); // call your resend API
      alert("Verification email resent! Check your inbox.");
    } catch (err) {
      alert(err.message || "Failed to resend verification email.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      {status === "loading" && <h2>Verifying your email...</h2>}

      {status === "success" && (
        <h2 className="text-green-600">
          ✅ Email verified successfully!
        </h2>
      )}

      {status === "error" && (
        <div className="text-center">
          <h2 className="text-red-600">❌ {errorMessage}</h2>
          {showResend && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border p-2 rounded"
              />
              <button
                onClick={handleResend}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Resend Verification Email
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;