import React from 'react';
import LoadingImagenes from '@/Components/LoadingImagenes';

export default function NotificationSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <LoadingImagenes wrapperClass="w-28 h-20 flex-shrink-0 rounded overflow-hidden" forceLoading={true} overlay={false} />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-1/5 mt-2 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
