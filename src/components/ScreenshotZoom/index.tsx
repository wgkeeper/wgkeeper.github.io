import {useEffect, useId, useState} from 'react';
import {createPortal} from 'react-dom';
import ThemedImage from '@theme/ThemedImage';

import styles from './styles.module.css';

type ScreenshotZoomProps = {
  src: string;
  alt: string;
  /** Optional dark-theme variant. After hydration only the active theme's image is rendered. */
  srcDark?: string;
  /** Load right away; for an image in the first screen. */
  eager?: boolean;
};

export default function ScreenshotZoom({src, alt, srcDark, eager = false}: ScreenshotZoomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        className={styles.preview}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`Open larger screenshot: ${alt}`}>
        <ThemedImage
          sources={{light: src, dark: srcDark ?? src}}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
        />
      </button>
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={() => setIsOpen(false)}>
            <div className={styles.dialog} onClick={(event) => event.stopPropagation()}>
              <div className={styles.toolbar}>
                <p className={styles.title} id={titleId}>
                  {alt}
                </p>
                <button
                  className={styles.closeButton}
                  type="button"
                  onClick={() => setIsOpen(false)}>
                  Close
                </button>
              </div>
              <ThemedImage className={styles.fullImage} sources={{light: src, dark: srcDark ?? src}} alt="" />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
