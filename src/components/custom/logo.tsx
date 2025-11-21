
import { Wand2, ScrollText, SparklesIcon as LucideSparkles } from 'lucide-react';

const Logo = () => {
  return (
    <div className="flex flex-col items-center justify-center my-6">
      <div className="flex items-center space-x-3">
        <Wand2 size={40} className="text-primary" />
        <h1 className="text-4xl md:text-5xl readme-magic-text">ReadMeMagic</h1>
        <ScrollText size={40} className="text-primary" />
      </div>
      <div className="flex mt-1.5">
        <LucideSparkles size={20} className="text-accent animate-pulse" style={{ animationDelay: '0s' }} />
        <LucideSparkles size={14} className="text-accent animate-pulse" style={{ animationDelay: '0.2s' }} />
        <LucideSparkles size={20} className="text-accent animate-pulse" style={{ animationDelay: '0.1s' }}/>
      </div>
      <p className="mt-3 text-lg text-center text-muted-foreground">
        Craft compelling READMEs for your GitHub projects effortlessly with AI.
      </p>
    </div>
  );
};

export default Logo;
