
import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
}

const steps = [
  { id: 1, name: '현장정보' },
  { id: 2, name: '사진업로드' },
  { id: 3, name: '완료' }
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-8 px-4">
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center relative">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                currentStep >= step.id 
                  ? 'bg-[#FF6B35] text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {currentStep > step.id ? '✓' : step.id}
            </div>
            <span 
              className={`mt-2 text-xs font-medium whitespace-nowrap transition-colors duration-300 ${
                currentStep >= step.id ? 'text-[#FF6B35]' : 'text-gray-400'
              }`}
            >
              {step.name}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
              currentStep > step.id ? 'bg-[#FF6B35]' : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
