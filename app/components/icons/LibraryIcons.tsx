import React from "react";

const BaseIcon = ({
  children,
  className = "w-5 h-5",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

// Ikon Mahasiswa (Lebih minimalis)
export const UserIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </BaseIcon>
);

// Ikon Dosen (Toga lebih elegan)
export const GradCapIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M22 12l-10-5-10 5 10 5 10-5z" />
    <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
  </BaseIcon>
);

// Ikon Staff (Briefcase lebih kotak modern)
export const BriefcaseIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <rect x="2" y="7" width="20" height="13" rx="2" ry="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="13" x2="12" y2="13" />
  </BaseIcon>
);

export const CrownIcon = ({
  className = "w-5 h-5",
}: {
  className?: string;
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Warna emas solid */}
    <path
      d="M2 16l6-4 6 4 6-4 6 4v-6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v6z"
      fill="#F59E0B"
    />
    <path
      d="M2 16l6-4 6 4 6-4 6 4V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8z"
      stroke="#B45309"
    />
    <circle cx="5" cy="6" r="1.5" fill="#FBBF24" stroke="#D97706" />
    <circle cx="12" cy="4" r="1.5" fill="#FBBF24" stroke="#D97706" />
    <circle cx="19" cy="6" r="1.5" fill="#FBBF24" stroke="#D97706" />
  </svg>
);

export const HandTapIcon = ({
  className = "w-6 h-6",
}: {
  className?: string;
}) => (
  <svg
    className={`${className} animate-bounce`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Bentuk tangan minimalis */}
    <path d="M12 22V12" />
    <path d="M12 12l-4-4" />
    <path d="M12 12l4-4" />
    <circle
      cx="12"
      cy="6"
      r="2"
      fill="currentColor"
      className="text-blue-500"
    />
  </svg>
);

export const ChartIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M18 20V10" />
    <path d="M12 20V4" />
    <path d="M6 20v-6" />
  </BaseIcon>
);

export const UsersIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </BaseIcon>
);

export const ReportIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </BaseIcon>
);

export const PencilIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </BaseIcon>
);

export const UploadIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </BaseIcon>
);

export const DownloadIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </BaseIcon>
);

export const EditIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </BaseIcon>
);

export const TrashIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </BaseIcon>
);

export const XIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </BaseIcon>
);

export const CalendarOffIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M21 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />
    <path d="M16 2v4" />
    <path d="M3 10h11" />
    <path d="m22 22-4-4" />
    <path d="m18 22 4-4" />
  </BaseIcon>
);

export const ClockIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </BaseIcon>
);
