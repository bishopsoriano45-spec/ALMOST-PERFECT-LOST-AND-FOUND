import time
import os
import subprocess
import csv
import sys

# Path to the results file
RESULTS_FILE = r'runs\detect\runs\train\electronics_gadgets\results.csv'
TARGET_EPOCH = 7

def get_completed_epochs():
    if not os.path.exists(RESULTS_FILE):
        return 0
    try:
        with open(RESULTS_FILE, 'r') as f:
            # Strip whitespace lines
            lines = [line.strip() for line in f if line.strip()]
            # Subtract 1 for header
            count = len(lines) - 1
            return max(0, count)
    except Exception as e:
        print(f"Error reading file: {e}")
        return 0

def kill_training_process():
    print("Attempting to kill training process...")
    # Use wmic to find and kill the specific process to avoid killing other python scripts
    try:
        # Check if process exists first
        cmd_check = 'wmic process where "CommandLine like \'%train_electronics.py%\'" get ProcessId'
        result = subprocess.run(cmd_check, shell=True, capture_output=True, text=True)
        if 'ProcessId' in result.stdout:
            # Kill it
            cmd_kill = 'wmic process where "CommandLine like \'%train_electronics.py%\'" call terminate'
            subprocess.run(cmd_kill, shell=True)
            print("Termination signal sent.")
        else:
            print("Process not found.")
    except Exception as e:
        print(f"Error killing process: {e}")

def main():
    print(f"Monitoring {RESULTS_FILE}")
    print(f"Waiting for {TARGET_EPOCH} epochs to complete...")
    
    while True:
        completed = get_completed_epochs()
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] Completed epochs: {completed}/{TARGET_EPOCH}")
        
        if completed >= TARGET_EPOCH:
            print(f"Target epoch {TARGET_EPOCH} reached! Stopping training...")
            kill_training_process()
            print("Done.")
            break
        
        # Checking every minute
        time.sleep(60)

if __name__ == "__main__":
    main()
