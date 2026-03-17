import type React from "react";
import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ hasError, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full px-3 py-2 border rounded-lg transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${hasError ? 'border-red-500' : 'border-gray-300'}
          ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';