import { Theme } from "@radix-ui/themes";
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { CreditCard, Zap, Calendar, FileVideo, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();

  // Hardcoded data for now
  const creditUsage = {
    total: 1000,
    used: 342,
    remaining: 658,
    percentage: 34.2
  };

  const billingInfo = {
    plan: "Pro",
    nextBilling: "March 15, 2025",
    amount: "$29.99"
  };

  const pastProjects = [
    {
      id: 1,
      name: "Product Launch Video",
      date: "Feb 28, 2025",
      duration: "2:34",
      thumbnail: "https://via.placeholder.com/300x200"
    },
    {
      id: 2,
      name: "Marketing Campaign",
      date: "Feb 25, 2025",
      duration: "1:45",
      thumbnail: "https://via.placeholder.com/300x200"
    },
    {
      id: 3,
      name: "Tutorial Series",
      date: "Feb 20, 2025",
      duration: "4:12",
      thumbnail: "https://via.placeholder.com/300x200"
    },
    {
      id: 4,
      name: "Brand Story",
      date: "Feb 15, 2025",
      duration: "3:21",
      thumbnail: "https://via.placeholder.com/300x200"
    }
  ];

  return (
    <Theme>
      <div className="min-h-screen relative bg-white">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="relative z-10">
          <Navbar />
          
          <main className="pt-32 pb-20 px-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-5xl md:text-6xl font-normal text-gray-900 mb-4 font-ananda">
                    Dashboard
                  </h1>
                  <p className="text-xl text-gray-600 font-light">
                    Manage your credits, billing, and past projects
                  </p>
                </div>
                <button
                  onClick={() => navigate('/app')}
                  className="px-6 py-3 bg-black/80 backdrop-blur-md text-white font-semibold rounded-xl hover:bg-black transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/10 border border-white/10 cursor-pointer self-start md:self-auto"
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
                      <div className="p-3 bg-brand-indigo/10 rounded-xl">
                        <Zap className="w-6 h-6 text-brand-indigo" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Credit Usage</h2>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-bold text-gray-900">{creditUsage.used}</span>
                      <span className="text-lg text-gray-500">/ {creditUsage.total}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      {creditUsage.remaining} credits remaining
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-brand-indigo to-brand-purple rounded-full transition-all duration-500"
                        style={{ width: `${creditUsage.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-black/80 backdrop-blur-md text-white font-semibold rounded-xl hover:bg-black transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/10 border border-white/10 cursor-pointer">
                    Upgrade Plan
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Billing Card */}
                <div className="bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-2xl p-8 shadow-xl shadow-black/5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-brand-purple/10 rounded-xl">
                        <CreditCard className="w-6 h-6 text-brand-purple" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Billing</h2>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Current Plan</span>
                      <span className="font-semibold text-gray-900">{billingInfo.plan}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Next Billing</span>
                      <span className="font-semibold text-gray-900">{billingInfo.nextBilling}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <span className="text-gray-600">Amount</span>
                      <span className="text-2xl font-bold text-gray-900">{billingInfo.amount}</span>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/5 cursor-pointer">
                    Manage Billing
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Past Projects Section */}
              <div className="bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-2xl p-8 shadow-xl shadow-black/5">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-pink/10 rounded-xl">
                      <FileVideo className="w-6 h-6 text-brand-pink" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Past Projects</h2>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {pastProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => navigate('/app')}
                      className="group bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-gray-300"
                    >
                      <div className="relative mb-4 rounded-lg overflow-hidden bg-gray-100 aspect-video">
                        <img
                          src={project.thumbnail}
                          alt={project.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                          {project.duration}
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-brand-indigo transition-colors">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{project.date}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {pastProjects.length === 0 && (
                  <div className="text-center py-12">
                    <FileVideo className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No projects yet</p>
                    <button
                      onClick={() => navigate('/app')}
                      className="mt-4 px-6 py-3 bg-black/80 backdrop-blur-md text-white font-semibold rounded-xl hover:bg-black transition-all duration-200 shadow-lg shadow-black/10 border border-white/10 cursor-pointer"
                    >
                      Create Your First Project
                    </button>
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

