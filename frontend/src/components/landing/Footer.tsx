import React from "react";
import { Star } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <p className="text-gray-500 text-xs">© 2025 FlowBoard ❤️</p>
        <a
          href="https://github.com/austinjiann/FlowBoard"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-xs"
        >
          <Star size={14} />
          Star us on GitHub !
        </a>
      </div>
    </footer>
  );
};

export default Footer;
