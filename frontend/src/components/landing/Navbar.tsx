import React, { useEffect, useState } from "react";
import {
  Menu,
  X,
  LogIn,
  LogOut,
  LayoutDashboard,
  User as UserIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { NavItem } from "../../types/types";
import { useAuth } from "../../contexts/AuthContext";
import logoImage from "../../assets/logo.png";

const navItems: NavItem[] = [];

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Get user's display name
  const getUserName = () => {
    if (!user) return "";
    return (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "User"
    );
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="w-full flex justify-center">
      <nav
        className={`fixed z-50 transition-all duration-900 ease-out will-change-transform ${
          isScrolled
            ? "top-4 w-[90%] max-w-2xl rounded-full bg-white/85 backdrop-blur-md border border-gray-200/50 shadow-xl shadow-black/10 py-3 px-6"
            : "top-0 w-full bg-white/0 backdrop-blur-none border-b border-transparent py-6 px-8"
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <Link
            to="/"
            className={`flex items-center group cursor-pointer ${
              isScrolled ? "gap-1" : "gap-2"
            }`}
          >
            <img
              src={logoImage}
              alt="FlowBoard Logo"
              className={`transition-all ${isScrolled ? "h-6 w-6" : "h-9 w-9"}`}
            />
            <span
              className={`font-bold tracking-tight text-gray-900 transition-all ${
                isScrolled ? "text-lg" : "text-2xl"
              }`}
            >
              <span className="font-ananda p-1">F</span>low{" "}
              <span className="font-ananda">B</span>oard
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className={`
              flex items-center gap-2 relative overflow-hidden group bg-white/60 backdrop-blur-md text-gray-700 font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-black/5 border border-gray-200/50 cursor-pointer hover:bg-white/80
              ${isScrolled ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"}
            `}
            >
              <LayoutDashboard
                className={`${isScrolled ? "w-3 h-3" : "w-4 h-4"}`}
              />
              <span className="relative z-10">Dashboard</span>
            </button>
            {user ? (
              <>
                {/* Profile Button */}
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md text-gray-700 font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-black/5 border border-gray-200/50 px-3 py-1.5">
                  <UserIcon
                    className={`${isScrolled ? "w-3 h-3" : "w-4 h-4"}`}
                  />
                  <span className={`${isScrolled ? "text-xs" : "text-sm"}`}>
                    {getUserName()}
                  </span>
                </div>
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className={`
                  flex items-center gap-2 relative overflow-hidden group bg-black/80 backdrop-blur-md text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-black/10 border border-white/10 cursor-pointer
                  ${isScrolled ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"}
                `}
                >
                  <LogOut className={`${isScrolled ? "w-3 h-3" : "w-4 h-4"}`} />
                  <span className="relative z-10">Logout</span>
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className={`
                  flex items-center gap-2 relative overflow-hidden group bg-white/60 backdrop-blur-md text-gray-700 font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-black/5 border border-gray-200/50 cursor-pointer hover:bg-white/80
                  ${isScrolled ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"}
                `}
                >
                  <LogIn className={`${isScrolled ? "w-3 h-3" : "w-4 h-4"}`} />
                  <span className="relative z-10">Login</span>
                </button>
                <button
                  onClick={() => navigate("/app")}
                  className={`
                  relative overflow-hidden group bg-black/80 backdrop-blur-md text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-black/10 border border-white/10 cursor-pointer
                  ${isScrolled ? "px-4 py-1.5 text-xs" : "px-6 py-2 text-sm"}
                `}
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu using Radix Dialog */}
          <div className="md:hidden">
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <button className="text-gray-600 hover:text-black">
                  <Menu />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed z-50 right-0 top-0 bottom-0 w-3/4 max-w-xs bg-white p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300 ease-in-out border-l border-gray-100">
                  <div className="flex justify-between items-center mb-8">
                    <span className="font-bold text-xl text-gray-900">
                      Menu
                    </span>
                    <Dialog.Close asChild>
                      <button className="text-gray-500 hover:text-black p-2 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5" />
                      </button>
                    </Dialog.Close>
                  </div>
                  <div className="flex flex-col gap-6">
                    {navItems.map((item) => (
                      <Dialog.Close key={item.label} asChild>
                        <a
                          href={item.href}
                          className="text-lg font-medium text-gray-600 hover:text-brand-pink transition-colors"
                        >
                          {item.label}
                        </a>
                      </Dialog.Close>
                    ))}
                    <Dialog.Close asChild>
                      <button
                        onClick={() => {
                          navigate("/dashboard");
                        }}
                        className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                      </button>
                    </Dialog.Close>
                    {user ? (
                      <>
                        <div className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                          <UserIcon className="w-5 h-5" />
                          {getUserName()}
                        </div>
                        <Dialog.Close asChild>
                          <button
                            onClick={handleLogout}
                            className="w-full py-3 bg-black text-white font-bold rounded-xl shadow-lg hover:bg-gray-900 transition-colors cursor-pointer flex items-center justify-center gap-2"
                          >
                            <LogOut className="w-5 h-5" />
                            Logout
                          </button>
                        </Dialog.Close>
                      </>
                    ) : (
                      <>
                        <Dialog.Close asChild>
                          <button
                            onClick={() => {
                              navigate("/login");
                            }}
                            className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
                          >
                            <LogIn className="w-5 h-5" />
                            Login
                          </button>
                        </Dialog.Close>
                        <button
                          onClick={() => {
                            navigate("/app");
                          }}
                          className="w-full py-3 bg-black text-white font-bold rounded-xl mt-4 shadow-lg hover:bg-gray-900 transition-colors cursor-pointer"
                        >
                          Get Started
                        </button>
                      </>
                    )}
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
