import React, { useState } from "react";
import { Menu, X, Home, LayoutDashboard, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";

export const CanvasNavigationMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    {
      label: "Homepage",
      icon: Home,
      path: "/",
      onClick: () => {
        navigate("/");
        setIsOpen(false);
      },
    },
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      onClick: () => {
        navigate("/dashboard");
        setIsOpen(false);
      },
    },
    {
      label: "Login",
      icon: LogIn,
      path: "/login",
      onClick: () => {
        navigate("/login");
        setIsOpen(false);
      },
    },
  ];

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          className="fixed bottom-6 left-6 z-50 p-4 bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-xl shadow-black/10 hover:bg-white/80 transition-all duration-200 cursor-pointer group"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6 text-gray-700 group-hover:text-gray-900 transition-colors" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed z-50 bottom-24 left-6 w-64 bg-white/90 backdrop-blur-md border border-gray-200/50 rounded-2xl p-4 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300 ease-in-out">
          <div className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Dialog.Close key={item.path} asChild>
                  <button
                    onClick={item.onClick}
                    className="flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:text-gray-900 hover:bg-gray-100/50 rounded-xl transition-all duration-200 cursor-pointer group"
                  >
                    <Icon className="w-5 h-5 text-gray-500 group-hover:text-brand-indigo transition-colors" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </Dialog.Close>
              );
            })}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

