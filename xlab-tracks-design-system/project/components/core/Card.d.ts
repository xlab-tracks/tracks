import * as React from 'react';

/** The base surface container: stone card with a hairline border and 14px radius.
 *  Structure on dark comes from the border, not heavy shadow. */
export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** Surface tone. 'warm' = ember-tinted band; 'sunken' = deepest well. */
  variant?: 'default' | 'warm' | 'sunken';
  /** Adds hover lift + pointer; pair with as="a". */
  interactive?: boolean;
  pad?: 'sm' | 'md' | 'lg';
  as?: 'div' | 'a' | 'article' | 'section' | 'li';
  children?: React.ReactNode;
}

export function Card(props: CardProps): JSX.Element;
