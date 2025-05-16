import os
import pandas as pd
from PIL import Image

# Import from our utility modules
from file_utils import select_csv_file, delete_file_if_exists
from image_utils import view_image, close_image_viewers

def adjust_path_if_needed(path):
    """Check if file exists in parent directory and adjust path if needed"""
    if not path:
        return path
        
    if not os.path.exists(path):
        parent_path = os.path.join('..', path)
        if os.path.exists(parent_path):
            return parent_path
    return path

def process_images(df, csv_filename, image_type):
    """Process images of the specified type (profile pics or media)"""
    print(f"\nProcessing {image_type} from {csv_filename}...")
    
    if image_type == "profile":
        column_name = "Profile_Pic"
        print("\nReviewing profile pictures...\n")
        # Keep track of processed usernames to avoid duplicates
        processed_users = set()
    else:  # media
        column_name = "Media_Files"
        print("\nReviewing media images...\n")
    
    current_row = 0
    
    while current_row < len(df):
        if current_row >= len(df):  # Check again as df size may change
            break
        
        # For profile pictures, skip if username already processed
        if image_type == "profile":
            current_username = df.at[current_row, 'Username']
            if current_username in processed_users:
                print(f"Skipping profile pic for {current_username} (already reviewed)")
                current_row += 1
                continue
            else:
                processed_users.add(current_username)
        
        # Get the image paths for the current row
        if image_type == "profile":
            image_paths = [df.at[current_row, column_name]] if pd.notna(df.at[current_row, column_name]) and df.at[current_row, column_name] else []
        else:
            media_str = str(df.at[current_row, column_name]) if pd.notna(df.at[current_row, column_name]) else ""
            image_paths = media_str.split('|') if media_str else []
        
        # Skip if no images
        if not image_paths or not any(path for path in image_paths):
            current_row += 1
            continue
        
        # Display tweet information
        print("\n" + "="*80)
        print(f"Tweet {current_row+1} of {len(df)}")
        print(f"User: {df.at[current_row, 'Username']}")
        print(f"Text: {df.at[current_row, 'Text']}")
        print("-"*80)
        
        # Process each image
        decision = 'k'  # default to keep
        for img_path in image_paths:
            if not img_path:
                continue
            
            # Check if we need to adjust the path to look in parent directory
            img_path = adjust_path_if_needed(img_path)
            
            if not os.path.exists(img_path):
                print(f"Image not found: {img_path}")
                continue
                
            print(f"Viewing image: {img_path}")
            view_result = view_image(img_path)
            
            if view_result:
                # Get user decision
                while True:
                    decision = input("Keep this image? (k)eep, (d)elete tweet, (s)kip, (q)uit: ").lower()
                    if decision in ['k', 'd', 's', 'q']:
                        break
                    print("Please enter k, d, s, or q.")
                
                # Close all image viewers after decision is made
                close_image_viewers()
                
                if decision == 'q':
                    print("\nImage review process terminated.")
                    return df
                
                elif decision == 'd':
                    print("\nDeleting tweet and all associated media...")
                    
                    # If deleting profile pic, find and delete all rows with same username
                    if image_type == "profile":
                        username_to_delete = df.at[current_row, 'Username']
                        rows_to_delete = df[df['Username'] == username_to_delete].index.tolist()
                        
                        for row_idx in rows_to_delete:
                            # Delete profile picture
                            profile_pic = adjust_path_if_needed(df.at[row_idx, 'Profile_Pic'])
                            delete_file_if_exists(profile_pic)
                            
                            # Delete all media files
                            if 'Media_Files' in df.columns and pd.notna(df.at[row_idx, 'Media_Files']) and df.at[row_idx, 'Media_Files']:
                                media_files = str(df.at[row_idx, 'Media_Files']).split('|')
                                for media_file in media_files:
                                    media_file = adjust_path_if_needed(media_file)
                                    delete_file_if_exists(media_file)
                        
                        # Remove all rows with this username
                        print(f"Deleting all {len(rows_to_delete)} tweets from user: {username_to_delete}")
                        df = df[df['Username'] != username_to_delete]
                    else:
                        # Delete just this tweet
                        # Delete profile picture
                        profile_pic = adjust_path_if_needed(df.at[current_row, 'Profile_Pic'])
                        delete_file_if_exists(profile_pic)
                        
                        # Delete all media files
                        if 'Media_Files' in df.columns and pd.notna(df.at[current_row, 'Media_Files']) and df.at[current_row, 'Media_Files']:
                            media_files = str(df.at[current_row, 'Media_Files']).split('|')
                            for media_file in media_files:
                                media_file = adjust_path_if_needed(media_file)
                                delete_file_if_exists(media_file)
                        
                        # Remove the row from the dataframe
                        df = df.drop(current_row)
                    
                    # Reset index and reindex Tweet_count column
                    df = df.reset_index(drop=True)
                    
                    # Update Tweet_count column to be sequential
                    if 'Tweet_count' in df.columns:
                        df['Tweet_count'] = range(1, len(df) + 1)
                    
                    # Save the updated CSV immediately without index
                    df.to_csv(csv_filename, index=False)
                    print(f"Tweet and associated media have been deleted.")
                    
                    # Don't increment current_row since we deleted the current row
                    # and the next row has shifted up to take its place
                    break  # Break the image loop as we've deleted all images for this tweet
                
                elif decision == 's':
                    continue  # Skip to next image
            
            else:
                print("Failed to display image. Skipping...")
        
        # Move to next tweet if we didn't delete the current one
        if decision != 'd':
            current_row += 1
    
    print("\nImage review complete!")
    
    # Final cleanup of the dataframe - fix any missing indices
    df = df.reset_index(drop=True)
    if 'Tweet_count' in df.columns:
        df['Tweet_count'] = range(1, len(df) + 1)
    
    # Final save to ensure CSV is clean
    df.to_csv(csv_filename, index=False)
    return df

def main():
    print("Tweet Image Reviewer\n")
    
    # Step 1: Select CSV file
    csv_filename = select_csv_file()
    if not csv_filename:
        print("No file selected. Exiting.")
        return
    
    # Step 2: Read the CSV
    try:
        df = pd.read_csv(csv_filename)
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return
    
    # Step 3: Choose image type to review
    while True:
        print("\nWhat would you like to review?")
        print("1. Profile pictures")
        print("2. Media images (photos, videos, etc.)")
        print("3. Exit")
        
        try:
            choice = int(input("\nEnter your choice (1-3): "))
            
            if choice == 1:
                df = process_images(df, csv_filename, "profile")
            elif choice == 2:
                df = process_images(df, csv_filename, "media")
            elif choice == 3:
                print("Exiting program.")
                break
            else:
                print("Invalid choice. Please enter 1, 2, or 3.")
        except ValueError:
            print("Please enter a valid number.")
        except KeyboardInterrupt:
            print("\n\nProgram interrupted. Saving any changes.")
            df.to_csv(csv_filename, index=False)
            break

if __name__ == "__main__":
    main()