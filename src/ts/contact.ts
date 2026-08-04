/* ===================================================================
   SPACE UTILIZERS — Contact Form Handler (TypeScript)
   Validation, honeypot spam protection, and direct inquiry submission
   =================================================================== */

/** Shape of the contact form submission data */
interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
}

/** Status type for form feedback */
type FormStatusType = 'success' | 'error-msg';

document.addEventListener('DOMContentLoaded', (): void => {
  initContactForm();
});

function initContactForm(): void {
  const form: HTMLFormElement | null = document.getElementById(
    'contact-form'
  ) as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', handleSubmit);

  // Real-time validation on required fields
  const inputs: NodeListOf<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> =
    form.querySelectorAll('.form-control[required]');

  inputs.forEach((input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void => {
    input.addEventListener('blur', (): void => {
      validateField(input);
    });

    input.addEventListener('input', (): void => {
      if (input.classList.contains('error')) {
        validateField(input);
      }
    });
  });
}

function validateField(field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): boolean {
  const parent: HTMLElement | null = field.parentElement;
  const errorEl: HTMLElement | null = parent ? parent.querySelector('.form-error') : null;
  let valid = true;
  let msg = '';

  // Required check
  if (field.hasAttribute('required') && !field.value.trim()) {
    valid = false;
    msg = 'This field is required.';
  }

  // Email validation
  if (valid && field instanceof HTMLInputElement && field.type === 'email' && field.value.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(field.value.trim())) {
      valid = false;
      msg = 'Please enter a valid email address.';
    }
  }

  // Phone validation
  if (valid && field instanceof HTMLInputElement && field.type === 'tel' && field.value.trim()) {
    const phoneRegex = /^[+]?[\d\s\-()]{8,20}$/;
    if (!phoneRegex.test(field.value.trim())) {
      valid = false;
      msg = 'Please enter a valid phone number.';
    }
  }

  if (!valid) {
    field.classList.add('error');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
  } else {
    field.classList.remove('error');
    if (errorEl) {
      errorEl.style.display = 'none';
    }
  }

  return valid;
}

function validateForm(form: HTMLFormElement): boolean {
  const fields: NodeListOf<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> =
    form.querySelectorAll('.form-control[required]');
  let allValid = true;

  fields.forEach((field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void => {
    if (!validateField(field)) {
      allValid = false;
    }
  });

  return allValid;
}

function getFormValue(form: HTMLFormElement, selector: string): string {
  const el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null =
    form.querySelector(selector);
  return el ? el.value.trim() : '';
}

async function handleSubmit(e: Event): Promise<void> {
  e.preventDefault();

  const form = e.target as HTMLFormElement;
  const submitBtn: HTMLButtonElement | null = form.querySelector('.btn-submit');
  const statusEl: HTMLElement | null = document.getElementById('form-status');

  if (!submitBtn) return;

  // Honeypot check
  const honeypotField: HTMLElement | null = form.querySelector('.hp-field');
  const honeypotInput: HTMLInputElement | null = honeypotField
    ? honeypotField.querySelector('input')
    : null;

  if (honeypotInput && honeypotInput.value) {
    // Bot detected — silently succeed
    showStatus(statusEl, 'success', 'Thank you — our design team will reach out within 24 hours.');
    form.reset();
    return;
  }

  // Validate
  if (!validateForm(form)) {
    return;
  }

  // Get form data
  const formData: ContactFormData = {
    name: getFormValue(form, '#name'),
    email: getFormValue(form, '#email'),
    phone: getFormValue(form, '#phone'),
    service: getFormValue(form, '#service'),
    message: getFormValue(form, '#message'),
  };

  // Show loading
  submitBtn.classList.add('loading');
  const originalText: string = submitBtn.textContent || 'Send Query';
  submitBtn.textContent = 'Sending...';

  try {
    const response = await fetch('https://formsubmit.co/ajax/mayankorai1200@gmail.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        service: formData.service,
        message: formData.message,
        _subject: `New inquiry from ${formData.name}`,
        _captcha: 'false',
        _template: 'table',
      }),
    });

    if (!response.ok) {
      throw new Error('Submission failed');
    }

    const autoReplyMailto = `mailto:${formData.email}?subject=We received your inquiry&body=Hello%20${encodeURIComponent(formData.name)},%0D%0A%0D%0AThank%20you%20for%20reaching%20out%20to%20Space%20Utilizers.%20Our%20team%20will%20get%20back%20to%20you%20within%2024%20hours.`;
    window.open(autoReplyMailto, '_blank', 'noopener,noreferrer');

    showStatus(
      statusEl,
      'success',
      'Thank you — our design team will reach out within 24 hours.'
    );
    form.reset();
  } catch (error: unknown) {
    console.error('Form submission error:', error);
    showStatus(
      statusEl,
      'error-msg',
      'Something went wrong. Please try again or email us directly.'
    );
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.textContent = originalText;
  }
}

function showStatus(el: HTMLElement | null, type: FormStatusType, message: string): void {
  if (!el) return;
  el.className = 'form-status ' + type;
  el.textContent = message;

  // Auto-hide after 8 seconds
  setTimeout((): void => {
    el.style.display = 'none';
    el.className = 'form-status';
  }, 8000);
}

export { initContactForm, validateField, validateForm, handleSubmit };
