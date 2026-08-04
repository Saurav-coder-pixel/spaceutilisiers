/* ===================================================================
   SPACE UTILIZERS — Contact Form Handler (TypeScript)
   - Client-side validation
   - Backend API submission (Express / Vercel / Netlify auto-detect)
   - Loading spinner, disabled button, prevent double-submit
   - Toast notifications + inline status message
   - Form clear on success
   =================================================================== */

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  website?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  errors?: ValidationError[];
}

type FormStatusType = 'success' | 'error-msg';
type ToastType = 'success' | 'error' | 'info';

let isSubmitting = false;
let toastContainer: HTMLElement | null = null;

function getApiEndpoint(): string {
  const explicitGlobal = (window as any).__CONTACT_API_ENDPOINT__ as string | undefined;
  if (explicitGlobal) return explicitGlobal;

  const viteEnv = (import.meta as any).env;
  const explicitEnv =
    (viteEnv && (viteEnv.VITE_CONTACT_API_URL as string | undefined)) || '';
  if (explicitEnv) return explicitEnv;

  const host = window.location.hostname;

  if (host.endsWith('.netlify.app')) {
    return '/.netlify/functions/contact';
  }

  if (host.endsWith('.vercel.app')) {
    return '/api/contact';
  }

  if (host === 'localhost' || host === '127.0.0.1') {
    return '/api/contact';
  }

  return '/api/contact';
}

document.addEventListener('DOMContentLoaded', (): void => {
  ensureToastContainer();
  initContactForm();
});

function ensureToastContainer(): void {
  if (document.querySelector('.toast-container')) return;
  toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  toastContainer.setAttribute('aria-live', 'polite');
  toastContainer.setAttribute('aria-atomic', 'true');
  document.body.appendChild(toastContainer);
}

function showToast(
  type: ToastType,
  title: string,
  message: string,
  duration: number = 5000
): void {
  if (!toastContainer) ensureToastContainer();
  if (!toastContainer) return;

  const iconMap: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${iconMap[type]}</span>
    <div class="toast-body">
      <div class="toast-title"></div>
      <div class="toast-message"></div>
    </div>
    <button type="button" class="toast-close" aria-label="Dismiss notification">&times;</button>
  `;

  (toast.querySelector('.toast-title') as HTMLElement).textContent = title;
  (toast.querySelector('.toast-message') as HTMLElement).textContent = message;

  const closeBtn = toast.querySelector('.toast-close') as HTMLButtonElement;
  const removeToast = () => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 450);
  };

  closeBtn.addEventListener('click', removeToast);
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast-show'));

  if (duration > 0) {
    setTimeout(removeToast, duration);
  }
}

function initContactForm(): void {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  if (!form) return;

  form.setAttribute('novalidate', '');
  form.addEventListener('submit', handleSubmit);

  const requiredInputs = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    '.form-control[required]'
  );

  requiredInputs.forEach((input) => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) validateField(input);
    });
  });
}

function validateField(
  field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): boolean {
  const parent = field.parentElement;
  const errorEl = parent ? (parent.querySelector('.form-error') as HTMLElement | null) : null;
  let valid = true;
  let msg = '';
  const value = field.value.trim();

  if (field.hasAttribute('required') && !value) {
    valid = false;
    msg = 'This field is required.';
  }

  if (valid && field instanceof HTMLInputElement && field.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      valid = false;
      msg = 'Please enter a valid email address.';
    }
  }

  if (valid && field instanceof HTMLInputElement && field.type === 'tel' && value) {
    const phoneRegex = /^[+]?[\d\s\-()]{8,30}$/;
    if (!phoneRegex.test(value)) {
      valid = false;
      msg = 'Please enter a valid phone number (8-30 digits).';
    }
  }

  if (valid && field.id === 'name' && value && value.length < 2) {
    valid = false;
    msg = 'Name must be at least 2 characters.';
  }

  if (valid && field.id === 'message' && value && value.length < 10) {
    valid = false;
    msg = 'Message must be at least 10 characters.';
  }

  if (valid && field.tagName === 'SELECT' && field.id === 'subject' && !value) {
    valid = false;
    msg = 'Please select a subject / query type.';
  }

  if (!valid) {
    field.classList.add('error');
    field.setAttribute('aria-invalid', 'true');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
  } else {
    field.classList.remove('error');
    field.removeAttribute('aria-invalid');
    if (errorEl) {
      errorEl.style.display = 'none';
    }
  }

  return valid;
}

function validateForm(form: HTMLFormElement): boolean {
  const fields = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    '.form-control[required]'
  );
  let allValid = true;
  fields.forEach((f) => {
    if (!validateField(f)) allValid = false;
  });
  return allValid;
}

function getFormValue(form: HTMLFormElement, selector: string): string {
  const el = form.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
  return el ? el.value.trim() : '';
}

function applyServerErrors(form: HTMLFormElement, errors: ValidationError[]): void {
  errors.forEach(({ field, message }) => {
    const input = form.querySelector(`[name="${field}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
    if (!input) return;
    input.classList.add('error');
    const parent = input.parentElement;
    const errEl = parent ? (parent.querySelector('.form-error') as HTMLElement | null) : null;
    if (errEl) {
      errEl.textContent = message;
      errEl.style.display = 'block';
    }
  });
}

async function handleSubmit(e: Event): Promise<void> {
  e.preventDefault();

  if (isSubmitting) return;

  const form = e.target as HTMLFormElement;
  const submitBtn = form.querySelector<HTMLButtonElement>('.btn-submit');
  const statusEl = document.getElementById('form-status');
  if (!submitBtn) return;

  const honeypot = form.querySelector('.hp-field') as HTMLElement | null;
  const hpInput = honeypot ? (honeypot.querySelector('input') as HTMLInputElement | null) : null;
  if (hpInput && hpInput.value.trim()) {
    showStatus(statusEl, 'success', 'Thank you for contacting us. We have received your message and will get back to you shortly.');
    showToast('success', 'Message Sent', 'Thank you — our team will reach out within 24 hours.');
    form.reset();
    return;
  }

  if (!validateForm(form)) {
    showToast('error', 'Please check the form', 'Some fields need attention before sending.');
    return;
  }

  const formData: ContactFormData = {
    name: getFormValue(form, '#name'),
    email: getFormValue(form, '#email'),
    phone: getFormValue(form, '#phone'),
    subject: getFormValue(form, '#subject'),
    message: getFormValue(form, '#message'),
    website: hpInput ? hpInput.value : '',
  };

  const btnLabel = submitBtn.querySelector('.btn-label') as HTMLElement | null;
  const originalText = btnLabel ? btnLabel.textContent || 'Send Query' : submitBtn.textContent || 'Send Query';

  isSubmitting = true;
  submitBtn.disabled = true;
  submitBtn.classList.add('loading');
  if (btnLabel) btnLabel.textContent = 'Sending...';
  if (statusEl) {
    statusEl.style.display = 'none';
    statusEl.className = 'form-status';
  }

  const endpoint = getApiEndpoint();
  console.info(`[Contact] Submitting to: ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(formData),
    });

    let payload: ApiResponse;
    try {
      payload = (await response.json()) as ApiResponse;
    } catch {
      payload = {
        success: response.ok,
        message: response.ok
          ? 'Thank you for contacting us. We have received your message and will get back to you shortly.'
          : 'Server returned an invalid response. Please try again shortly.',
      };
    }

    if (payload.success) {
      showStatus(statusEl, 'success', payload.message);
      showToast('success', 'Thank You!', 'Your message has been sent. We will reply within 24 hours.');
      form.reset();
      form.querySelectorAll('.form-control.error').forEach((el) => el.classList.remove('error'));
    } else {
      if (payload.errors && payload.errors.length > 0) {
        applyServerErrors(form, payload.errors);
      }
      showStatus(statusEl, 'error-msg', payload.message);
      showToast(
        'error',
        'Submission Failed',
        payload.message || 'Please try again in a few moments.'
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error';
    console.error('[Contact] Fetch error:', msg, '| endpoint:', endpoint);
    const userMsg =
      'We could not reach our server right now. Please check your internet connection and try again, or email us directly.';
    showStatus(statusEl, 'error-msg', userMsg);
    showToast('error', 'Connection Error', userMsg + ` (${endpoint})`, 10000);
  } finally {
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    if (btnLabel) {
      btnLabel.textContent = originalText;
    } else {
      submitBtn.textContent = originalText;
    }
  }
}

function showStatus(el: HTMLElement | null, type: FormStatusType, message: string): void {
  if (!el) return;
  el.className = 'form-status ' + type;
  el.textContent = message;
  el.style.display = 'block';
  setTimeout(() => {
    el.style.display = 'none';
    el.className = 'form-status';
  }, 10000);
}

export { initContactForm, validateField, validateForm, handleSubmit, showToast, getApiEndpoint };
