import * as React from 'react';

/** Toggle for instant on/off settings (notifications, dark-only prefs, etc).
 *  Ember track when on, sliding thumb. */
export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
}

export function Switch(props: SwitchProps): JSX.Element;
