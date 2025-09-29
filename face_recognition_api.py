import os
import cv2
import numpy as np
import insightface
import traceback
import json
import base64
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from supabase import create_client, Client
from datetime import datetime

# ===============================================================
# INITIALIZATION
# ===============================================================
# Flask will look for HTML files in the main project directory.
app = Flask(__name__, template_folder='.')
CORS(app)

# Load the InsightFace model
try:
    face_analysis_model = insightface.app.FaceAnalysis(providers=['CPUExecutionProvider'])
    face_analysis_model.prepare(ctx_id=0, det_size=(640, 640))
    print("✅ InsightFace model loaded successfully.")
except Exception as e:
    print(f"❌ FATAL: Error initializing InsightFace model: {e}")
    exit()

# Use the secure service_role key from environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://samikiantytgcxlbtqnp.supabase.co")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhbWlraWFudHl0Z2N4bGJ0cW5wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQxNTY1MywiZXhwIjoyMDcyOTkxNjUzfQ.lo-D8Nu4kpFZeMovsa8v2zRr0dIkRk8U1xzU6TEazps")

if not SUPABASE_SERVICE_KEY:
    print("❌ FATAL: SUPABASE_SERVICE_KEY environment variable not set.")
    exit()

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("✅ Supabase client initialized successfully with service role.")
except Exception as e:
    print(f"❌ FATAL: Could not initialize Supabase client: {e}")
    exit()

# ===============================================================
# HELPER FUNCTIONS
# ===============================================================

def convert_score_to_percentage(score):
    """
    Directly converts a cosine similarity score (0.0 to 1.0) to a percentage.
    """
    return int(score * 100)

# --- CRITICAL FIX: Properly calculate cosine similarity by normalizing vectors ---
def find_best_match(query_embedding, known_embeddings, known_ids, threshold=0.5):
    """
    Finds the best match by calculating true cosine similarity.
    This is done by normalizing the vectors before the dot product.
    """
    if not known_ids or known_embeddings.shape[0] == 0:
        return None, 0.0

    # Normalize the query embedding (from the image)
    query_norm = np.linalg.norm(query_embedding)
    if query_norm == 0: return None, 0.0
    query_embedding_norm = query_embedding / query_norm

    # Normalize all known embeddings (from the database)
    known_norms = np.linalg.norm(known_embeddings, axis=1, keepdims=True)
    # Avoid division by zero for any potentially invalid stored embeddings
    known_norms[known_norms == 0] = 1e-6
    known_embeddings_norm = known_embeddings / known_norms

    # The dot product of normalized vectors is the cosine similarity
    similarities = np.dot(known_embeddings_norm, query_embedding_norm.T)

    best_match_index = np.argmax(similarities)
    best_score = similarities[best_match_index]

    if best_score > threshold:
        return known_ids[best_match_index], best_score
    else:
        return None, best_score

def mark_attendance_in_db(present_ids, late_threshold_time=None):
    if not present_ids:
        print("ℹ️ No students to mark.")
        return

    today = datetime.now().strftime('%Y-%m-%d')
    now_time = datetime.now().time()
    
    is_late = False
    if late_threshold_time:
        try:
            threshold = datetime.strptime(late_threshold_time, '%H:%M').time()
            if now_time > threshold: is_late = True
        except (ValueError, TypeError):
             print(f"⚠️ Warning: Invalid late_threshold_time format '{late_threshold_time}'.")

    records = [{'student_id': sid, 'date': today, 'status': 'late' if is_late else 'present', 'marked_at': datetime.now().isoformat()} for sid in present_ids]

    try:
        supabase.table('attendance').upsert(records, on_conflict='student_id, date').execute()
        print(f"✅ Successfully marked attendance for {len(records)} students.")
    except Exception as e:
        print(f"❌ DB_ERROR: Failed to mark attendance: {e}")

# ===============================================================
# API ENDPOINTS
# ===============================================================
@app.route('/health')
def health_check():
    return jsonify({'status': 'ok', 'message': 'API is running.'})

@app.route('/get_embedding', methods=['POST'])
def get_embedding():
    if 'image' not in request.files: return jsonify({'error': 'No image file provided'}), 400
    try:
        file = request.files['image'].read()
        npimg = np.frombuffer(file, np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        faces = face_analysis_model.get(img)
        if faces: return jsonify({'embedding': faces[0].embedding.tolist()})
        else: return jsonify({'error': 'No face detected'}), 400
    except Exception: return jsonify({'error': 'Server processing error'}), 500

@app.route('/mass_attendance')
def mass_attendance_page():
    return render_template('mass-attendance.html')

@app.route('/process_image', methods=['POST'])
def process_class_image():
    print("--- INFO: /process_image endpoint hit. ---")
    if 'image' not in request.files or 'section_id' not in request.form:
        print("--- ERROR: Missing image or section_id in request. ---")
        return jsonify({'error': 'Missing image or section_id'}), 400
    
    section_id = request.form['section_id']
    print(f"--- INFO: Processing request for section_id: {section_id} ---")
    try:
        print("--- STEP 1: Attempting to fetch students from Supabase... ---")
        response = supabase.table('students').select('id, name, roll_number, face_embedding').eq('section_id', section_id).not_.is_('face_embedding', 'null').execute()
        if not response.data: 
            print(f"--- WARNING: No students with face embeddings found for section_id {section_id}. ---")
            return jsonify({'error': "No students with faces registered."}), 404
        print(f"--- SUCCESS: Fetched {len(response.data)} students from Supabase. ---")

        known_students_data = response.data
        student_map = {s['id']: {'name': s['name'], 'roll_number': s['roll_number']} for s in known_students_data}
        known_student_ids = [s['id'] for s in known_students_data]
        embeddings_from_db = [json.loads(s['face_embedding']) for s in known_students_data if s['face_embedding']]
        known_embeddings = np.array(embeddings_from_db, dtype=np.float32)
        print("--- STEP 2: Reading and decoding the uploaded image... ---")
        file = request.files['image'].read()
        npimg = np.frombuffer(file, np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        print("--- SUCCESS: Image decoded. ---")

        print("--- STEP 3: Running face detection model on the image... ---")
        detected_faces = face_analysis_model.get(img)
        print(f"--- SUCCESS: Detected {len(detected_faces)} faces in the image. ---")
        present_student_ids_with_scores = {}
        for face in detected_faces:
            box = face.bbox.astype(int)
            matched_id, score = find_best_match(face.embedding, known_embeddings, known_student_ids)
            
            if matched_id:
                if matched_id not in present_student_ids_with_scores or score > present_student_ids_with_scores[matched_id]:
                    present_student_ids_with_scores[matched_id] = score
                
                student_name = student_map[matched_id]['name']
                confidence = convert_score_to_percentage(score)
                label = f"{student_name.split(' ')[0]} ({confidence}%)"
                color = (0, 255, 0)
                cv2.rectangle(img, (box[0], box[1]), (box[2], box[3]), color, 2)
                cv2.putText(img, label, (box[0], box[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            else:
                color = (0, 0, 255)
                cv2.rectangle(img, (box[0], box[1]), (box[2], box[3]), color, 2)
                cv2.putText(img, "Unknown", (box[0], box[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

        present_ids = list(present_student_ids_with_scores.keys())
        
        mark_attendance_in_db(present_ids)

        all_student_ids_in_section = set(known_student_ids)
        present_student_ids_set = set(present_ids)
        absent_student_ids_for_display = all_student_ids_in_section - present_student_ids_set
        
        _, buffer = cv2.imencode('.jpg', img)
        img_str = base64.b64encode(buffer).decode('utf-8')
        processed_image_data_url = f"data:image/jpeg;base64,{img_str}"

        present_students = [{'name': student_map[sid]['name'], 'roll_number': student_map[sid]['roll_number'], 'confidence': convert_score_to_percentage(score)} for sid, score in present_student_ids_with_scores.items()]
        absent_students_for_display = [student_map[sid] for sid in absent_student_ids_for_display]
        
        return jsonify({
            'present_students': sorted(present_students, key=lambda x: x.get('name', '')),
            'absent_students': sorted(absent_students_for_display, key=lambda x: x.get('name', '')),
            'unknown_faces': len(detected_faces) - len(present_ids),
            'processed_image': processed_image_data_url
        })

    except Exception as e:
        print(f"❌ ERROR in /process_image: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Internal server error.'}), 500

@app.route('/recognize_single_student', methods=['POST'])
def recognize_single_student():
    if 'image' not in request.files or 'section_id' not in request.form:
        return jsonify({'error': 'Missing image or section_id'}), 400
    
    section_id = request.form['section_id']
    try:
        response = supabase.table('students').select('id, name, roll_number, face_embedding, sections(name, classes(name))').eq('section_id', section_id).not_.is_('face_embedding', 'null').execute()
        if not response.data: return jsonify({'error': "No students with faces registered."}), 404
        
        known_students_data = response.data
        known_student_ids = [s['id'] for s in known_students_data]
        embeddings_from_db = [json.loads(s['face_embedding']) for s in known_students_data if s['face_embedding']]
        known_embeddings = np.array(embeddings_from_db, dtype=np.float32)

        file = request.files['image'].read()
        npimg = np.frombuffer(file, np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        faces = face_analysis_model.get(img)

        if not faces:
            return jsonify({'status': 'no_face_detected'})

        matched_id, score = find_best_match(faces[0].embedding, known_embeddings, known_student_ids)

        if matched_id:
            student_details = next((s for s in known_students_data if s['id'] == matched_id), None)
            return jsonify({
                'status': 'match_found',
                'student': student_details,
                'confidence': convert_score_to_percentage(score)
            })
        else:
            return jsonify({'status': 'no_match_found'})

    except Exception as e:
        print(f"❌ ERROR in /recognize_single_student: {e}\n{traceback.format_exc()}")
        return jsonify({'error': 'Internal server error.'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

