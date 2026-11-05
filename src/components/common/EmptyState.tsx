import React from 'react';
import { FAIcon, IconKey } from './FAIcon';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: IconKey;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: IconKey;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'pill',
  title,
  description,
  actionLabel,
  onAction,
  actionIcon = 'plus'
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-white border border-[#E7EBE4] shadow-soft-sm my-4">
      {/* Icon Capsule Container */}
      <div className="w-16 h-16 rounded-3xl bg-[#F0F5ED] text-[#84A282] flex items-center justify-center text-2xl mb-4 border border-[#84A282]/20 shadow-inner">
        <FAIcon name={icon} />
      </div>

      <h4 className="font-bold text-[#26382B] text-base mb-1">{title}</h4>
      <p className="text-xs text-[#778477] max-w-xs leading-relaxed mb-5">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          variant="primary"
          size="sm"
          icon={actionIcon}
          onClick={onAction}
          className="shadow-soft"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
