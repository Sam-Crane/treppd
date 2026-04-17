import { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface InputFieldWrapperProps {
  label?: string;
  labelSecondary?: React.ReactNode;
  helper?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

/** Shared label + error row wrapper for Input, Textarea, Select. */
export function FormField({
  label,
  labelSecondary,
  helper,
  error,
  required,
  htmlFor,
  className,
  children,
}: InputFieldWrapperProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="flex items-baseline gap-2 text-xs font-medium text-text-primary"
        >
          <span>
            {label}
            {required && <span className="ml-0.5 text-error">*</span>}
          </span>
          {labelSecondary && (
            <span className="text-[10px] font-normal text-text-muted">
              {labelSecondary}
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs text-error">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      ) : helper ? (
        <p className="text-xs text-text-muted">{helper}</p>
      ) : null}
    </div>
  );
}

const INPUT_BASE =
  'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-60';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        INPUT_BASE,
        invalid
          ? 'border-error focus:border-error focus:ring-error/30'
          : 'border-border-default focus:border-accent',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows = 3, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        INPUT_BASE,
        'resize-y min-h-[60px]',
        invalid
          ? 'border-error focus:border-error focus:ring-error/30'
          : 'border-border-default focus:border-accent',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        INPUT_BASE,
        'appearance-none bg-[url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27 stroke=%27currentColor%27><path stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27 /></svg>")] bg-[length:1.1rem] bg-[right_0.6rem_center] bg-no-repeat pr-9',
        invalid
          ? 'border-error focus:border-error focus:ring-error/30'
          : 'border-border-default focus:border-accent',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';
