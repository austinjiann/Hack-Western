import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { NavItem } from '../types';

const navItems: NavItem[] = [];

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="w-full flex justify-center">
      <nav
        className={`fixed z-50 transition-all duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[width,padding,background,border-radius] ${
          isScrolled
            ? 'top-4 w-[90%] max-w-2xl rounded-full bg-white/80 backdrop-blur-xl border border-gray-200 shadow-lg shadow-gray-200/50 py-3 px-6'
            : 'top-0 w-full bg-transparent border-b border-transparent py-6 px-8'
        }`}
      >
        <div className="flex items-center justify-between w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group cursor-pointer">
            <span className={`font-bold tracking-tight text-gray-900 transition-all ${isScrolled ? 'text-base' : 'text-xl'}`}>
              FlowBoard
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

          {/* CTA Button */}
          <div className="hidden md:block">
            <button 
              onClick={() => navigate('/app')}
              className={`
              relative overflow-hidden group bg-black/80 backdrop-blur-md text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-black/10 border border-white/10 cursor-pointer
              ${isScrolled ? 'px-4 py-1.5 text-xs' : 'px-6 py-2 text-sm'}
            `}>
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
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
                    <span className="font-bold text-xl text-gray-900">Menu</span>
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
                          className="text-lg font-medium text-gray-600 hover:text-indigo-600 transition-colors"
                        >
                          {item.label}
                        </a>
                      </Dialog.Close>
                    ))}
                    <button 
                      onClick={() => {
                        navigate('/app');
                      }}
                      className="w-full py-3 bg-black text-white font-bold rounded-xl mt-4 shadow-lg hover:bg-gray-900 transition-colors cursor-pointer">
                      Get Started
                    </button>
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