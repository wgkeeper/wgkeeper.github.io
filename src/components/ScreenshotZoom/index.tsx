import {useEffect, useId, useState} from 'react';

import styles from './styles.module.css';

type ScreenshotZoomProps = {
  src: string;
  alt: string;
};

export default function ScreenshotZoom({src, alt}: ScreenshotZoomProps) {
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

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
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
        <img src={src} alt={alt} />
      </button>
      {isOpen && (
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
              <button className={styles.closeButton} type="button" onClick={() => setIsOpen(false)}>
                Close
              </button>
            </div>
            <img className={styles.fullImage} src={src} alt="" />
          </div>
        </div>
      )}
    </>
  );
}
