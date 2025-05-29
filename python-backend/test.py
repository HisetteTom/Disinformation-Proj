import os

#DEBUG PURPOSES

def list_profile_pics():
    # Path to profile pics directory
    profile_pics_dir = 'profile_pics'
    
    # Check if directory exists
    if not os.path.exists(profile_pics_dir):
        print(f"Directory '{profile_pics_dir}' not found")
        return
    
    # Get list of files
    try:
        files = os.listdir(profile_pics_dir)
        
        # Check if directory is empty
        if not files:
            print(f"No files found in '{profile_pics_dir}' directory")
            return
        
        # Print each filename
        print(f"Found {len(files)} files in '{profile_pics_dir}':")
        for file in files:
            print(f"- {file}")
            
    except Exception as e:
        print(f"Error listing directory: {e}")

if __name__ == "__main__":
    list_profile_pics()