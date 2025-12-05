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
  const [scrollProgress, setScrollProgress] = useState(0);
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
      // Calculate scroll progress from 0 to 1
      // Start shrinking after 50px, fully shrunk at 275px
      const scrollStart = 50;
      const scrollEnd = 500;
      const scrollY = window.scrollY;
      
      if (scrollY < scrollStart) {
        setScrollProgress(0);
      } else if (scrollY > scrollEnd) {
        setScrollProgress(1);
      } else {
        // Linear interpolation between scrollStart and scrollEnd
        setScrollProgress((scrollY - scrollStart) / (scrollEnd - scrollStart));
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Interpolate values based on scroll progress
  const interpolate = (start: number, end: number, progress: number) => {
    return start + (end - start) * progress;
  };

  // Calculate interpolated values
  const top = interpolate(0, 16, scrollProgress); // 0px to 16px (top-4)
  const width = interpolate(100, 90, scrollProgress); // 100% to 90%
  const maxWidthPx = interpolate(10000, 672, scrollProgress); // Large value (effectively no max) to 672px (max-w-2xl)
  const paddingY = interpolate(24, 12, scrollProgress); // py-6 (24px) to py-3 (12px)
  const paddingX = interpolate(32, 24, scrollProgress); // px-8 (32px) to px-6 (24px)
  const borderRadius = interpolate(0, 9999, scrollProgress); // 0 to full rounded
  const bgOpacity = interpolate(0, 85, scrollProgress); // 0% to 85%
  const borderOpacity = interpolate(0, 50, scrollProgress); // 0% to 50%
  const shadowOpacity = interpolate(0, 10, scrollProgress); // 0% to 10%
  const backdropBlur = scrollProgress > 0 ? 'blur-md' : 'blur-none';

  return (
    <div className="w-full flex justify-center">
      <nav
        className="fixed z-50 transition-all duration-300 ease-out will-change-transform"
        style={{
          top: `${top}px`,
          width: `${width}%`,
          maxWidth: `${maxWidthPx}px`,
          paddingTop: `${paddingY}px`,
          paddingBottom: `${paddingY}px`,
          paddingLeft: `${paddingX}px`,
          paddingRight: `${paddingX}px`,
          borderRadius: `${borderRadius}px`,
          backgroundColor: `rgba(255, 255, 255, ${bgOpacity / 100})`,
          backdropFilter: backdropBlur,
          border: `1px solid rgba(229, 231, 235, ${borderOpacity / 100})`,
          boxShadow: `0 20px 25px -5px rgba(0, 0, 0, ${shadowOpacity / 100}), 0 10px 10px -5px rgba(0, 0, 0, ${shadowOpacity / 100})`,
        }}
      >
        <div className="flex items-center justify-between w-full">
          <Link
            to="/"
            className="flex items-center group cursor-pointer transition-all duration-300"
            style={{
              gap: `${interpolate(8, 4, scrollProgress)}px`
            }}
          >
            <img
              src={logoImage}
              alt="FlowBoard Logo"
              className="transition-all duration-300"
              style={{
                height: `${interpolate(36, 24, scrollProgress)}px`,
                width: `${interpolate(36, 24, scrollProgress)}px`
              }}
            />
            <span
              className="font-bold tracking-tight text-gray-900 transition-all duration-300"
              style={{
                fontSize: `${interpolate(24, 18, scrollProgress)}px`
              }}
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
              className="flex items-center gap-2 relative overflow-hidden group bg-white/60 backdrop-blur-md text-gray-700 font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-black/5 hover:shadow-black/10 border border-gray-200/50 cursor-pointer hover:bg-white/80"
              style={{
                paddingLeft: `${interpolate(16, 12, scrollProgress)}px`,
                paddingRight: `${interpolate(16, 12, scrollProgress)}px`,
                paddingTop: `${interpolate(8, 6, scrollProgress)}px`,
                paddingBottom: `${interpolate(8, 6, scrollProgress)}px`,
                fontSize: `${interpolate(14, 12, scrollProgress)}px`
              }}
            >
              <LayoutDashboard
                className="transition-all duration-300"
                style={{
                  width: `${interpolate(16, 12, scrollProgress)}px`,
                  height: `${interpolate(16, 12, scrollProgress)}px`
                }}
              />
              <span className="relative z-10">Dashboard</span>
            </button>
            {user ? (
              <>
                {/* Profile Button */}
                <div 
                  className="flex items-center gap-2 bg-white/60 backdrop-blur-md text-gray-700 font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-black/5 border border-gray-200/50"
                  style={{
                    paddingLeft: `${interpolate(12, 12, scrollProgress)}px`,
                    paddingRight: `${interpolate(12, 12, scrollProgress)}px`,
                    paddingTop: `${interpolate(8, 6, scrollProgress)}px`,
                    paddingBottom: `${interpolate(8, 6, scrollProgress)}px`
                  }}
                >
                  <UserIcon
                    className="transition-all duration-300"
                    style={{
                      width: `${interpolate(16, 12, scrollProgress)}px`,
                      height: `${interpolate(16, 12, scrollProgress)}px`
                    }}
                  />
                  <span 
                    className="transition-all duration-300"
                    style={{
                      fontSize: `${interpolate(14, 12, scrollProgress)}px`
                    }}
                  >
                    {getUserName()}
                  </span>
                </div>
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 relative overflow-hidden group bg-black/80 backdrop-blur-md text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-black/10 hover:shadow-black/20 border border-white/10 cursor-pointer"
                  style={{
                    paddingLeft: `${interpolate(16, 12, scrollProgress)}px`,
                    paddingRight: `${interpolate(16, 12, scrollProgress)}px`,
                    paddingTop: `${interpolate(8, 6, scrollProgress)}px`,
                    paddingBottom: `${interpolate(8, 6, scrollProgress)}px`,
                    fontSize: `${interpolate(14, 12, scrollProgress)}px`
                  }}
                >
                  <LogOut 
                    className="transition-all duration-300"
                    style={{
                      width: `${interpolate(16, 12, scrollProgress)}px`,
                      height: `${interpolate(16, 12, scrollProgress)}px`
                    }}
                  />
                  <span className="relative z-10">Logout</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center gap-2 relative overflow-hidden group bg-white/60 backdrop-blur-md text-gray-700 font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-black/5 hover:shadow-black/10 border border-gray-200/50 cursor-pointer hover:bg-white/80"
                  style={{
                    paddingLeft: `${interpolate(16, 12, scrollProgress)}px`,
                    paddingRight: `${interpolate(16, 12, scrollProgress)}px`,
                    paddingTop: `${interpolate(8, 6, scrollProgress)}px`,
                    paddingBottom: `${interpolate(8, 6, scrollProgress)}px`,
                    fontSize: `${interpolate(14, 12, scrollProgress)}px`
                  }}
                >
                  <LogIn 
                    className="transition-all duration-300"
                    style={{
                      width: `${interpolate(16, 12, scrollProgress)}px`,
                      height: `${interpolate(16, 12, scrollProgress)}px`
                    }}
                  />
                  <span className="relative z-10">Login</span>
                </button>
                <button
                  onClick={() => navigate("/app")}
                  className="relative overflow-hidden group bg-black/80 backdrop-blur-md text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-black/10 hover:shadow-black/20 border border-white/10 cursor-pointer"
                  style={{
                    paddingLeft: `${interpolate(24, 16, scrollProgress)}px`,
                    paddingRight: `${interpolate(24, 16, scrollProgress)}px`,
                    paddingTop: `${interpolate(8, 6, scrollProgress)}px`,
                    paddingBottom: `${interpolate(8, 6, scrollProgress)}px`,
                    fontSize: `${interpolate(14, 12, scrollProgress)}px`
                  }}
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
