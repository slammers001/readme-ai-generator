import { Sparkles } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  baseSize?: number; // Base size for sparkles, e.g., 24 or 32
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text, baseSize = 24 }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4">
      <div className="flex space-x-2">
        <Sparkles
          className="animate-pulse"
          style={{ color: 'hsl(var(--primary))', animationDelay: '0s' }}
          size={baseSize * 1.2}
        />
        <Sparkles
          className="animate-pulse"
          style={{ color: 'hsl(var(--accent))', animationDelay: '0.2s' }}
          size={baseSize * 1.5}
        />
        <Sparkles
          className="animate-pulse"
          style={{ color: 'hsl(var(--primary))', animationDelay: '0.4s' }}
          size={baseSize * 1.2}
        />
      </div>
      {text && <p className="text-lg text-center text-muted-foreground">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
