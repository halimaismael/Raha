import React from 'react';
import { IconInbox } from './Icons';

export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 text-slate">
      <div className="w-12 h-12 rounded-full bg-sandDeep flex items-center justify-center mb-3">
        <IconInbox className="w-5 h-5" />
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
