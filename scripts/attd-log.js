// ====================================================
// SUPABASE CONFIGURATION
// ====================================================
const SUPABASE_URL = 'https://samikiantytgcxlbtqnp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhbWlraWFudHl0Z2N4bGJ0cW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTU2NTMsImV4cCI6MjA3Mjk5MTY1M30.VDbliaiLO0km0UAAnJe0fejYHHVVgc5c_DCBrePW29I';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ====================================================
// LOGIN LOGIC FOR ATTENDANCE
// ====================================================
const loginForm = document.getElementById('attdLoginForm');
const submitButton = document.getElementById('submitBtn');
const errorDiv = document.getElementById('error-message');

// Check if the form exists before adding an event listener
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Basic validation
        if (!email || !password) {
            errorDiv.textContent = 'Please enter both email and password.';
            errorDiv.classList.remove('hidden');
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Signing In...';
        errorDiv.classList.add('hidden');

        try {
            // Sign in with Supabase
            const { data, error } = await db.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                throw error;
            }

            // If login is successful, redirect to the LIVE ATTENDANCE page
            window.location.href = '/attd.html';

        } catch (error) {
            console.error('Login Error:', error);
            errorDiv.textContent = `Error: ${error.message}`;
            errorDiv.classList.remove('hidden');

            submitButton.disabled = false;
            submitButton.textContent = 'Sign in';
        }
    });
}
