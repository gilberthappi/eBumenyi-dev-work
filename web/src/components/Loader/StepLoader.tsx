import { FC } from 'react';

interface StepLoaderProps {
  isLoading?: boolean;
  message?: string;
}

const StepLoader: FC<StepLoaderProps> = ({ 
  isLoading = true, 
  message = "Loading..." 
}) => {
  if (!isLoading) return null;

  return (
    <div className="flex items-center justify-center min-h-[200px] py-12">
      <div className="text-center">
        <div className="relative mb-4">
          <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin mx-auto">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-blue-500 rounded-full" />
          </div>
        </div>
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
};

export default StepLoader;
