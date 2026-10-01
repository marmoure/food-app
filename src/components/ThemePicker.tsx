import { useCallback, useEffect, useState } from 'react';
import { applyTheme, readTheme, saveTheme, THEME_KEY, THEMES } from '../theme';
import { Icon } from './Icon';
import { Modal } from './Modal';

export function ThemePicker() {
  const [theme, setTheme] = useState(readTheme);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    applyTheme(theme);
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const updateSystem = () => {
      if (theme === 'system') applyTheme(theme);
    };
    const updateStorage = (event: StorageEvent) => {
      if (event.key === THEME_KEY || event.key === null) setTheme(readTheme());
    };
    media?.addEventListener('change', updateSystem);
    window.addEventListener('storage', updateStorage);
    return () => {
      media?.removeEventListener('change', updateSystem);
      window.removeEventListener('storage', updateStorage);
    };
  }, [theme]);

  return (
    <>
      <button
        className="button secondary small-button theme-trigger"
        aria-label="Choose a theme"
        aria-haspopup="dialog"
        title="Choose a theme"
        onClick={() => setOpen(true)}
      >
        <Icon name="palette" size={17} />
        <span>Theme</span>
      </button>
      {open && (
        <Modal title="Choose a theme" close={close}>
          <div className="theme-picker">
            <p className="muted">
              A little color for your kitchen. Your choice is saved on this device.
            </p>
            <div className="theme-options" role="group" aria-label="Color theme">
              {THEMES.map((option) => (
                <button
                  key={option.id}
                  className={`theme-option ${option.id === 'system' ? 'theme-system' : ''}`}
                  aria-pressed={theme === option.id}
                  onClick={() => {
                    setTheme(option.id);
                    saveTheme(option.id);
                  }}
                >
                  {option.id === 'system' ? (
                    <span className="theme-system-icon" aria-hidden="true">
                      <Icon name="sun" />
                      <Icon name="moon" />
                    </span>
                  ) : (
                    <span className="theme-preview" data-theme={option.id} aria-hidden="true">
                      <span className="theme-preview-sidebar" />
                      <span className="theme-preview-content">
                        <i />
                        <span>
                          <i />
                          <i />
                          <i />
                        </span>
                      </span>
                    </span>
                  )}
                  <span className="theme-option-label">
                    <span>
                      <strong>{option.name}</strong>
                      <small>{option.description}</small>
                    </span>
                    <span className="theme-check" aria-hidden="true">
                      {theme === option.id && <Icon name="check" size={15} />}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <footer className="modal-actions">
              <button className="button primary" onClick={close}>
                Done
              </button>
            </footer>
          </div>
        </Modal>
      )}
    </>
  );
}
