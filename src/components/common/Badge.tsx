import React from 'react';
import { FAIcon, IconKey } from './FAIcon';
import { ScheduleStatus } from '../../types';

export type BadgeVariant =
  | ScheduleStatus
  | 'active'
  | 'completed'
  | 'paused'
  | 'lowStock'
  | 'expired'
  | 'bebas'
  | 'bebasTerbatas'
  | 'keras';

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
  showIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  label,
  className = '',
  showIcon = true
}) => {
  const configs: Record<BadgeVariant, { bg: string; text: string; border: string; icon: IconKey; defaultLabel: string }> = {
    taken: {
      bg: 'bg-[#4E9B69]/10',
      text: 'text-[#4E9B69]',
      border: 'border-[#4E9B69]/25',
      icon: 'circleCheck',
      defaultLabel: 'Sudah Diminum'
    },
    due: {
      bg: 'bg-[#D99B42]/10',
      text: 'text-[#D99B42]',
      border: 'border-[#D99B42]/25',
      icon: 'clock',
      defaultLabel: 'Waktunya Minum'
    },
    upcoming: {
      bg: 'bg-[#778477]/10',
      text: 'text-[#778477]',
      border: 'border-[#778477]/25',
      icon: 'calendar',
      defaultLabel: 'Mendatang'
    },
    snoozed: {
      bg: 'bg-[#648BB7]/10',
      text: 'text-[#648BB7]',
      border: 'border-[#648BB7]/25',
      icon: 'refresh',
      defaultLabel: 'Ditunda'
    },
    missed: {
      bg: 'bg-[#D96A68]/10',
      text: 'text-[#D96A68]',
      border: 'border-[#D96A68]/25',
      icon: 'circleAlert',
      defaultLabel: 'Terlewat'
    },
    active: {
      bg: 'bg-[#84A282]/15',
      text: 'text-[#587A58]',
      border: 'border-[#84A282]/30',
      icon: 'pill',
      defaultLabel: 'Aktif Dikonsumsi'
    },
    completed: {
      bg: 'bg-[#778477]/15',
      text: 'text-[#778477]',
      border: 'border-[#778477]/30',
      icon: 'check',
      defaultLabel: 'Selesai Terapi'
    },
    paused: {
      bg: 'bg-[#D99B42]/15',
      text: 'text-[#D99B42]',
      border: 'border-[#D99B42]/30',
      icon: 'minus',
      defaultLabel: 'Dihentikan'
    },
    lowStock: {
      bg: 'bg-[#D99B42]/15',
      text: 'text-[#D99B42]',
      border: 'border-[#D99B42]/30',
      icon: 'alert',
      defaultLabel: 'Stok Menipis'
    },
    expired: {
      bg: 'bg-[#D96A68]/15',
      text: 'text-[#D96A68]',
      border: 'border-[#D96A68]/30',
      icon: 'circleAlert',
      defaultLabel: 'Dekat Kedaluwarsa'
    },
    bebas: {
      bg: 'bg-[#4E9B69]/10',
      text: 'text-[#4E9B69]',
      border: 'border-[#4E9B69]/30',
      icon: 'circleCheck',
      defaultLabel: 'Obat Bebas'
    },
    bebasTerbatas: {
      bg: 'bg-[#648BB7]/10',
      text: 'text-[#648BB7]',
      border: 'border-[#648BB7]/30',
      icon: 'info',
      defaultLabel: 'Bebas Terbatas (W)'
    },
    keras: {
      bg: 'bg-[#D96A68]/10',
      text: 'text-[#D96A68]',
      border: 'border-[#D96A68]/30',
      icon: 'alert',
      defaultLabel: 'Obat Keras (K)'
    }
  };

  const config = configs[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {showIcon && <FAIcon name={config.icon} className="text-[10px]" />}
      <span>{label || config.defaultLabel}</span>
    </span>
  );
};

export default Badge;
