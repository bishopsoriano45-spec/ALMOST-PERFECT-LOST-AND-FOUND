-- Auto-Learning and Robustness Tables

-- Table: ai_feedback
-- Stores user feedback on AI predictions/matches
CREATE TABLE IF NOT EXISTS ai_feedback (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES lost_items(id) ON DELETE CASCADE, -- Could be lost or found item
    image_url TEXT NOT NULL,
    predicted_class TEXT,
    predicted_confidence FLOAT,
    actual_class TEXT, -- User corrected label
    is_correct BOOLEAN NOT NULL,
    feedback_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE -- Whether this has been used for training
);

-- Table: model_versions
-- Tracks history of AI models
CREATE TABLE IF NOT EXISTS model_versions (
    id SERIAL PRIMARY KEY,
    version_number VARCHAR(50) NOT NULL UNIQUE, -- e.g., "v1.0.0", "v1.1.0-electronics"
    file_path TEXT NOT NULL, -- Path to .pt or .onnx file
    accuracy FLOAT, -- Test accuracy
    precision FLOAT,
    recall FLOAT,
    training_samples_count INTEGER,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: background_jobs
-- Simple persistent queue for async tasks
CREATE TABLE IF NOT EXISTS background_jobs (
    id SERIAL PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL, -- e.g., "TRAIN_MODEL", "PROCESS_FEEDBACK"
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    max_retries INTEGER DEFAULT 3,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT
);

-- Index for fast job polling
CREATE INDEX idx_background_jobs_status ON background_jobs(status) WHERE status = 'pending';
