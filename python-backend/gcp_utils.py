import os
import json
import logging
import pandas as pd
from io import StringIO
from datetime import datetime
from google.cloud import storage, firestore

class GCPStorage:
    """Class to handle GCP storage operations with Firestore for tweet data."""
    
    def __init__(self, key_path='GCP_KEYS.json'):
        """Initialize the GCP storage client and Firestore."""
        try:
            # Initialize both Storage and Firestore clients
            if os.path.exists(key_path):
                self.storage_client = storage.Client.from_service_account_json(key_path)
                self.db = firestore.Client.from_service_account_json(key_path)
            else:
                self.storage_client = storage.Client()
                self.db = firestore.Client()
            
            # Define bucket names
            self.buckets = {
                'data': 'disinformation-game-data',
                'images': 'disinformation-game-images',
                'profiles': 'disinformation-game-profiles'
            }
            
            # Create buckets if they don't exist
            for bucket_name in self.buckets.values():
                self._ensure_bucket_exists(bucket_name)
                
            print("GCP Storage and Firestore initialized successfully")
        except Exception as e:
            print(f"Error initializing GCP: {e}")
            raise
    
    def _ensure_bucket_exists(self, bucket_name):
        """Create a bucket if it doesn't exist."""
        try:
            bucket = self.storage_client.bucket(bucket_name)
            if not bucket.exists():
                bucket = self.storage_client.create_bucket(bucket_name)
                print(f"Bucket {bucket_name} created")
        except Exception as e:
            print(f"Error checking/creating bucket {bucket_name}: {e}")
            raise
    
    def save_tweet_json(self, tweet_data, tweet_id):
        """Save tweet data to Firestore database instead of Storage."""
        try:
            # Get a reference to the tweets collection
            tweet_ref = self.db.collection('tweets').document(str(tweet_id))
            
            # Add creation timestamp
            tweet_data['timestamp'] = firestore.SERVER_TIMESTAMP
            
            # Save to Firestore
            tweet_ref.set(tweet_data)
            
            print(f"Saved tweet {tweet_id} to Firestore")
            return f"tweets/{tweet_id}"
        except Exception as e:
            print(f"Error saving tweet {tweet_id} to Firestore: {e}")
            raise
    
    def upload_profile_pic(self, local_path, tweet_id, username):
        """Upload profile picture to GCP Storage."""
        if not os.path.exists(local_path):
            print(f"Profile pic not found: {local_path}")
            return ""
        
        try:
            # Extract file extension
            _, file_extension = os.path.splitext(local_path)
            
            # Simple flat structure
            file_name = f"profile_{username}{file_extension}"
            blob_path = f"users/{username}/{file_name}"
            
            # Upload file
            bucket = self.storage_client.bucket(self.buckets['profiles'])
            blob = bucket.blob(blob_path)
            blob.upload_from_filename(local_path)
            
            # Set public URL for access
            blob.make_public()
            
            print(f"Uploaded profile picture for {username}")
            return blob.public_url
        except Exception as e:
            print(f"Error uploading profile pic {local_path}: {e}")
            return local_path
    
    def upload_media_file(self, local_path, tweet_id, index):
        """Upload media file with a flat structure."""
        if not os.path.exists(local_path):
            print(f"Media file not found: {local_path}")
            return ""
        
        try:
            # Extract file extension
            _, file_extension = os.path.splitext(local_path)
            
            # Use a simpler structure
            file_name = f"tweet_{tweet_id}_media_{index}{file_extension}"
            blob_path = f"media/{tweet_id}/{file_name}"
            
            # Upload file
            bucket = self.storage_client.bucket(self.buckets['images'])
            blob = bucket.blob(blob_path)
            blob.upload_from_filename(local_path)
            
            # Set public URL for access
            blob.make_public()
            
            print(f"Uploaded media file for tweet {tweet_id}")
            return blob.public_url
        except Exception as e:
            print(f"Error uploading media file {local_path}: {e}")
            return local_path
    
    def save_tweets_dataframe(self, df, filename):
        """Save CSV backup to GCP Storage and also update Firestore."""
        try:
            # First save CSV backup
            csv_data = df.to_csv(index=False)
            bucket = self.storage_client.bucket(self.buckets['data'])
            blob = bucket.blob(filename)
            blob.upload_from_string(csv_data, content_type='text/csv')
            
            # Update Firestore with tweets from DataFrame
            batch = self.db.batch()
            batch_count = 0
            batch_size = 500  # Firestore limit
            
            for _, row in df.iterrows():
                # Convert row to dict for Firestore
                tweet_data = row.to_dict()
                tweet_id = str(tweet_data.get('Tweet_ID', f"unknown_{row.name}"))
                
                # Add to batch
                tweet_ref = self.db.collection('tweets').document(tweet_id)
                batch.set(tweet_ref, tweet_data)
                batch_count += 1
                
                # When batch is full, commit and start a new one
                if batch_count >= batch_size:
                    batch.commit()
                    batch = self.db.batch()
                    batch_count = 0
            
            # Commit any remaining tweets
            if batch_count > 0:
                batch.commit()
            
            print(f"Saved DataFrame with {len(df)} tweets to {filename} and updated Firestore")
            return f"gs://{self.buckets['data']}/{filename}"
        except Exception as e:
            print(f"Error saving DataFrame to GCP: {e}")
            raise
    
    def load_tweets_dataframe(self, filename):
        """Load tweets DataFrame from GCP Storage or Firestore."""
        try:
            # First try to get from Storage for backward compatibility
            bucket = self.storage_client.bucket(self.buckets['data'])
            blob = bucket.blob(filename)
            
            if blob.exists():
                # Download as string and convert to DataFrame
                content = blob.download_as_text()
                df = pd.read_csv(StringIO(content))
                print(f"Loaded DataFrame with {len(df)} tweets from Cloud Storage")
                return df
            else:
                # If not in Storage, try Firestore
                tweets_ref = self.db.collection('tweets')
                tweets = tweets_ref.stream()
                
                # Convert Firestore documents to pandas DataFrame
                tweets_list = []
                for tweet in tweets:
                    tweet_data = tweet.to_dict()
                    tweets_list.append(tweet_data)
                
                if tweets_list:
                    df = pd.DataFrame(tweets_list)
                    print(f"Loaded DataFrame with {len(df)} tweets from Firestore")
                    return df
                else:
                    print("No tweets found in Firestore")
                    return None
        except Exception as e:
            print(f"Error loading DataFrame from GCP: {e}")
            return None