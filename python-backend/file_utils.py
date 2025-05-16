import os

def select_csv_file():
    """Let user select a CSV file from the parent directory"""
    parent_dir = '..'  
    
    try:
        csv_files = [f for f in os.listdir(parent_dir) if f.endswith('.csv')]
    except Exception as e:
        print(f"Error accessing parent directory: {e}")
        return None
    
    if not csv_files:
        print("No CSV files found in the parent directory.")
        return None
    
    print("Available CSV files:")
    for i, file in enumerate(csv_files):
        print(f"{i+1}. {file}")
    
    while True:
        try:
            selection = int(input("\nEnter the number of the file to process: "))
            if 1 <= selection <= len(csv_files):
                # Return the selected filename with parent directory path
                return os.path.join(parent_dir, csv_files[selection-1])
            else:
                print("Invalid selection. Please try again.")
        except ValueError:
            print("Please enter a valid number.")

def delete_file_if_exists(filepath):
    """Delete a file if it exists and return success status"""
    if filepath and os.path.exists(filepath):
        try:
            os.remove(filepath)
            print(f"Deleted file: {filepath}")
            return True
        except Exception as e:
            print(f"Error deleting {filepath}: {e}")
    return False