import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/** Top of every protected page — consistent h1 + subtitle + action slot. */
export function PageHeader({
  title,
  description,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-3 border-b border-border-default pb-5 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-text-primary">
          {icon && <span className="text-accent">{icon}</span>}
          <span className="min-w-0 truncate">{title}</span>
        </h1>
        {description && (
          <p className="mt-1 max-w-prose text-sm text-text-secondary">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
