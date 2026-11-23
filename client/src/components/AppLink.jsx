import React from 'react';

export default function AppLink({
  href = '/',
  navigate,
  className = '',
  children,
  onClick,
  target,
  rel,
  ...props
}) {
  const handleClick = (event) => {
    if (onClick) onClick(event);
    if (event.defaultPrevented) return;
    if (
      target === '_blank' ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    if (typeof href === 'string' && href.startsWith('/') && !href.startsWith('//') && navigate) {
      event.preventDefault();
      navigate(href);
    }
  };

  return (
    <a href={href} className={className} onClick={handleClick} target={target} rel={rel} {...props}>
      {children}
    </a>
  );
}
