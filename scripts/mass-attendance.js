// ====================================================
// SUPABASE & API CONFIGURATION
// ====================================================
const SUPABASE_URL = 'https://samikiantytgcxlbtqnp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhbWlraWFudHl0Z2N4bGJ0cW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTU2NTMsImV4cCI6MjA3Mjk5MTY1M30.VDbliaiLO0km0UAAnJe0fejYHHVVgc5c_DCBrePW29I';
const FACE_API_URL = 'http://127.0.0.1:5000'; // Full URL to your Python server

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ====================================================
// DOM ELEMENTS
// ====================================================
const selectClass = document.getElementById('select-class');
const selectSection = document.getElementById('select-section');
const imageFile = document.getElementById('image-file');
const processBtn = document.getElementById('process-btn');
const uploadForm = document.getElementById('upload-form');
const resultsView = document.getElementById('results-view');
const loader = document.getElementById('loader');
const imagePlaceholder = document.getElementById('image-placeholder');
const processedImage = document.getElementById('processed-image');

// ====================================================
// INITIALIZATION
// ====================================================
document.addEventListener('DOMContentLoaded', () => {
    populateClassDropdown();
    setupEventListeners();
});

function setupEventListeners() {
    selectClass.addEventListener('change', () => populateSectionDropdown(selectClass.value));
    selectSection.addEventListener('change', () => {
        imageFile.disabled = !selectSection.value;
    });
    imageFile.addEventListener('change', () => {
        processBtn.disabled = !imageFile.files[0];
    });
    uploadForm.addEventListener('submit', handleFormSubmit);
}

// ====================================================
// DATA FETCHING & UI POPULATION
// ====================================================
async function populateClassDropdown() {
    const { data: { user } } = await db.auth.getUser();
    if (!user) {
        showNotification('You are not logged in. Redirecting...', 'error');
        setTimeout(() => window.location.href = '/login.html', 2000);
        return;
    }

    const { data: schoolData, error: schoolError } = await db.from('schools').select('id').eq('user_id', user.id).single();
    if (schoolError) {
        showNotification('Could not identify the school for this user.', 'error');
        return;
    }
    const schoolId = schoolData.id;

    const { data, error } = await db.from('classes').select('*').eq('school_id', schoolId).order('name');
    if (error) {
        showNotification('Failed to load classes', 'error');
        return;
    }
    selectClass.innerHTML = '<option value="">Select a Class</option>' + data.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

async function populateSectionDropdown(classId) {
    imageFile.disabled = true;
    processBtn.disabled = true;
    selectSection.innerHTML = '<option value="">Loading...</option>';
    selectSection.disabled = true;

    if (!classId) {
        selectSection.innerHTML = '<option value="">Select a class first</option>';
        return;
    }

    const { data, error } = await db.from('sections').select('*').eq('class_id', classId).order('name');
    if (error) {
        showNotification('Failed to load sections', 'error');
        return;
    }
    selectSection.innerHTML = '<option value="">Select a Section</option>' + data.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    selectSection.disabled = false;
}

// ====================================================
// FORM HANDLING & API CALL
// ====================================================
async function handleFormSubmit(event) {
    event.preventDefault();
    const selectedSectionId = selectSection.value;
    const photoFile = imageFile.files[0];

    if (!selectedSectionId || !photoFile) {
        showNotification('Please select a section and upload a photo.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('image', photoFile);
    formData.append('section_id', selectedSectionId);

    // Update UI for processing state
    loader.classList.remove('hidden');
    imagePlaceholder.classList.add('hidden');
    processedImage.classList.add('hidden');
    resultsView.classList.add('hidden');
    processBtn.disabled = true;
    processBtn.textContent = 'Processing...';

    try {
        const response = await fetch(`${FACE_API_URL}/process_image`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({ error: 'An unknown server error occurred.' }));
            throw new Error(errData.error || `Server error: ${response.statusText}`);
        }

        const data = await response.json();
        displayResults(data);

    } catch (error) {
        console.error('Error processing image:', error);
        showNotification(error.message, 'error');
        // Reset UI on error
        loader.classList.add('hidden');
        imagePlaceholder.classList.remove('hidden');

    } finally {
        processBtn.disabled = false;
        processBtn.textContent = 'Process Attendance';
    }
}

// ====================================================
// DISPLAY RESULTS
// ====================================================
function displayResults(data) {
    loader.classList.add('hidden');
    processedImage.src = data.processed_image;
    processedImage.classList.remove('hidden');
    resultsView.classList.remove('hidden');

    // Populate Present List
    const presentList = document.getElementById('present-list');
    presentList.innerHTML = data.present_students.length > 0
        ? data.present_students.map(s => `<li class="text-sm p-2 bg-green-50 rounded-md flex justify-between"><span>${s.name} (Roll: ${s.roll_number})</span><span class="font-semibold text-green-800">${s.confidence}%</span></li>`).join('')
        : '<li class="text-sm text-gray-500">No students were identified as present.</li>';

    // Populate Absent List
    const absentList = document.getElementById('absent-list');
    absentList.innerHTML = data.absent_students.length > 0
        ? data.absent_students.map(s => `<li class="text-sm p-2 bg-red-50 rounded-md">${s.name} (Roll: ${s.roll_number})</li>`).join('')
        : '<li class="text-sm text-gray-500">All registered students were accounted for.</li>';

    // Conditionally display the unknown faces container
    const unknownContainer = document.getElementById('unknown-students-container');
    const unknownCountEl = document.getElementById('unknown-faces-count');

    if (data.unknown_faces > 0) {
        unknownCountEl.textContent = data.unknown_faces;
        unknownContainer.classList.remove('hidden');
    } else {
        unknownContainer.classList.add('hidden');
    }
}

// ====================================================
// UTILITY FUNCTIONS
// ====================================================
function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
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

