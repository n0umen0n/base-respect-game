import { useMemo } from 'react';
import './PalmTrees.css';

// Pure CSS animation - no React state changes = no lag
const PalmTree = ({ x, y, size, delay, cycleDuration, swayDuration }) => {
  return (
    <div 
      className="palm-tree"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        fontSize: `${size}px`,
        '--sway-duration': `${swayDuration}s`,
        '--cycle-duration': `${cycleDuration}s`,
        '--delay': `${delay}s`,
      }}
    >
      🌴
    </div>
  );
};

const PalmTrees = ({ count = 18 }) => {
  const trees = useMemo(() => {
    const result = [];
    for (let i = 0; i < count; i++) {
      // Distribute trees across the screen
      const gridCols = 6;
      const gridRows = Math.ceil(count / gridCols);
      const gridX = (i % gridCols) / gridCols;
      const gridY = Math.floor(i / gridCols) / gridRows;
      
      result.push({
        id: i,
        x: Math.max(2, Math.min(95, gridX * 100 + (Math.random() - 0.5) * 18)),
        y: Math.max(2, Math.min(92, gridY * 100 + (Math.random() - 0.5) * 15)),
        size: 100 + Math.random() * 60, // Larger: 100-160px
        delay: Math.random() * 15,  // 0-15s initial delay
        cycleDuration: 25 + Math.random() * 20, // 25-45s full cycle
        swayDuration: 2.5 + Math.random() * 1.5,
      });
    }
    return result;
  }, [count]);
  
  return (
    <div className="palm-trees-container">
      {trees.map(tree => (
        <PalmTree key={tree.id} {...tree} />
      ))}
    </div>
  );
};

export default PalmTrees;

