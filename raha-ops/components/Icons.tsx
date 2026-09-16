// Jeu d'icônes minimal, cohérent (traits fins, arrondis) pour remplacer les
// emojis par un rendu identique sur tous les systèmes d'exploitation.
import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function IconDashboard(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.75" />
      <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.75" />
      <rect x="13" y="10.5" width="7.5" height="10" rx="1.75" />
      <rect x="3.5" y="13.5" width="7.5" height="7" rx="1.75" />
    </svg>
  );
}

export function IconVan(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 16V8.5a1.5 1.5 0 0 1 1.5-1.5h10L20 11.5V16" />
      <path d="M3 16h1.5M14.5 7v6.5H20" />
      <path d="M3 13.5h11.5" />
      <circle cx="7.5" cy="16.5" r="1.75" />
      <circle cx="16.5" cy="16.5" r="1.75" />
    </svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.75 19.25c0-3.45 3.25-5.5 7.25-5.5s7.25 2.05 7.25 5.5" />
    </svg>
  );
}

export function IconRoute(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="5.5" cy="6" r="2" />
      <circle cx="18.5" cy="18" r="2" />
      <path d="M5.5 8v3a3 3 0 0 0 3 3h7a3 3 0 0 1 3 3" />
    </svg>
  );
}

export function IconTicket(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 9.5a2 2 0 0 0 0-3.8V5a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v.7a2 2 0 0 0 0 3.8v1a2 2 0 0 0 0 3.8V19a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-.7a2 2 0 0 0 0-3.8Z" />
      <path d="M14.5 4.5v15" strokeDasharray="2.2 2.2" />
    </svg>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 21H5.5A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3H9" />
      <path d="M16.5 16.5 21 12l-4.5-4.5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconMapPin(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.25" />
    </svg>
  );
}

export function IconSparkle(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21M5.5 5.5l2.2 2.2M16.3 16.3l2.2 2.2M18.5 5.5l-2.2 2.2M7.7 16.3l-2.2 2.2" />
    </svg>
  );
}

export function IconBuilding(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="1.25" />
      <path d="M8 7.5h1.5M8 11h1.5M8 14.5h1.5M14.5 7.5H16M14.5 11H16M14.5 14.5H16" />
      <path d="M10.5 20.5V17a1.5 1.5 0 0 1 1.5-1.5v0A1.5 1.5 0 0 1 13.5 17v3.5" />
    </svg>
  );
}

export function IconCar(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 16v-3.2a1.5 1.5 0 0 1 .3-.9l2-2.7a2 2 0 0 1 1.6-.8h8.2a2 2 0 0 1 1.6.8l2 2.7a1.5 1.5 0 0 1 .3.9V16" />
      <path d="M4 16h16M4 16v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2M20 16v2a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-2" />
      <path d="M6.5 12.3h11" />
      <circle cx="8" cy="16" r="0.15" />
    </svg>
  );
}

export function IconCheckCircle(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.25 12.25l2.4 2.4 5.1-5.3" />
    </svg>
  );
}

export function IconStar(props: IconProps) {
  return (
    <svg {...base} fill="currentColor" stroke="none" viewBox="0 0 24 24" {...props}>
      <path d="M12 3.25l2.62 5.5 6 .78-4.4 4.16 1.14 5.9L12 16.9l-5.36 2.7 1.14-5.9-4.4-4.17 6-.78Z" />
    </svg>
  );
}

export function IconInbox(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12.5h4.2l1.1 2.2h5.4l1.1-2.2H20" />
      <path d="M5.4 5.5h13.2a1.2 1.2 0 0 1 1.16.9l1.44 6.1v5a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 17.5v-5l1.44-6.1a1.2 1.2 0 0 1 1.16-.9Z" />
    </svg>
  );
}
