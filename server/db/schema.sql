-- Database Schema for Local Lost & Found System

-- Users Table (Local Reference from Atoms Cloud)
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY, -- Reference to Atoms Cloud User ID
    name TEXT,
    email TEXT,
    phone_number TEXT,
    role TEXT CHECK(role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lost Items Table
CREATE TABLE IF NOT EXISTS lost_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    location TEXT,
    date_lost DATE,
    image_path TEXT, -- Local storage path
    status TEXT CHECK(status IN ('open', 'matched', 'claimed', 'closed')) DEFAULT 'open',
    detection_label TEXT,
    confidence_score REAL,
    contact_email TEXT,
    contact_phone TEXT,
    tags TEXT, -- JSON string of tags
    embedding TEXT, -- JSON string of vector
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);

-- Found Items Table
CREATE TABLE IF NOT EXISTS found_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    location TEXT,
    date_found DATE,
    image_path TEXT, -- Local storage path
    status TEXT CHECK(status IN ('open', 'matched', 'claimed', 'closed')) DEFAULT 'open',
    detection_label TEXT,
    confidence_score REAL,
    tags TEXT, -- JSON string of tags
    embedding TEXT, -- JSON string of vector
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);

-- Claims Table
CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lost_item_id INTEGER,
    found_item_id INTEGER,
    claimer_id TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    match_score REAL,
    verification_notes TEXT,
    admin_decision_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(lost_item_id) REFERENCES lost_items(id),
    FOREIGN KEY(found_item_id) REFERENCES found_items(id),
    FOREIGN KEY(claimer_id) REFERENCES users(user_id)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    type TEXT CHECK(type IN ('match_found', 'item_claimed', 'verification_required', 'system')) DEFAULT 'system',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_item_id TEXT, -- Format: 'lost_1' or 'found_1'
    match_id INTEGER, -- Reference to potential match
    metadata TEXT, -- JSON string with match details (score, explanation, etc.)
    read_status BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);

-- Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT,
    user_name TEXT,
    message TEXT NOT NULL,
    type TEXT CHECK(type IN ('complaint', 'suggestion', 'bug', 'other')) DEFAULT 'complaint',
    status TEXT CHECK(status IN ('new', 'read', 'resolved')) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Logs Table
CREATE TABLE IF NOT EXISTS ai_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    detection_accuracy REAL,
    matching_accuracy REAL,
    model_version TEXT,
    training_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lost_items_user_id ON lost_items(user_id);
CREATE INDEX IF NOT EXISTS idx_found_items_user_id ON found_items(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_claimer_id ON claims(claimer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
