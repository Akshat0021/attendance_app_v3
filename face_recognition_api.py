from flask import Flask, request, jsonify
from flask_cors import CORS
import insightface
import numpy as np
import cv2

app = Flask(__name__)
CORS(app)

# Load the insightface model
# The model will be downloaded automatically on the first run
model = insightface.app.FaceAnalysis(providers=['CPUExecutionProvider'])
model.prepare(ctx_id=0, det_size=(640, 640))

@app.route('/get_embedding', methods=['POST'])
def get_embedding():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file = request.files['image']
    # Read the image file as a numpy array
    filestr = file.read()
    npimg = np.frombuffer(filestr, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    # Get face embeddings
    faces = model.get(img)

    if len(faces) > 0:
        # Return the embedding of the first detected face
        embedding = faces[0].embedding
        return jsonify({'embedding': embedding.tolist()})
    else:
        return jsonify({'error': 'No face detected in the image'}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)