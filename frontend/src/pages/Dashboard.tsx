import { Theme, DropdownMenu, Button } from "@radix-ui/themes";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import { Zap, ArrowRight, Receipt, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const backend_url = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

function Dashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [displayLimit, setDisplayLimit] = useState<number | "all">(20);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = session?.access_token;
        if (!token) return console.warn("No session");

        // Fetch profile row — contains credits
        const profileRes = await fetch(`${backend_url}/api/supabase/user`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData?.credits !== undefined) {
            setCredits(profileData.credits);
          }
        }

        // Fetch transaction log
        const transactionRes = await fetch(
          `${backend_url}/api/supabase/transactions`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (transactionRes.ok) {
          const transactionData = await transactionRes.json();
          // [{created_at, credit_usage, transaction_log_id, transaction_type, user_id}, ...]
          setTransactions(transactionData || []);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  return (
    <Theme>
      <div className="min-h-screen relative bg-white flex flex-col">
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
                  Enter Canvas
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Credit Display  */}
              <div className="grid md:grid-cols-1 gap-6 mb-12">
                <div className="bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-2xl p-8 shadow-xl shadow-black/5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-brand-pink/10 rounded-xl">
                        <Zap className="w-6 h-6 text-brand-pink" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Credit Balance
                      </h2>
                    </div>
                  </div>
                  <p className="text-lg text-gray-800 mb-6 font-medium">
                    {credits !== null
                      ? `${credits} credits remaining`
                      : "Loading credits..."}
                  </p>

                  <button
                    onClick={() => navigate("/pricing")}
                    className="w-full py-3 bg-white text-black/75 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/10 border border-gray-200 cursor-pointer"
                  >
                    Upgrade Plan
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Transaction Log */}
              <div className="bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-2xl p-8 shadow-xl shadow-black/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-pink/10 rounded-xl">
                      <Receipt className="w-6 h-6 text-brand-pink" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Transaction Log
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <span className="text-sm text-gray-500">Show:</span>
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger>
                        <Button variant="soft" color="gray" className="cursor-pointer">
                          {displayLimit === "all" ? "All" : `Last ${displayLimit}`}
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content>
                        <DropdownMenu.Item onSelect={() => setDisplayLimit(10)}>
                          Last 10
                        </DropdownMenu.Item>
                        <DropdownMenu.Item onSelect={() => setDisplayLimit(20)}>
                          Last 20
                        </DropdownMenu.Item>
                        <DropdownMenu.Item onSelect={() => setDisplayLimit(50)}>
                          Last 50
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item onSelect={() => setDisplayLimit("all")}>
                          All
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading transactions...
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No transactions yet
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Date
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Description
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Type
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(displayLimit === "all" ? transactions : transactions.slice(0, displayLimit)).map((transaction, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="py-3 px-4 text-gray-600">
                              {new Date(transaction.created_at).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-gray-900">
                              {transaction.transaction_type}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  transaction.credit_usage < 0
                                    ? "bg-green-100 text-green-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {transaction.credit_usage < 0
                                  ? "Credit"
                                  : "Purchase"}
                              </span>
                            </td>
                            <td
                              className={`py-3 px-4 text-right font-semibold ${
                                transaction.credit_usage < 0
                                  ? "text-green-600"
                                  : "text-purple-600"
                              }`}
                            >
                              {transaction.credit_usage < 0 ? "+" : "-"}
                              {Math.abs(transaction.credit_usage)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {transactions.length > 0 && (
                  <div className="mt-4 text-sm text-gray-500 text-center">
                    Showing {displayLimit === "all" ? transactions.length : Math.min(displayLimit, transactions.length)} of {transactions.length} transactions
                  </div>
                )}
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
