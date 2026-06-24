import * as React from 'react';

/** Checkbox with brand ember fill when checked and a Tabler check glyph.
 *  Works controlled (`checked` + `onChange`) or uncontrolled (`defaultChecked`). */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
}

export function Checkbox(props: CheckboxProps): JSX.Element;
