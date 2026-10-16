/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackTitle?: string;
  className?: string;
  imageClassName?: string;
  aspectRatioClass?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = 'Fashion imagery',
  fallbackTitle = 'MyStyle Editorial',
  className = '',
  imageClassName = '',
  aspectRatioClass = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`w-full h-full min-h-[140px] flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#F6F2EC] via-[#E5CDBE]/30 to-[#F6F2EC] border border-[#242326]/5 ${aspectRatioClass} ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="w-9 h-9 rounded-full bg-[#E5CDBE]/50 flex items-center justify-center text-[#9C6A61] mb-2">
          <Sparkles className="w-4 h-4" />
        </div>
        <p className="text-xs font-serif italic text-[#242326]/80 tracking-wide">
          {fallbackTitle}
        </p>
        <span className="text-[10px] text-[#5C585E] mt-0.5">High-fashion curation</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden w-full h-full ${aspectRatioClass} ${className}`}>
      {/* Skeleton / Ambient background while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-[#E5CDBE]/25 animate-pulse transition-opacity duration-300" />
      )}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${imageClassName}`}
        {...props}
      />
    </div>
  );
};
