import React from 'react';
import { MousePointer2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center py-32 overflow-hidden">
      
      {/* Radial Purple Glow for Hero Text */}
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 text-center">
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-normal text-gray-900 mb-4 max-w-5xl mx-auto leading-relaxed py-2" style={{ fontFamily: 'Ananda, sans-serif' }}>
          Direct Your Video <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 inline-block pb-2">
            Frame by Frame.
          </span>
        </h1>

        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
          Create a storyboard by drawing instructions on any image. FlowBoard turns your rough sketches into context-aware video clips that extend infinitely.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => navigate('/app')}
            className="w-full sm:w-auto px-8 py-4 bg-black/80 backdrop-blur-md text-white font-bold rounded-xl hover:bg-black transition-all duration-200 flex items-center justify-center gap-2 shadow-xl shadow-black/10 group border border-white/10 cursor-pointer">
            Start Creating
            <MousePointer2 className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Floating UI mockups removed */}
      </div>

    </section>
  );
};

export default Hero;