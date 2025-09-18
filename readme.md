# AttendanceFlow

**An AI-powered facial recognition attendance system for schools, designed to be simple, accessible, and impactful.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Problem Statement

Manual attendance tracking in schools, particularly in under-resourced areas, is a time-consuming and inefficient process. It takes away valuable teaching time, is prone to errors, and makes it difficult for administrators to maintain accurate records for government programs and parent communications.

## Our Solution

**AttendanceFlow** is a web-based application that uses facial recognition to automate the attendance process. Teachers can use any device with a camera (smartphone, tablet, or laptop) to take attendance quickly and accurately, freeing them up to focus on teaching.

### Key Features

* **Live Facial Recognition:** Teachers can take attendance in real-time using their device's camera.
* **Admin Dashboard:** A comprehensive dashboard for school administrators to view and manage attendance data, students, and classes.
* **Automated Notifications:** Parents can receive real-time WhatsApp notifications about their child's attendance.
* **Student and Class Management:** A simple interface for administrators to add, edit, and manage students and classes.
* **Real-time Analytics:** Get insights into attendance trends and identify students who may need support.
* **Accessible and Low-Cost:** Works on any modern web browser, with no need for specialized hardware.

## Tech Stack

* **Frontend:** HTML, CSS (Tailwind CSS), JavaScript
* **Backend:** Supabase (Database, Authentication, Storage, Serverless Functions)
* **Face Recognition API:** Python, Flask, `insightface`
* **Notifications:** Twilio WhatsApp API

## Getting Started

### Prerequisites

* A Supabase account
* A Twilio account with a WhatsApp-enabled number
* Python 3.8+
* Node.js and npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/akshat0021/attendance_app_v3.git](https://github.com/akshat0021/attendance_app_v3.git)
    cd attendance_app_v3
    ```

2.  **Set up Supabase:**
    * Create a new project on [Supabase](https://supabase.com).
    * In the `SQL Editor`, run the SQL scripts in the `supabase/migrations` directory to create the necessary tables and functions.
    * In your Supabase project settings, go to `API` and find your `Project URL` and `anon key`.
    * In the `scripts` directory, replace the placeholder `SUPABASE_URL` and `SUPABASE_ANON_KEY` in all `.js` files with your Supabase credentials.

3.  **Set up the Face Recognition API:**
    * Navigate to the `face_recognition_api` directory.
    * Install the required Python packages:
        ```bash
        pip install -r requirements.txt
        ```
    * Run the Flask app:
        ```bash
        python face_recognition_api.py
        ```

4.  **Deploy Supabase Edge Functions:**
    * Install the Supabase CLI:
        ```bash
        npm install -g supabase
        ```
    * Log in to your Supabase account:
        ```bash
        supabase login
        ```
    * Link your project:
        ```bash
        supabase link --project-ref <your-project-id>
        ```
    * Deploy the functions:
        ```bash
        supabase functions deploy
        ```

5.  **Run the application:**
    * Open the `index.html` file in your browser to get started.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
