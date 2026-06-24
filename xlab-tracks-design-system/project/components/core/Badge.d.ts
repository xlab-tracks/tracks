import * as React from 'react';

/** Small status / category label. Default 'accent' uses the warm tinted-chip
 *  treatment from the brand (rose text on stone tint). */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'outline';
  /** Show a leading status dot in the current text color. */
  dot?: boolean;
  /** Tabler icon name (without `ti-`). */
  icon?: string;
  children?: React.ReactNode;
}

export function Badge(props: BadgeProps): JSX.Element;
