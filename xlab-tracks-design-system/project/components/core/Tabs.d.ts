import * as React from 'react';

export interface TabItem {
  id: string;
  label: string;
  /** Optional Tabler icon name (without `ti-`). */
  icon?: string;
}

/** Underlined tab bar with an ember active indicator. Controlled (`value`) or
 *  uncontrolled (`defaultValue`). */
export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
}

export function Tabs(props: TabsProps): JSX.Element;
