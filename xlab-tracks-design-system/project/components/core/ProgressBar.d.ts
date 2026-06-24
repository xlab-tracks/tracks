import * as React from 'react';

/** Track / lesson completion bar — the workhorse of a learning platform.
 *  Ember fill, auto-switches to success green at 100%. */
export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current value (0..max). */
  value?: number;
  max?: number;
  /** Optional label shown above the track. */
  label?: string;
  /** Show the % readout on the right. */
  showValue?: boolean;
  size?: 'sm' | 'md';
  variant?: 'accent' | 'success';
}

export function ProgressBar(props: ProgressBarProps): JSX.Element;
