import * as React from 'react';

/** Text field with optional label, leading Tabler icon, hint and error.
 *  Sunken well background, ember focus ring. */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Leading Tabler icon name (without `ti-`). */
  icon?: string;
  /** Helper text shown below. */
  hint?: string;
  /** Error message; overrides hint and turns the field red. */
  error?: string;
}

export function Input(props: InputProps): JSX.Element;
