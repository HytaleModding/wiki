interface HytaleModdingLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'banner' | 'auto';
}

export default function HytaleModdingLogo({
  className = '',
  size = 'md',
  variant = 'auto',
}: HytaleModdingLogoProps) {
  // Auto-determine variant based on size if not specified
  const actualVariant =
    variant === 'auto' ? (size === 'sm' ? 'icon' : 'banner') : variant;

  const sizeClasses = {
    sm: actualVariant === 'icon' ? 'h-6' : 'h-8',
    md: actualVariant === 'icon' ? 'h-8' : 'h-10',
    lg: actualVariant === 'icon' ? 'h-10' : 'h-16',
  };

  const imageSrc =
    actualVariant === 'icon'
      ? '/logo_light.png'
      : '/banner_transparent_light.png';

  const altText =
    actualVariant === 'icon' ? 'HytaleModding Logo' : 'HytaleModding Banner';

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={imageSrc}
        alt={altText}
        className={`${sizeClasses[size]} w-auto object-contain dark:brightness-0 dark:invert`}
      />
    </div>
  );
}
