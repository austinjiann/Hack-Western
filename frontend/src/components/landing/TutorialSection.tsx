import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom"; 

interface TutorialContentProps {
  onComplete?: () => void;
  className?: string;
}

export const TutorialContent: React.FC<TutorialContentProps> = ({
  onComplete,
  className = "",
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Welcome to Flowboard",
      description:
        "Create beautiful animations in minutes on our canvas",
      videoUrl: "/demo/tutorial0.mp4",
      tip: "Every user starts with a 50 credit free trial!",
    },
    {
      title: "Upload an image and annotate",
      description:
        "Select any image—use our canvas to annotate edits",
      videoUrl: "/demo/tutorial1.mp4",
      tip: "Circle areas of the image and write edits!",
    },
    {
      title: "Or draw from scratch",
      description:
        "Create your own world—use our tools to draw sketches",
      videoUrl: "/demo/tutorial2.mp4",
      tip: "Use the improve frame button to enhance sketches!",
    },
    {
      title: "Prompt and generate",
      description:
        "Craft a prompt and then generate the next frame",
      videoUrl: "/demo/tutorial3.mp4",
      tip: "Make sure the prompt is accurate to what you want to animate!",
    },
    {
      title: "Create a whole story",
      description:
        "Continue iterating over the last frame of the previous frame—create a storyboard tree.",
      videoUrl: "/demo/tutorial4.mp4",
      tip: "Our global context handles the transitions!",
    },
    {
      title: "Merge and export",
      description:
        "You're all set! Select a frame and merge",
      videoUrl: "/demo/tutorial5.mp4",
      tip: "The algorithm merges the whole story—from beginning to the selected frame!",
    },
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete?.();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className={`grid md:grid-cols-2 gap-0 h-full bg-white/60 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden ${className}`}>
      {/* Video/Demo Section */}
      <div className="bg-gray-50/50 p-8 flex items-center justify-center min-h-[300px] md:min-h-auto">
        <div className="w-full aspect-video bg-white rounded-2xl shadow-lg overflow-hidden border-4 border-gray-200/50 relative">
          <video
            key={currentSlide}
            className="w-full h-full object-cover absolute inset-0"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={slides[currentSlide].videoUrl} type="video/mp4" />
            <div className="w-full h-full bg-linear-to-br from-pink-100 to-pink-50 flex items-center justify-center">
              <span className="text-pink-300 text-4xl">🎬</span>
            </div>
          </video>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-8 md:p-12 flex flex-col">
        <div className="flex gap-2 mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-12 bg-brand-pink"
                  : index < currentSlide
                    ? "w-1.5 bg-brand-pink/40"
                    : "w-1.5 bg-gray-300"
              }`}
            />
          ))}
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-ananda">
            {slides[currentSlide].title}
          </h2>
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">
            {slides[currentSlide].description}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-3 bg-brand-pink/10 rounded-full text-sm text-brand-pink self-start mb-4 md:mb-0">
            <span className="font-medium">{slides[currentSlide].tip}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mt-8">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-gray-700 hover:bg-gray-100/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <div className="text-sm text-gray-500 font-medium hidden sm:block">
            {currentSlide + 1} / {slides.length}
          </div>

          <button
            onClick={nextSlide}
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white bg-brand-pink hover:bg-brand-pink/90 transition-colors shadow-lg shadow-brand-pink/30 cursor-pointer"
          >
            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
            {currentSlide < slides.length - 1 && (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const TutorialSection: React.FC = () => { 
  const navigate = useNavigate(); 

  return ( 
    <section className="py-20 bg-transparent relative z-10"> 
      <div className="container mx-auto px-6"> 
        <div className="max-w-6xl mx-auto"> 
          <div className="text-center mb-16"> 
            <h2 className="text-4xl md:text-5xl font-normal text-gray-900 mb-4 font-ananda"> 
              How It Works 
            </h2>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto"> 
              See how easy it is to bring your ideas to life with FlowBoard. 
            </p>
          </div>

          <TutorialContent  
            onComplete={() => navigate("/app")} 
            className="border border-gray-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)]" 
          /> 
        </div>
      </div>
    </section>
  );
}; 

export default TutorialSection; 
