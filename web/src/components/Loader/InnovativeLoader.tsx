import { useState, useEffect } from 'react';
import { BookOpen, Lightbulb, Target, Users, Award, Clock } from 'lucide-react';

interface InnovativeLoaderProps {
  message?: string;
  tips?: string[];
  estimatedTime?: number; // in seconds
  stage?: string;
}

const defaultTips = [
  "💡 Pro tip: Take notes while learning to improve retention by 60%",
  "🎯 Did you know? Active learning increases understanding by 90%",
  "📚 Fun fact: The average person forgets 50% of new information within an hour",
  "🌟 Studies show: Breaking learning into chunks improves memory",
  "⚡ Quick tip: Review material within 24 hours to boost retention",
  "🧠 Science says: Teaching others helps you learn better too",
  "🎨 Creative learning methods increase engagement by 75%",
  "🔄 Spaced repetition is proven to improve long-term memory",
  "📱 Mobile learning can increase productivity by up to 43%",
  "🎪 Gamified learning improves motivation and completion rates"
];

const stages = [
  { icon: BookOpen, text: "Preparing your learning materials", color: "text-blue-500" },
  { icon: Target, text: "Optimizing content for your progress", color: "text-green-500" },
  { icon: Users, text: "Connecting to learning community", color: "text-purple-500" },
  { icon: Award, text: "Setting up your achievements", color: "text-yellow-500" },
  { icon: Lightbulb, text: "Personalizing your experience", color: "text-orange-500" }
];

const InnovativeLoader = ({ 
  message = "Loading your awesome content...", 
  tips = defaultTips,
  estimatedTime = 10
}: InnovativeLoaderProps) => {
  const [currentTip, setCurrentTip] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  // Initialize floating particles
  useEffect(() => {
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }));
    setParticles(newParticles);
  }, []);

  // Cycle through tips
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 3000);
    return () => clearInterval(tipInterval);
  }, [tips.length]);

  // Update progress and stages
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setTimeElapsed((prev) => {
        const newTime = prev + 0.1;
        const newProgress = Math.min((newTime / estimatedTime) * 100, 95);
        const newStageIndex = Math.floor((newProgress / 100) * stages.length);
        
        setProgress(newProgress);
        setCurrentStage(Math.min(newStageIndex, stages.length - 1));
        
        return newTime;
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [estimatedTime]);

  const CurrentStageIcon = stages[currentStage].icon;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center z-50">
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-blue-300 rounded-full opacity-30 animate-bounce"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        {/* Main loader animation */}
        <div className="relative mb-8">
          {/* Outer rotating ring */}
          <div className="w-24 h-24 border-4 border-blue-200 rounded-full animate-spin mx-auto relative">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-blue-500 rounded-full animate-spin" 
                 style={{ animationDuration: '1s' }} />
            <div className="absolute top-2 left-2 w-20 h-20 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" 
                 style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <CurrentStageIcon className={`w-8 h-8 ${stages[currentStage].color} animate-pulse`} />
            </div>
          </div>

          {/* Progress ring */}
          {/* <div className="absolute -inset-2">
            <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(59, 130, 246, 0.1)"
                strokeWidth="2"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="url(#gradient)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${progress * 2.83} ${283 - progress * 2.83}`}
                className="transition-all duration-500 ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
          </div> */}
        </div>

        {/* Progress percentage */}
        <div className="text-2xl font-bold text-gray-800 mb-2">
          {Math.round(progress)}%
        </div>

        {/* Current stage */}
        <div className="text-sm font-medium text-gray-600 mb-4 animate-fade-in">
          {stages[currentStage].text}
        </div>

        {/* Main message */}
        <h2 className="text-lg font-semibold text-gray-800 mb-6 animate-slide-in">
          {message}
        </h2>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/30 animate-pulse" />
          </div>
        </div>

        {/* Rotating tips */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-100 min-h-[60px] flex items-center justify-center">
          <div 
            key={currentTip}
            className="text-sm text-gray-700 animate-fade-in text-center"
          >
            {tips[currentTip]}
          </div>
        </div>

        {/* Time indicator */}
        <div className="flex items-center justify-center mt-4 text-xs text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          <span>{Math.round(timeElapsed)}s elapsed</span>
        </div>

        {/* Stage indicators */}
        <div className="flex justify-center mt-6 space-x-2">
          {stages.map((stage, index) => {
            const StageIcon = stage.icon;
            return (
              <div
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  index <= currentStage
                    ? 'bg-blue-500 text-white scale-110'
                    : index === currentStage + 1
                    ? 'bg-blue-100 text-blue-500 animate-pulse'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <StageIcon className="w-4 h-4" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Animated background waves */}
      {/* <div className="absolute bottom-0 left-0 w-full h-32 overflow-hidden">
        <div className="absolute -bottom-1 left-0 w-full h-16 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full animate-pulse transform scale-x-150" />
        <div className="absolute -bottom-2 left-0 w-full h-20 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-full animate-bounce transform scale-x-125" 
             style={{ animationDuration: '3s' }} />
      </div> */}
    </div>
  );
};

export default InnovativeLoader;
