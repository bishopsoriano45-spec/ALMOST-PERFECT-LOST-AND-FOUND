
import os
import sys
import psycopg2
import math
from datetime import datetime
from dotenv import load_dotenv

# Load .env
load_dotenv()

# DB Config
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_NAME = os.getenv('DB_NAME', 'lostandfound')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', '10232003')

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return conn
    except Exception as e:
        print(f"Error connecting to DB: {e}")
        return None

def analyze_detection_accuracy(cur):
    print("\n--- Detection Accuracy Audit (Suite 1) ---")
    
    cur.execute("SELECT is_correct, predicted_confidence FROM ai_feedback WHERE is_correct IS NOT NULL")
    rows = cur.fetchall()
    
    if not rows:
        print("No feedback data available.")
        return
        
    total = len(rows)
    correct = sum(1 for r in rows if r[0])
    accuracy = correct / total
    
    # Filter out None confidence
    confidences = [r[1] for r in rows if r[1] is not None]
    avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
    
    print(f"Total Feedback Samples: {total}")
    print(f"Overall Detection Accuracy: {accuracy:.2%}")
    print(f"Average Confidence: {avg_conf:.4f}")

def analyze_confidence_calibration(cur):
    print("\n--- Confidence Quality Check (Suite 2) ---")
    
    # Only consider rows with confidence
    cur.execute("SELECT is_correct, predicted_confidence FROM ai_feedback WHERE predicted_confidence IS NOT NULL")
    rows = cur.fetchall()
    
    if not rows:
        print("No data with confidence scores.")
        return

    # Binning
    bins = {
        '0.0-0.2': {'correct': 0, 'total': 0},
        '0.2-0.4': {'correct': 0, 'total': 0},
        '0.4-0.6': {'correct': 0, 'total': 0},
        '0.6-0.8': {'correct': 0, 'total': 0},
        '0.8-1.0': {'correct': 0, 'total': 0}
    }
    
    high_conf_errors = 0
    high_conf_total = 0
    
    for is_correct, conf in rows:
        if conf is None: continue
        
        key = None
        if conf <= 0.2: key = '0.0-0.2'
        elif conf <= 0.4: key = '0.2-0.4'
        elif conf <= 0.6: key = '0.4-0.6'
        elif conf <= 0.8: key = '0.6-0.8'
        else: key = '0.8-1.0'
        
        bins[key]['total'] += 1
        if is_correct:
            bins[key]['correct'] += 1
            
        if conf > 0.8:
            high_conf_total += 1
            if not is_correct:
                high_conf_errors += 1
                
    print(f"{'Bin':<10} | {'Accuracy':<10} | {'Count':<10}")
    print("-" * 35)
    for bin_name, stats in bins.items():
        acc = stats['correct'] / stats['total'] if stats['total'] > 0 else 0.0
        print(f"{bin_name:<10} | {acc:.2%}    | {stats['total']}")
        
    if high_conf_total > 0:
        print(f"\nHigh Confidence (>0.8) Error Rate: {high_conf_errors}/{high_conf_total} ({high_conf_errors/high_conf_total:.2%})")
    else:
        print("\nNo high confidence predictions recorded.")

def analyze_smart_retraining(cur):
    print("\n--- Smart Retraining Impact (Suite 4) ---")
    cur.execute("SELECT version_number, accuracy, training_samples_count, created_at FROM model_versions ORDER BY created_at ASC")
    rows = cur.fetchall()
    
    if not rows:
        print("No model versions found in history.")
        return
        
    print(f"{'Version':<20} | {'Accuracy':<10} | {'Samples':<10} | {'Date'}")
    print("-" * 70)
    for row in rows:
        acc = row[1] if row[1] is not None else 0.0
        print(f"{row[0]:<20} | {acc:.4f}     | {row[2]:<10} | {row[3]}")

def analyze_gemini_contribution(cur):
    print("\n--- Gemini Contribution Analysis (Suite 5) ---")
    # Check lost items
    cur.execute("SELECT detection_label, description FROM lost_items ORDER BY created_at DESC LIMIT 50")
    rows = cur.fetchall()
    
    if not rows:
        print("No lost items found.")
        return
        
    enriched_count = 0
    match_count = 0
    
    for label, desc in rows:
        if desc:
            enriched_count += 1
            if label and str(label).lower() in str(desc).lower():
                match_count += 1
                
    print(f"Recent Items Analyzed: {len(rows)}")
    print(f"Items with Enriched Description: {enriched_count} ({enriched_count/len(rows):.2%})")
    if enriched_count > 0:
        print(f"Label/Description Alignment: {match_count}/{enriched_count} ({match_count/enriched_count:.2%})")

def analyze_failure_patterns(cur):
    print("\n--- Failure Pattern Mining (Suite 6) ---")
    cur.execute("""
        SELECT actual_class, predicted_class, COUNT(*) as cnt 
        FROM ai_feedback 
        WHERE is_correct = FALSE 
        GROUP BY actual_class, predicted_class 
        ORDER BY cnt DESC 
        LIMIT 5
    """)
    rows = cur.fetchall()
    
    if not rows:
        print("No failures recorded in feedback.")
        return
        
    print(f"{'Actual':<15} -> {'Predicted':<15} | count")
    print("-" * 40)
    for row in rows:
        print(f"{row[0]:<15} -> {row[1]:<15} | {row[2]}")

def main():
    print("Starting AI Pipeline Audit...")
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database. Check .env variables.")
        return
    
    try:
        cur = conn.cursor()
        analyze_detection_accuracy(cur)
        analyze_confidence_calibration(cur)
        analyze_smart_retraining(cur)
        analyze_gemini_contribution(cur)
        analyze_failure_patterns(cur)
    except Exception as e:
        print(f"An error occurred during audit: {e}")
    finally:
        conn.close()
        print("\nAudit Complete.")

if __name__ == "__main__":
    main()
