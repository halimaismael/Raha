import React from 'react';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-sandDeep text-slate',
  success: 'bg-lagoon/15 text-lagoon',
  warning: 'bg-ylang/20 text-[#8a6a04]',
  danger: 'bg-red-50 text-red-600',
  info: 'bg-ocean/10 text-ocean',
};

export default function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${TONE_CLASSES[tone]}`}>
      {label}
    </span>
  );
}
