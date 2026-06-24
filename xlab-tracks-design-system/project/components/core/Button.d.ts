import * as React from 'react';

/** Primary call-to-action button for XLab Tracks. */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Control height / padding. */
  size?: 'sm' | 'md' | 'lg';
  /** Tabler icon name (without the `ti-` prefix), rendered before the label. */
  iconLeft?: string;
  /** Tabler icon name (without the `ti-` prefix), rendered after the label. */
  iconRight?: string;
  disabled?: boolean;
  /** Render as a different element, e.g. 'a' for a link button. */
  as?: 'button' | 'a';
  children?: React.ReactNode;
}

export function Button(props: ButtonProps): JSX.Element;
