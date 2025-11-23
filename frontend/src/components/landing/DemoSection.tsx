import React, { useState, useEffect } from "react";
import { PenTool, Layers, Film } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";

const DemoSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState("0");

  const durations: Record<string, number> = {
    "0": 5000, // 5s
    "1": 3000, // 3s
    "2": 6000, // 6s
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => ((parseInt(prev) + 1) % 3).toString());
    }, durations[activeStep]);

    return () => clearInterval(interval);
  }, [activeStep]);

  const steps = [
    {
      value: "0",
      title: "Sketch Input",
      desc: "Draw instructions directly on your starting image.",
      icon: <PenTool className="w-5 h-5" />,
      visual: "./demo/demo.png",
      isVideo: false,
      overlay: (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 800 450"
        >
          <path
            d="M120 260 
         Q200 180 290 220 
         T420 240 
         Q500 300 610 180
         T720 260"
            stroke="rgba(255, 182, 193, 0.45)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1600"
            strokeDashoffset="1600"
            className="animate-[scribble_10s_ease-out_forwards]"
          />
        </svg>
      ),
    },
    {
      value: "1",
      title: "Sketch Parsing",
      desc: "Our AI interprets your strokes and text prompts.",
      icon: <Layers className="w-5 h-5" />,
      visual: "./demo/demo-blur.png",
      isVideo: false,
      overlay: (
        <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-6 bg-white/20 rounded-2xl shadow-xl">
            <div className="w-12 h-12 border-4 border-brand-pink/50 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      ),
    },
    {
      value: "2",
      title: "Video Generation",
      desc: "5s clip is generated and we automatically create the next starting frame",
      icon: <Film className="w-5 h-5" />,
      visual: "./demo/demo-1080p.mp4",
      isVideo: true,
      overlay: (
        <>
          <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-black/70 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-md">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-xs font-mono">REC 00:04:67</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const vid = document.getElementById(
                "demo-video"
              ) as HTMLVideoElement;
              if (vid) vid.muted = !vid.muted;
            }}
            className="absolute top-6 right-6 bg-black/70 text-white px-3 py-2 rounded-lg text-sm backdrop-blur-md"
          >
            Mute / Unmute
          </button>
        </>
      ),
    },
  ];

  return (
    <section id="demo" className="pt-0 pb-24 relative overflow-visible">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl lg:text-6xl mb-4 text-gray-900 leading-relaxed py-2 font-ananda!">
            From Static to Cinematic. <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-brand-pink/40 to-brand-pink/75 inline-block pb-2">
              In Seconds.
            </span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            FlowBoard parses your hand-drawn context, interprets intent with
            artificial intelligence, and generates fluid animations.
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
          <Tabs.List className="md:col-span-4 flex flex-col gap-3">
            {steps.map((step, idx) => (
              <Tabs.Trigger
                key={step.value}
                value={step.value}
                className={`text-left p-8 rounded-2xl transition-all duration-500 group outline-none ring-offset-2 focus-visible:ring-2 ring-brand-pink/75 relative overflow-hidden ${
                  activeStep === step.value
                    ? "bg-linear-to-br from-brand-pink/10 via-brand-purple/5 to-transparent shadow-xl"
                    : "bg-white/50 hover:bg-white/80 hover:shadow-md"
                }`}
              >
                {/* Step Number */}
                <div
                  className={`absolute -top-4 -right-4 text-[120px] font-bold leading-none transition-all duration-500 ${
                    activeStep === step.value
                      ? "text-brand-pink/8 scale-100"
                      : "text-gray-200/50 scale-90"
                  }`}
                >
                  {idx + 1}
                </div>

                <div className="relative z-10">
                  <div
                    className={`text-xs font-mono tracking-wider mb-3 transition-all duration-300 ${
                      activeStep === step.value
                        ? "text-brand-pink/75"
                        : "text-gray-400"
                    }`}
                  >
                    STEP {idx + 1}
                  </div>

                  <h3
                    className={`text-2xl font-bold mb-3 transition-all duration-300 ${
                      activeStep === step.value
                        ? "text-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </h3>

                  <p
                    className={`text-sm leading-relaxed transition-all duration-300 ${
                      activeStep === step.value
                        ? "text-gray-600"
                        : "text-gray-400"
                    }`}
                  >
                    {step.desc}
                  </p>

                  {activeStep === step.value && (
                    <div className="w-full h-1 bg-gray-100 mt-6 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-brand-pink/25 via-brand-pink/50 to-brand-pink/25"
                        style={{
                          width: "100%",
                          animation: `widthBar ${
                            durations[step.value]
                          }ms linear`,
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Visual Preview / Tab Content */}
          <div className="md:col-span-8">
            {steps.map((step) => (
              <Tabs.Content
                key={step.value}
                value={step.value}
                className="outline-none animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-2xl bg-gray-50 aspect-video group">
                  {step.isVideo ? (
                    <video
                      id="demo-video"
                      ref={(el) => {
                        if (el) {
                          el.oncanplay = () => {
                            el.play()
                              .then(() => {
                                el.muted = true;
                              })
                              .catch(() => {
                                el.muted = true;
                                el.play();
                              });
                          };
                        }
                      }}
                      src={step.visual}
                      autoPlay
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={step.visual}
                      alt="Demo Step"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {step.overlay}

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
        @keyframes scribble {
          from { stroke-dashoffset: 1600; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </section>
  );
};

export default DemoSection;
