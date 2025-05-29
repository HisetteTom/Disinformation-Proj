import os
import time
import pyautogui

#NOT USED ANYMORE, ON THE WEBSITE

def view_image(image_path):
    """Display an image and automatically focus back to console"""
    # Check if we need to adjust the path to look in parent directory
    if image_path and not os.path.exists(image_path):
        # Try looking in parent directory
        parent_path = os.path.join('..', image_path)
        if os.path.exists(parent_path):
            image_path = parent_path
        else:
            print(f"Image file not found: {image_path}")
            print(f"Also checked: {parent_path}")
            return False
    
    try:
        # On Windows, use the default image viewer via os.startfile
        os.startfile(image_path)
        
        # Try to refocus using Alt+Tab
        try:
            time.sleep(4)  # Wait for image viewer to open
            
            pyautogui.keyDown('alt')
            pyautogui.press('tab')
            pyautogui.keyUp('alt')
        
        except Exception:
            # If refocusing fails, don't interrupt the flow
            pass
        
        print("\nImage displayed. After viewing, return to this window.")
        return True
    except Exception as e:
        print(f"Error viewing image: {e}")
        return False


def close_image_viewers():
    """Close all common image viewer applications"""
    try:
        # The actual process name is just "Photos"
        print("Closing Photos viewer...")
        os.system('taskkill /f /im Photos.exe')
        
        # This PowerShell command works to find processes with "Photo" in the name
        os.system('powershell "Get-Process | Where-Object {$_.ProcessName -like \'*Photo*\'} | Stop-Process -Force"')

        # Short wait
        time.sleep(0.3)
    except Exception as e:
        # If closing fails, continue anyway
        print(f"Note: Failed to close image viewer: {e}")


def delete_file_if_exists(filepath):
    """Delete a file if it exists and return success status"""
    original_filepath = filepath
    
    # If file doesn't exist, check if it's in parent directory
    if filepath and not os.path.exists(filepath):
        parent_filepath = os.path.join('..', filepath)
        if os.path.exists(parent_filepath):
            filepath = parent_filepath
    
    if filepath and os.path.exists(filepath):
        try:
            os.remove(filepath)
            print(f"Deleted file: {filepath}")
            return True
        except Exception as e:
            print(f"Error deleting {filepath}: {e}")
    else:
        print(f"File not found: {original_filepath}")
    
    return False