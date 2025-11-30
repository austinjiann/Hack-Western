import { Theme } from "@radix-ui/themes";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import { CreditCard, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  // Hardcoded data for now
  const creditUsage = {
    total: 1000,
    used: 342,
    remaining: 658,
    percentage: 34.2,
  };

  const billingInfo = {
    plan: "Pro",
    nextBilling: "March 15, 2025",
    amount: "$29.99",
  };

  return (
    <Theme>
      <div className="min-h-screen relative bg-white flex flex-col">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>

        <div className="relative z-10 flex-1 flex flex-col">
          <Navbar />

          <main className="pt-32 pb-20 px-6 flex-1">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-5xl md:text-6xl font-normal text-gray-900 mb-4 font-ananda">
                    Dashboard
                  </h1>
                  <p className="text-xl text-gray-600 font-light">
                    Manage your credits and billing.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/app")}
                  className="px-6 py-3 bg-white text-black/75 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/10 border border-gray-200 cursor-pointer self-start md:self-auto"
                >
                  Create New Project
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Credit Usage & Billing Section */}
              <div className="grid md:grid-cols-2 gap-6 mb-12">
                {/* Credit Usage Card */}
                <div className="bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-2xl p-8 shadow-xl shadow-black/5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-brand-pink/10 rounded-xl">
                        <Zap className="w-6 h-6 text-brand-pink" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Credit Usage
                      </h2>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {creditUsage.used}
                      </span>
                      <span className="text-lg text-gray-500">
                        / {creditUsage.total}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      {creditUsage.remaining} credits remaining
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-brand-pink/75 to-brand-pink/25 rounded-full transition-all duration-500"
                        style={{ width: `${creditUsage.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-white text-black/75 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/10 border border-gray-200 cursor-pointer">
                    Upgrade Plan
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Billing Card */}
                <div className="bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-2xl p-8 shadow-xl shadow-black/5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-brand-pink/10 rounded-xl">
                        <CreditCard className="w-6 h-6 text-brand-pink" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Billing
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Current Plan</span>
                      <span className="font-semibold text-gray-900">
                        {billingInfo.plan}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Next Billing</span>
                      <span className="font-semibold text-gray-900">
                        {billingInfo.nextBilling}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <span className="text-gray-600">Amount</span>
                      <span className="text-2xl font-bold text-gray-900">
                        {billingInfo.amount}
                      </span>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-white text-black/75 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/10 border border-gray-200 cursor-pointer">
                    Manage Billing
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </Theme>
  );
}

export default Dashboard;
