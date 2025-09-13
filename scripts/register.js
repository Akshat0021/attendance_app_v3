// sih_25012-main (1)/scripts/register.js

// ====================================================
// SUPABASE CONFIGURATION
// ====================================================
// IMPORTANT: Replace with your actual Supabase credentials
const SUPABASE_URL = 'https://samikiantytgcxlbtqnp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhbWlraWFudHl0Z2N4bGJ0cW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTU2NTMsImV4cCI6MjA3Mjk5MTY1M30.VDbliaiLO0km0UAAnJe0fejYHHVVgc5c_DCBrePW29I';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ====================================================
// DOM ELEMENTS
// ====================================================
const form = document.getElementById('registerForm');
const submitBtn = document.getElementById('submitBtn');
const submitText = document.getElementById('submitText');
const loadingIcon = document.getElementById('loadingIcon');
const togglePassword = document.getElementById('togglePassword');

const inputs = {
  schoolName: document.getElementById('schoolName'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  confirmPassword: document.getElementById('confirmPassword')
};

// ====================================================
// UTILITY FUNCTIONS
// ====================================================

function showNotification(message, type = 'success') {
  const container = document.getElementById('notification-container');
  if (!container) return;

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  container.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 100);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// ====================================================
// FORM VALIDATION & UI FEEDBACK
// ====================================================

/**
 * Checks the strength of a password and updates the UI.
 * @param {string} password - The password to check.
 */
function updatePasswordStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  
  const indicators = ['strength-1', 'strength-2', 'strength-3', 'strength-4'];
  const colors = ['bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  indicators.forEach((id, index) => {
    const element = document.getElementById(id);
    element.className = 'flex-1 strength-bar bg-gray-200'; // Reset classes
    if (strength > 0 && index < strength) {
      element.classList.add(colors[strength - 1]);
    }
  });
  
  let label = 'Password strength';
  if (password) {
      label = strength > 0 ? labels[strength - 1] : 'Very Weak';
  }
  document.getElementById('password-feedback').textContent = label;
}

/**
 * Validates a single input field and provides user feedback.
 * @param {string} field - The name of the input field.
 * @returns {boolean} - True if the field is valid, false otherwise.
 */
function validateField(field) {
    const input = inputs[field];
    const feedback = document.getElementById(`${field}-feedback`);
    let isValid = true;
    let message = '';

    const value = input.value.trim();

    switch (field) {
        case 'schoolName':
            isValid = value.length >= 3;
            message = isValid ? '✓ Looks good!' : '✗ School name must be at least 3 characters.';
            break;
        case 'email':
            isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            message = isValid ? '✓ Valid email format.' : '✗ Please enter a valid email address.';
            break;
        case 'password':
            isValid = value.length >= 8;
            message = isValid ? '✓ Meets length requirement.' : '✗ Password must be at least 8 characters.';
            updatePasswordStrength(value);
            if(inputs.confirmPassword.value) validateField('confirmPassword');
            break;
        case 'confirmPassword':
            isValid = value === inputs.password.value && value.length > 0;
            message = isValid ? '✓ Passwords match!' : '✗ Passwords do not match.';
            break;
    }

    input.classList.toggle('input-valid', isValid);
    input.classList.toggle('input-invalid', !isValid);
    
    feedback.textContent = message;
    feedback.className = `text-xs mt-1 ${isValid ? 'text-green-600' : 'text-red-600'}`;
    feedback.classList.remove('hidden');
    
    return isValid;
}

// ====================================================
// EVENT LISTENERS
// ====================================================

Object.keys(inputs).forEach(field => {
  inputs[field].addEventListener('input', () => validateField(field));
});

// Toggle password visibility
togglePassword.addEventListener('click', () => {
  const isPassword = inputs.password.type === 'password';
  inputs.password.type = isPassword ? 'text' : 'password';

  const eyeIcon = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
    </svg>`;
  const eyeSlashIcon = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>
    </svg>`;
  
  togglePassword.innerHTML = isPassword ? eyeSlashIcon : eyeIcon;
});

// Form submission handler
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const isFormValid = Object.keys(inputs).every(validateField);
  
  if (!document.getElementById('terms').checked) {
    showNotification('You must agree to the terms of service.', 'error');
    return;
  }
  
  if (!isFormValid) {
    showNotification('Please fix the errors in the form.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitText.textContent = 'Creating Account...';
  loadingIcon.classList.remove('hidden');

  try {
    const { data: authData, error: authError } = await db.auth.signUp({
      email: inputs.email.value,
      password: inputs.password.value,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Registration failed, please try again.");

    const { error: schoolError } = await db
      .from('schools')
      .insert({
        name: inputs.schoolName.value,
        email: inputs.email.value,
        user_id: authData.user.id
      });

    if (schoolError) {
      throw new Error(`Could not save school info: ${schoolError.message}`);
    }

    showNotification('Registration successful! Please check your email to verify your account. Redirecting...', 'success');

    setTimeout(() => {
      // Redirect to login, as user needs to verify email before accessing admin
      window.location.href = '/login.html'; 
    }, 4000);

  } catch (error) {
    console.error('Registration Error:', error);
    showNotification(`Error: ${error.message}`, 'error');

    submitBtn.disabled = false;
    submitText.textContent = 'Create Account';
    loadingIcon.classList.add('hidden');
  }
});