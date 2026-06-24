import * as React from 'react';

/** Round avatar — image if `src` given, otherwise initials on an ember (or rose/neutral) fill. */
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'accent' | 'rose' | 'neutral';
}

export function Avatar(props: AvatarProps): JSX.Element;
