import React, { useState } from "react";
import { Menu, Home, LayoutDashboard, LogIn, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TutorialSlideshow } from "./FlowboardTutorial";

export const CanvasNavigationMenu: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    {
      label: "Home",
      icon: Home,
      onClick: () => {
        navigate("/");
        setIsMenuOpen(false);
      },
    },
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      onClick: () => {
        navigate("/dashboard");
        setIsMenuOpen(false);
      },
    },
    {
      label: "Tutorial",
      icon: BookOpen,
      onClick: () => {
        setIsMenuOpen(false);
        setTimeout(() => setIsTutorialOpen(true), 200);
      },
    },
    {
      label: "Login",
      icon: LogIn,
      onClick: () => {
        navigate("/login");
        setIsMenuOpen(false);
      },
    },
  ];

  return (
    <>
      <TutorialSlideshow isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
      
      {/* Menu Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed bottom-6 left-6 z-50 p-4 bg-white/90 backdrop-blur-md border border-pink-200/50 rounded-2xl shadow-xl shadow-pink-500/10 hover:bg-white hover:border-pink-300/50 transition-all duration-200 cursor-pointer group"
        aria-label="Open navigation menu"
      >
        <Menu className="w-6 h-6 text-gray-700 group-hover:text-pink-500 transition-colors" />
      </button>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed z-50 bottom-24 left-6 w-64 bg-white/95 backdrop-blur-md border border-pink-200/50 rounded-2xl p-4 shadow-2xl">
            <div className="flex flex-col gap-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all duration-200 cursor-pointer group"
                  >
                    <Icon className="w-5 h-5 text-gray-500 group-hover:text-pink-500 transition-colors" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
};