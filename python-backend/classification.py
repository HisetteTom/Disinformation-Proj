import os
import csv
import pandas as pd

# NOT USED ANYMORE ON THE WEBSITE

def select_csv_file():
    """Let user select a CSV file from the current directory"""
    csv_files = [f for f in os.listdir() if f.endswith('.csv')]
    
    if not csv_files:
        print("No CSV files found in the current directory.")
        return None
    
    print("Available CSV files:")
    for i, file in enumerate(csv_files):
        print(f"{i+1}. {file}")
    
    while True:
        try:
            selection = int(input("\nEnter the number of the file to process: "))
            if 1 <= selection <= len(csv_files):
                return csv_files[selection-1]
            else:
                print("Invalid selection. Please try again.")
        except ValueError:
            print("Please enter a valid number.")

def delete_file_if_exists(filepath):
    """Delete a file if it exists and return success status"""
    if filepath and os.path.exists(filepath):
        try:
            os.remove(filepath)
            print(f"Deleted: {filepath}")
            return True
        except Exception as e:
            print(f"Error deleting {filepath}: {e}")
    return False

def classify_tweets(csv_filename):
    """Process the CSV file and classify tweets as disinformation or not"""
    # Read the CSV file
    try:
        df = pd.read_csv(csv_filename)
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return
    
    # Verify 'is_disinfo' column exists
    if 'is_disinfo' not in df.columns:
        print("Error: 'is_disinfo' column not found in CSV.")
        return
    
    print(f"\nProcessing {len(df)} tweets from {csv_filename}...\n")
    
    # Count already classified tweets
    already_classified = df['is_disinfo'].notna().sum()
    if already_classified > 0:
        resume = input(f"{already_classified} tweets already classified. Resume from where you left off? (y/n): ").lower()
        if resume == 'y':
            start_index = already_classified
        else:
            start_index = 0
    else:
        start_index = 0
    
    # Process each tweet
    try:
        for i in range(start_index, len(df)):
            # Display tweet information
            print("\n" + "="*80)
            print(f"Tweet {i+1} of {len(df)}")
            print(f"User: {df.at[i, 'Username']}")
            print("-"*80)
            print(f"Text: {df.at[i, 'Text']}")
            print("-"*80)
            
            # Get user input for classification
            while True:
                response = input("Is this disinformation? (y/n/d to delete/q to quit): ").lower()
                if response in ['y', 'n', 'd', 'q']:
                    break
                print("Please enter 'y', 'n', 'd' to delete, or 'q' to quit.")
            
            if response == 'q':
                print("\nClassification paused. Progress has been saved.")
                break
            
            elif response == 'd':
                # Delete associated files
                print("\nDeleting tweet and associated media...")
                
                # Delete profile picture
                profile_pic = df.at[i, 'Profile_Pic']
                delete_file_if_exists(profile_pic)
                
                # Delete media files
                if 'Media_Files' in df.columns and df.at[i, 'Media_Files']:
                    media_files = str(df.at[i, 'Media_Files']).split('|')
                    for media_file in media_files:
                        delete_file_if_exists(media_file)
                
                # Remove the row from the dataframe entirely
                df = df.drop(i).reset_index(drop=True)
                print(f"Tweet {i+1} and associated media have been deleted.")
                
                i -= 1
            else:
                # Update the DataFrame for y/n responses
                df.at[i, 'is_disinfo'] = 'true' if response == 'y' else 'false'
                print(f"Tweet {i+1} classified as {'disinformation' if response == 'y' else 'not disinformation'}.")
            
            # Save progress after each classification or deletion
            df.to_csv(csv_filename, index=False)
    
    except KeyboardInterrupt:
        print("\n\nClassification interrupted. Progress has been saved.")
    
    finally:
        # Final save to ensure all classifications are recorded
        df.to_csv(csv_filename, index=False)
        print(f"\nClassification complete. Results saved to {csv_filename}")

def main():
    print("Tweet Disinformation Classifier\n")
    csv_filename = select_csv_file()
    
    if csv_filename:
        classify_tweets(csv_filename)
    else:
        print("No file selected. Exiting.")

if __name__ == "__main__":
    main()