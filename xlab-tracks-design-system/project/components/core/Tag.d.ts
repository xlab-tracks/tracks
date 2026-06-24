import * as React from 'react';

/** Pill-shaped topic/filter tag. Outline by default; ember fill when `selected`.
 *  Add `onClick` to make it a filter toggle, `onRemove` for a dismiss "x". */
export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  children?: React.ReactNode;
}

export function Tag(props: TagProps): JSX.Element;
