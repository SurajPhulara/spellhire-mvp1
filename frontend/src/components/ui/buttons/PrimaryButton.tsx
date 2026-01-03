import React from 'react';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export const PrimaryButton = ({ 
  children, 
  onClick, 
  className = '', 
  type = 'button',
  disabled = false,
}: PrimaryButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-row justify-center items-center
        py-[10px] px-[20px] gap-[10px]
        w-auto h-[42px]
        rounded-[8px]
        transition-colors duration-200
        font-['Figtree'] font-semibold text-[18px] leading-[22px]
        ${disabled 
          ? 'bg-gray-400 text-white cursor-not-allowed' 
          : 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] hover:from-[#4338ca] hover:to-[#6d28d9] hover:bg-[#268075] text-white cursor-pointer'
        }
        ${className}
      `}
    >
      <span>
        {children}
      </span>
    </button>
  );
};