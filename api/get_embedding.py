from flask import Flask, request, jsonify
from flask_cors import CORS
import insightface
import numpy as np
import cv2
import os

app = Flask(__name__)
CORS(app)

# --- Model Loading ---
# Vercel has a read-only filesystem, except for the /tmp directory.
# We'll configure insightface to use /tmp for its model cache.
os.environ['INSIGHTFACE_HOME'] = '/tmp/.insightface'

model = None

def load_model():
    global model
    if model is None:
        print("Loading InsightFace model...")
        # The model will be downloaded to the /tmp directory on the first run
        model = insightface.app.FaceAnalysis(providers=['CPUExecutionProvider'])
        model.prepare(ctx_id=0, det_size=(640, 640))
        print("Model loaded successfully.")

# Pre-load the model when the serverless function starts up
load_model()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>', methods=['POST'])
def get_embedding(path):
    # Ensure the model is loaded (it might not be if the instance is cold)
    if model is None:
        load_model()
        if model is None: # Check again in case loading failed
             return jsonify({'error': 'Model could not be loaded'}), 500

    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file = request.files['image']
    filestr = file.read()
    npimg = np.frombuffer(filestr, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    if img is None:
        return jsonify({'error': 'Could not decode image'}), 400

    try:
        faces = model.get(img)
        if len(faces) > 0:
            embedding = faces[0].embedding
            return jsonify({'embedding': embedding.tolist()})
        else:
            return jsonify({'error': 'No face detected in the image'}), 400
    except Exception as e:
        print(f"Error processing image: {e}")
        return jsonify({'error': 'An error occurred during face detection.'}), 500
