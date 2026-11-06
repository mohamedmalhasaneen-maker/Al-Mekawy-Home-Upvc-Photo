import React from 'react';

export const PhotoGridSkeleton: React.FC = () => {
  // Render 8 skeleton cards matching grid-cols-2 md:grid-cols-3 lg:grid-cols-4
  const skeletonItems = Array.from({ length: 8 });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {skeletonItems.map((_, index) => (
        <div
          key={index}
          className="relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-md flex flex-col"
        >
          {/* Image Aspect Box Skeleton */}
          <div className="relative aspect-4/3 sm:aspect-square w-full bg-slate-900/80 overflow-hidden animate-pulse">
            {/* Shimmer effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/40 to-transparent animate-[shimmer_2s_infinite]" />
            
            {/* Badge skeleton on top right */}
            <div className="absolute top-2.5 right-2.5 w-16 h-6 rounded-full bg-slate-800/70 animate-pulse" />
          </div>

          {/* Bottom Title & Info Skeleton */}
          <div className="p-3 sm:p-3.5 bg-slate-900 flex-1 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="h-4 bg-slate-800 rounded-lg w-4/5 animate-pulse" />
              <div className="h-3 bg-slate-800/60 rounded-md w-2/5 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
