import React, { useEffect, useRef, useState } from 'react';

export default function ScrollReveal({ as: Element = 'div', children, className = '', delay = 0, style = {}, ...props }) {
  const elementRef = useRef(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || typeof window === 'undefined') return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.96) {
      setVisible(true);
      return;
    }
    setVisible(false);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Element
      ref={elementRef}
      className={`scroll-reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={{ '--reveal-delay': `${delay}ms`, ...style }}
      {...props}
    >
      {children}
    </Element>
  );
}
