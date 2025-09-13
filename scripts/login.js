// ====================================================
// SUPABASE CONFIGURATION
// ====================================================
const SUPABASE_URL = 'https://samikiantytgcxlbtqnp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhbWlraWFudHl0Z2N4bGJ0cW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTU2NTMsImV4cCI6MjA3Mjk5MTY1M30.VDbliaiLO0km0UAAnJe0fejYHHVVgc5c_DCBrePW29I';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ====================================================
// DOM ELEMENTS
// ====================================================
const loginForm = document.getElementById('loginForm');
const submitButton = document.getElementById('submitBtn');
const errorDiv = document.getElementById('error-message');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

// ====================================================
// EVENT LISTENERS
// ====================================================

// Handle form submission for login
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = passwordInput.value;

    submitButton.disabled = true;
    submitButton.textContent = 'Signing In...';
    errorDiv.classList.add('hidden');

    try {
        const { data, error } = await db.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        window.location.href = '/admin.html';

    } catch (error) {
        console.error('Login Error:', error);
        errorDiv.textContent = `Error: ${error.message}`;
        errorDiv.classList.remove('hidden');

        submitButton.disabled = false;
        submitButton.textContent = 'Sign in';
    }
});

// Handle password visibility toggle
togglePassword.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';

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
