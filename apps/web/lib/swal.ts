import Swal from 'sweetalert2';

export const swal = Swal.mixin({
  customClass: {
    popup: 'swal2-popup-custom',
    title: 'swal2-title-custom',
    htmlContainer: 'swal2-html-custom',
    confirmButton: 'swal2-confirm-custom',
    cancelButton: 'swal2-cancel-custom',
    icon: 'swal2-icon-custom',
  },
  buttonsStyling: false, // Use custom CSS
  background: 'var(--color-admin-surface)',
  color: 'var(--color-admin-text)',
});

// Add custom styles for Tokyo Night theme
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .swal2-popup-custom {
      border-radius: 8px !important;
      border: 1px solid var(--color-admin-border) !important;
      padding: 2.5rem !important;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
      font-family: inherit !important;
    }
    .swal2-title-custom {
      font-size: 1.5rem !important;
      font-weight: 700 !important;
      margin-bottom: 0.5rem !important;
      color: var(--color-admin-text) !important;
    }
    .swal2-html-custom {
      font-size: 1rem !important;
      color: var(--color-admin-text-muted) !important;
      line-height: 1.6 !important;
    }
    .swal2-confirm-custom {
      background: #7aa2f7 !important;
      color: var(--color-admin-surface) !important;
      border-radius: 8px !important;
      padding: 0.8rem 2rem !important;
      font-weight: 600 !important;
      margin: 0.5rem !important;
      cursor: pointer !important;
      transition: all 0.2s !important;
      border: none !important;
      width: 100%;
    }
    .swal2-confirm-custom:hover {
      background: #89b4fa !important;
      transform: translateY(-1px) !important;
    }
    .swal2-cancel-custom {
      background: transparent !important;
      color: var(--color-admin-text-dim) !important;
      border-radius: 8px !important;
      padding: 0.8rem 2rem !important;
      font-weight: 600 !important;
      margin: 0.5rem !important;
      cursor: pointer !important;
      transition: all 0.2s !important;
      border: 1px solid var(--color-admin-border) !important;
      width: 100%;
    }
    .swal2-cancel-custom:hover {
      color: #bb9af7 !important;
      border-color: #bb9af7 !important;
    }
    .swal2-actions {
      flex-direction: column !important;
      width: 100% !important;
      gap: 0.5rem !important;
    }
    /* Icons */
    .swal2-icon.swal2-success { border-color: #9ece6a !important; color: #9ece6a !important; }
    .swal2-icon.swal2-success [class^='swal2-success-line'] { background-color: #9ece6a !important; }
    .swal2-icon.swal2-success .swal2-success-ring { border: 4px solid rgba(158, 206, 106, 0.3) !important; }
    
    .swal2-icon.swal2-error { border-color: #f7768e !important; color: #f7768e !important; }
    .swal2-icon.swal2-error [class^='swal2-x-mark-line'] { background-color: #f7768e !important; }
    
    .swal2-icon.swal2-info { border-color: #7aa2f7 !important; color: #7aa2f7 !important; }
    .swal2-icon.swal2-question { border-color: #bb9af7 !important; color: #bb9af7 !important; }
  `;
  document.head.appendChild(style);
}
