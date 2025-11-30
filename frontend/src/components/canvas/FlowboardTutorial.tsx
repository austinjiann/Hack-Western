import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface TutorialSlideshowProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialSlideshow: React.FC<TutorialSlideshowProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Welcome to Flowboard",
      description:
        "Create beautiful 3D models and visuals in minutes with our intuitive tools.",
      videoUrl: "/demo/demo-1080p.mp4",
      tip: "Use the toolbar on the right to access all drawing tools",
    },
    {
      title: "Upload an image and annotate",
      description:
        "Select any 2D shape and press the 3D button to transform it into a 3D model.",
      videoUrl: "/demo/demo-1080p.mp4",
      tip: "Try selecting multiple shapes before converting to 3D",
    },
    {
      title: "Or draw from scratch",
      description:
        "Navigate your 3D world with orbit and first-person camera controls.",
      videoUrl: "/demo/demo-1080p.mp4",
      tip: "Switch between Orbit and First Person modes for different views",
    },
    {
      title: "Prompt and generate",
      description:
        "You're all set! Start creating your masterpiece on the canvas.",
      videoUrl: "/demo/demo-1080p.mp4",
      tip: "Export your work anytime with the Export button",
    },
    {
      title: "Create a whole story",
      description:
        "You're all set! Start creating your masterpiece on the canvas.",
      videoUrl: "/demo/demo-1080p.mp4",
      tip: "Export your work anytime with the Export button",
    },
    {
      title: "Download",
      description:
        "You're all set! Start creating your masterpiece on the canvas.",
      videoUrl: "/demo/demo-1080p.mp4",
      tip: "Export your work anytime with the Export button",
    },
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleClose();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleClose = () => {
    setCurrentSlide(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-gray-900/40 z-100"
        onClick={handleClose}
      />
      <div className="fixed z-101 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-6xl max-h-[90vh] bg-white rounded-3xl p-0 shadow-2xl overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors z-10 cursor-pointer"
          aria-label="Close tutorial"
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>

        <div className="grid md:grid-cols-2 gap-0 h-full">
          {/* Video/Demo Section */}
          <div className="bg-gray-50 p-8 flex items-center justify-center">
            <div className="w-full aspect-video bg-white rounded-2xl shadow-lg overflow-hidden border-4 border-gray-200">
              <video
                key={currentSlide}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              >
                <source src={slides[currentSlide].videoUrl} type="video/mp4" />
                {/* Fallback for demo */}
                <div className="w-full h-full bg-linear-to-br from-pink-100 to-pink-50 flex items-center justify-center">
                  <span className="text-pink-300 text-4xl">🎬</span>
                </div>
              </video>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-12 flex flex-col">
            {/* Progress Indicators */}
            <div className="flex gap-2 mb-8">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "w-12 bg-pink-500"
                      : index < currentSlide
                        ? "w-1.5 bg-pink-300"
                        : "w-1.5 bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* Slide Content */}
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-4 font-ananda">
                {slides[currentSlide].title}
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {slides[currentSlide].description}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-3 bg-pink-50 rounded-full text-sm text-pink-700 self-start">
                <span className="font-medium">{slides[currentSlide].tip}</span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-4 mt-8">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>

              <div className="text-sm text-gray-500 font-medium">
                {currentSlide + 1} / {slides.length}
              </div>

              <button
                onClick={nextSlide}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white bg-pink-500 hover:bg-pink-600 transition-colors shadow-lg shadow-pink-500/30 cursor-pointer"
              >
                {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
                {currentSlide < slides.length - 1 && (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
