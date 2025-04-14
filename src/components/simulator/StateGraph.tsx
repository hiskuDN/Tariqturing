
import React, { useEffect, useState } from 'react';

interface Transition {
  currentState: string;
  readSymbol: string;
  nextState: string;
  writeSymbol: string;
  moveDirection: string;
}

interface StateGraphProps {
  transitions: Transition[];
  currentState: string;
}

const StateGraph: React.FC<StateGraphProps> = ({ transitions, currentState }) => {
  const [states, setStates] = useState<Set<string>>(new Set());
  const [edges, setEdges] = useState<any[]>([]);
  const [statePositions, setStatePositions] = useState<{ [key: string]: { x: number, y: number } }>({});
  
  // Extract states and build graph
  useEffect(() => {
    if (!transitions.length) return;
    
    // Extract all unique states
    const uniqueStates = new Set<string>();
    transitions.forEach(t => {
      uniqueStates.add(t.currentState);
      uniqueStates.add(t.nextState);
    });
    setStates(uniqueStates);
    
    // Group transitions by source and target
    const edgeMap = new Map();
    transitions.forEach(t => {
      const key = `${t.currentState}->${t.nextState}`;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, []);
      }
      edgeMap.get(key).push(t);
    });
    
    // Create edge objects
    const edgeList: any[] = [];
    edgeMap.forEach((transitions, key) => {
      const [source, target] = key.split('->');
      edgeList.push({
        source,
        target,
        transitions,
        isActive: source === currentState,
        label: transitions.map((t: Transition) => 
          `${t.readSymbol}→${t.writeSymbol},${t.moveDirection}`
        ).join(', ')
      });
    });
    setEdges(edgeList);
    
    // Simple circular layout for states
    const stateArray = Array.from(uniqueStates);
    const radius = 120;
    const centerX = 150;
    const centerY = 150;
    const positions: { [key: string]: { x: number, y: number } } = {};
    
    stateArray.forEach((state, i) => {
      const angle = (i / stateArray.length) * Math.PI * 2;
      positions[state] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
    setStatePositions(positions);
    
  }, [transitions, currentState]);
  
  // Find the final states (states with no outgoing transitions)
  const finalStates = Array.from(states).filter(state => 
    !transitions.some(t => t.currentState === state && t.moveDirection !== 'N')
  );
  
  // Calculate bezier curve control points
  const getBezierPath = (source: string, target: string) => {
    const sourcePos = statePositions[source];
    const targetPos = statePositions[target];
    
    if (!sourcePos || !targetPos) return '';
    
    // Self-loop
    if (source === target) {
      const { x, y } = sourcePos;
      return `M ${x} ${y-20} 
              C ${x-40} ${y-60}, ${x+40} ${y-60}, ${x} ${y-20}`;
    }
    
    // Regular edge
    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Start and end points (adjusted to be on the circle edge)
    const nodeRadius = 30;
    const startX = sourcePos.x + (dx * nodeRadius) / distance;
    const startY = sourcePos.y + (dy * nodeRadius) / distance;
    const endX = targetPos.x - (dx * nodeRadius) / distance;
    const endY = targetPos.y - (dy * nodeRadius) / distance;
    
    // Control point offset
    const offset = distance / 3;
    const midX = (sourcePos.x + targetPos.x) / 2;
    const midY = (sourcePos.y + targetPos.y) / 2;
    
    // Calculate perpendicular offset for curved lines
    const perpX = -dy / distance * offset * 0.5;
    const perpY = dx / distance * offset * 0.5;
    
    return `M ${startX} ${startY} 
            Q ${midX + perpX} ${midY + perpY}, ${endX} ${endY}`;
  };
  
  return (
    <div className="h-full w-full relative overflow-hidden">
      {/* SVG (Scalable Vector Graphics) container */}
      <svg width="100%" height="100%" viewBox="0 0 300 300"> 
        {/* Draw edges */}
        {edges.map((edge, i) => {
          const isActive = edge.source === currentState; // checks if the edge is coming out of the current state
          return (
            <g key={`edge-${i}`}>
              <path 
              // Bezier curve path for the edge
                d={getBezierPath(edge.source, edge.target)} 
                fill="none" 
                className={`transition-all duration-300 ${isActive ? 'stroke-green-500 stroke-[2px]' : 'stroke-gray-300'}`}
                markerEnd="url(#arrowhead)"
              />
              
              {/* Edge label */}
              {/* This is the text in the state circle */}
              <text 
                x="150" 
                y="150" 
                textAnchor="middle" 
                className={`text-xs ${isActive ? 'fill-green-700' : 'fill-gray-500'}`}
              >
                <textPath 
                  href={`#edge-path-${i}`} 
                  startOffset="50%"
                >
                  {edge.label}
                </textPath>
              </text>
              
              {/* Invisible path for text */}
              <path 
                id={`edge-path-${i}`}
                d={getBezierPath(edge.source, edge.target)} 
                fill="none" 
                stroke="none"
              />
            </g>
          );
        })}
        
        {/* Draw states */}
        {/* Map is like a for loop for a list of objects (states) */}
        {Array.from(states).map((state) => {
          const pos = statePositions[state];
          if (!pos) return null;
          
          const isStartState = state === 'q0';
          const isFinalState = finalStates.includes(state);
          const isCurrentState = state === currentState;
          
          return (
            <g key={`state-${state}`}>
              {/* State circle */}
              <circle 
                cx={pos.x} 
                cy={pos.y} 
                r="30"
                className={`
                  transition-all duration-300 
                  ${isCurrentState ? 'fill-green-100 stroke-green-500 stroke-2' : 'fill-white stroke-gray-300'} 
                  ${isStartState ? 'stroke-blue-500 stroke-[3px]' : ''}
                `}
              />
              
              {/* Double circle for final states */}
              {isFinalState && (
                <circle 
                  cx={pos.x} 
                  cy={pos.y} 
                  r="24"
                  fill="none"
                  className={`${isCurrentState ? 'stroke-green-500' : 'stroke-gray-300'}`}
                />
              )}
              
              {/* State label */}
              <text 
                x={pos.x} 
                y={pos.y} 
                textAnchor="middle" 
                dominantBaseline="central"
                className={`text-sm font-medium ${isCurrentState ? 'fill-green-700' : 'fill-gray-700'}`}
              >
                {state}
              </text>
            </g>
          );
        })}
        
        {/* Arrow marker definition */}
        <defs>
          <marker 
            id="arrowhead" 
            markerWidth="10" 
            markerHeight="7" 
            refX="10" 
            refY="3.5" 
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
          </marker>
        </defs>
      </svg>
    </div>
  );
};

export default StateGraph;
