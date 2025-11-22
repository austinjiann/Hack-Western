import React, { useState, useEffect } from 'react';
import { Play, PenTool, Layers, Film } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';

const DemoSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState("0");

  // Auto-advance tabs
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        const next = (parseInt(prev) + 1) % 3;
        return next.toString();
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      value: "0",
      title: "Sketch Input",
      desc: "Draw instructions directly on your starting image.",
      icon: <PenTool className="w-5 h-5" />,
      visual: "https://picsum.photos/800/450?grayscale",
      overlay: (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <path 
            d="M 200 200 Q 300 100 500 250" 
            stroke="#ef4444" 
            strokeWidth="4" 
            fill="none" 
            strokeDasharray="1000" 
            strokeDashoffset="0"
            className="animate-[dash_2s_ease-in-out_infinite]"
          />
          <circle cx="500" cy="250" r="10" fill="#ef4444" className="animate-pulse" />
        </svg>
      )
    },
    {
      value: "1",
      title: "Sketch Parsing",
      desc: "Our AI interprets your strokes and text prompts.",
      icon: <Layers className="w-5 h-5" />,
      visual: "https://picsum.photos/800/450?blur=2",
      overlay: (
        <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm">
           <div className="flex flex-col items-center gap-4 p-6 bg-white/90 rounded-2xl shadow-xl">
             <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
             <span className="text-indigo-600 font-mono text-sm tracking-widest font-bold">PROCESSING...</span>
           </div>
        </div>
      )
    },
    {
      value: "2",
      title: "Video Generation",
      desc: "A high-fidelity 5s clip is generated. Ready to extend.",
      icon: <Film className="w-5 h-5" />,
      visual: "https://picsum.photos/800/450", 
      overlay: (
         <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-black/70 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-md">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-xs font-mono">REC 00:04:22</span>
         </div>
      )
    }
  ];

  return (
    <section id="demo" className="pt-0 pb-24 relative overflow-visible">
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-normal mb-4 tracking-tight text-gray-900 leading-relaxed py-2" style={{ fontFamily: 'Ananda, sans-serif' }}>
            From Static to Cinematic. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 inline-block pb-2">
              In Seconds.
            </span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            FlowBoard parses your hand-drawn context, interprets intent with artificial intelligence, and generates fluid animations.
          </p>
        </div>

        {/* Radix Tabs Implementation */}
        <Tabs.Root 
          value={activeStep} 
          onValueChange={setActiveStep}
          orientation="vertical"
          className="grid md:grid-cols-12 gap-8 items-center"
        >
           {/* Steps Sidebar / Tab List */}
           <Tabs.List className="md:col-span-4 flex flex-col gap-4">
              {steps.map((step) => (
                <Tabs.Trigger
                  key={step.value}
                  value={step.value}
                  className={`text-left p-6 rounded-2xl border transition-all duration-300 group outline-none ring-offset-2 focus-visible:ring-2 ring-indigo-500 ${
                    activeStep === step.value
                      ? 'bg-white border-indigo-200 shadow-lg shadow-indigo-500/5' 
                      : 'bg-transparent border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className={`p-2 rounded-lg transition-colors ${activeStep === step.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {step.icon}
                    </div>
                    <h3 className={`font-semibold transition-colors ${activeStep === step.value ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 pl-[3.25rem]">
                    {step.desc}
                  </p>
                  {activeStep === step.value && (
                    <div className="w-full h-1 bg-gray-100 mt-4 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 animate-[width_4s_linear]" style={{width: '100%'}}></div>
                    </div>
                  )}
                </Tabs.Trigger>
              ))}
           </Tabs.List>

           {/* Visual Preview / Tab Content */}
           <div className="md:col-span-8">
             {steps.map((step) => (
                <Tabs.Content key={step.value} value={step.value} className="outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-2xl bg-gray-50 aspect-video group">
                    {/* Main Image */}
                    <img 
                      src={step.visual} 
                      alt="Demo Step" 
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Step Overlay content */}
                    {step.overlay}

                    {/* Static UI Elements */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-400 shadow-sm" />
                          <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm" />
                          <div className="w-3 h-3 rounded-full bg-green-400 shadow-sm" />
                        </div>
                    </div>
                  </div>
                </Tabs.Content>
             ))}
           </div>
        </Tabs.Root>
      </div>
      
      <style>{`
        @keyframes width {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
          from {
            stroke-dashoffset: 1000;
          }
        }
      `}</style>
    </section>
  );
};

export default DemoSection;
