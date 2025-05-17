import type { SVGProps } from 'react';
import { Droplets } from 'lucide-react';

interface AppLogoProps {
  size?: 'compact' | 'large';
  className?: string;
}

const WaterDropIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
  </svg>
);


export function AppLogo({ size = 'compact', className }: AppLogoProps) {
  const isLarge = size === 'large';

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center">
        <WaterDropIcon 
          className={`${isLarge ? 'h-12 w-12 mr-3' : 'h-8 w-8 mr-2'} text-primary`} 
        />
        <h1 className={`font-bold ${isLarge ? 'text-4xl' : 'text-2xl'} text-primary`}>
          AquaGuard
        </h1>
      </div>
      {isLarge && (
        <p className="text-sm text-muted-foreground mt-1">
          Water Quality Monitoring
        </p>
      )}
    </div>
  );
}
