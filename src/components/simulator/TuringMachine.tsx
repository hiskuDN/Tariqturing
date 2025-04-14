
import React from 'react';

interface TuringMachineProps {
  tape: string[];
  headPosition: number;
  currentState: string;
}

const TuringMachine: React.FC<TuringMachineProps> = ({ tape, headPosition, currentState }) => {
  // Calculate visible range to show around the head
  const visibleCells = 9; // Show 9 cells at once
  const halfVisible = Math.floor(visibleCells / 2);
  
  const startIndex = Math.max(0, headPosition - halfVisible);
  const visibleTape = tape.slice(startIndex, startIndex + visibleCells);
  
  // Add blank cells if needed
  while (visibleTape.length < visibleCells) {
    visibleTape.push('_');
  }
  
  // Adjust head position for the visible range
  const adjustedHeadPosition = headPosition - startIndex;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="flex">
          {/* Map is a for loop for a list of object */}
          {visibleTape.map((cell, index) => (
            <div 
              key={index} 
              className={`
                tape-cell 
                ${index === adjustedHeadPosition ? 'active' : ''}
                transform transition-all duration-300
              `}
              style={{
                transform: `scale(${index === adjustedHeadPosition ? 1.1 : 1})`,
              }}
            >
              {cell === '_' ? '' : cell}
            </div>
          ))}
        </div>
        
        {/* Head pointer */}
        <div 
          className="absolute top-full left-0 w-12 flex justify-center"
          style={{ 
            transform: `translateX(${adjustedHeadPosition * 48}px)`,
            transition: 'transform 300ms ease-in-out'
          }}
        >
          <div className="flex flex-col items-center">
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 0L15.7942 10H0.205771L8 0Z" fill="#3B82F6"/>
            </svg>
            <div className="px-2 py-1 bg-blue-500 text-white text-xs rounded font-mono">
              {currentState}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-xs text-gray-500">
        Position: {headPosition}
      </div>
    </div>
  );
};

export default TuringMachine;
