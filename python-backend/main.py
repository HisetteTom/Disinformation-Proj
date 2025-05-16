from twikit import Client, TooManyRequests
from datetime import datetime
import csv
from configparser import ConfigParser
import asyncio
import os
import aiohttp
import pandas as pd
import json

# Import from our modules
from config import MINIMUM_TWEETS
from text_utils import extract_links, print_tweet_structure
from tweet_api import get_tweets
from media_utils import download_profile_picture, download_media_content
from gcp_utils import GCPStorage

# Define a main async function to wrap the core logic
async def main():
    #* login credentials
    config = ConfigParser()
    config.read('config.ini')
    username = config['X']['username']
    email = config['X']['email']
    password = config['X']['password']

    print(f'{datetime.now()} - Account details : {username} {email} {password}')

    # Initialize GCP storage
    print(f'{datetime.now()} - Initializing GCP Storage...')
    try:
        gcp = GCPStorage()
        print(f'{datetime.now()} - GCP Storage initialized successfully')
    except Exception as e:
        print(f'{datetime.now()} - Error initializing GCP Storage: {e}')
        print(f'{datetime.now()} - Falling back to CSV storage')
        gcp = None

    #* ask for CSV/JSON filename
    filename_base = input("Enter the base filename to use (e.g., tweets): ")
    if not filename_base:
        filename_base = 'tweets'
        
    # For CSV compatibility (still keeping a CSV version as backup)
    csv_filename = f"{filename_base}.csv"
    
    #* check if file exists to determine if headers should be written
    file_exists = os.path.isfile(csv_filename)
    
    # Initialize tweet_count
    tweet_count = 0
    
    # If using GCP, try to get the most recent tweet count from there
    if gcp:
        try:
            df = gcp.load_tweets_dataframe(csv_filename)
            if df is not None and not df.empty and 'Tweet_count' in df.columns:
                last_tweet_count = df['Tweet_count'].max()
                tweet_count = int(last_tweet_count)
                print(f'{datetime.now()} - Found existing data in GCP with {len(df)} tweets. Will continue from Tweet_count: {tweet_count}')
        except Exception as e:
            print(f'{datetime.now()} - Error reading from GCP: {e}. Checking local file.')
    
    # If GCP didn't work or isn't being used, check local file
    if tweet_count == 0 and file_exists:
        try:
            # Try to read the last row to get the most recent Tweet_count
            df = pd.read_csv(csv_filename)
            if not df.empty and 'Tweet_count' in df.columns:
                last_tweet_count = df['Tweet_count'].max()
                tweet_count = int(last_tweet_count)
                print(f'{datetime.now()} - Found existing CSV with {len(df)} tweets. Will continue from Tweet_count: {tweet_count}')
        except Exception as e:
            print(f'{datetime.now()} - Error reading existing CSV: {e}. Starting count from 0.')
    
    # If file doesn't exist, create it with headers
    if not file_exists:
        with open(csv_filename, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(['Tweet_count', 'Username', 'Text', 'Created_At', 'Retweets', 'Likes', 
                            'Tweet_ID', 'Profile_Pic', 'Media_Files', 'T_co_Links', 'is_disinfo'])

    #* authenticate to X.com
    client = Client(language='en-US')

    # Use await for async methods
    print(f'{datetime.now()} - Logging in...')
    await client.login(auth_info_1=username, auth_info_2=email, password=password)
    print(f'{datetime.now()} - Logged in successfully')

    # Initialize pandas DataFrame for storing tweets
    columns = ['Tweet_count', 'Username', 'Text', 'Created_At', 'Retweets', 'Likes', 
              'Tweet_ID', 'Profile_Pic', 'Media_Files', 'T_co_Links', 'is_disinfo']
    all_tweets_df = pd.DataFrame(columns=columns)

    # Create a session for downloading images
    async with aiohttp.ClientSession() as session:
        tweets = None
        target_count = tweet_count + MINIMUM_TWEETS
        
        while tweet_count < target_count:
            try:
                tweets = await get_tweets(client, tweets)
            except TooManyRequests as e:
                rate_limit_reset = datetime.fromtimestamp(e.rate_limit_reset)
                print(f'{datetime.now()} - Rate limit reached. Waiting until {rate_limit_reset}')
                wait_time = rate_limit_reset - datetime.now()
                await asyncio.sleep(wait_time.total_seconds())
                continue
            except Exception as e:
                print(f'{datetime.now()} - An error occurred: {e}')
                break

            if not tweets:
                print(f'{datetime.now()} - No more tweets found')
                break

            for tweet in tweets:
                tweet_count += 1
                tweet_text = tweet.text.replace('\n', ' ') if tweet.text else ''
                user_name = tweet.user.name if tweet.user else 'N/A'
                created_at = tweet.created_at if tweet.created_at else 'N/A'
                retweet_count = tweet.retweet_count if tweet.retweet_count is not None else 0
                favorite_count = tweet.favorite_count if tweet.favorite_count is not None else 0
                tweet_id = tweet.id if hasattr(tweet, 'id') else f"unknown_{tweet_count}"

                # Debug tweet structure for first tweet
                if tweet_count == 1:
                    print("\n----- Tweet Structure -----")
                    print_tweet_structure(tweet)
                    print("--------------------------\n")
                
                # Debug tweet structure
                print(f"\n{datetime.now()} - Processing tweet ID: {tweet_id}")
                
                # Extract t.co links from tweet text
                t_co_links = extract_links(tweet_text)
                t_co_links_str = '|'.join(t_co_links) if t_co_links else ''
                print(f"Found t.co links: {t_co_links_str}")

                # Download profile picture (local download first)
                profile_pic_path = await download_profile_picture(session, tweet, user_name, tweet_id)

                # Download media content (local download first)
                media_paths = await download_media_content(session, tweet, tweet_id)
                media_paths_str = '|'.join(media_paths) if media_paths else ''
                
                # If using GCP, upload files to cloud and update paths
                if gcp:
                    # Upload profile picture to GCP if it exists
                    if profile_pic_path:
                        cloud_profile_path = gcp.upload_profile_pic(profile_pic_path, tweet_id, user_name)
                        profile_pic_path = cloud_profile_path
                    
                    # Upload each media file to GCP if they exist
                    if media_paths:
                        cloud_media_paths = []
                        for i, path in enumerate(media_paths):
                            cloud_path = gcp.upload_media_file(path, tweet_id, i)
                            cloud_media_paths.append(cloud_path)
                        media_paths_str = '|'.join(cloud_media_paths)
                    
                    # Store complete tweet as JSON in organized folder structure
                    tweet_json = {
                        'Tweet_count': tweet_count,
                        'Username': user_name,
                        'Text': tweet_text,
                        'Created_At': str(created_at),
                        'Retweets': retweet_count,
                        'Likes': favorite_count,
                        'Tweet_ID': tweet_id,
                        'Profile_Pic': profile_pic_path,
                        'Media_Files': media_paths_str,
                        'T_co_Links': t_co_links_str,
                        'is_disinfo': ''
                    }
                    gcp.save_tweet_json(tweet_json, str(tweet_id))

                # Create tuple for CSV and DataFrame
                tweet_data = [
                    tweet_count, user_name, tweet_text, created_at,
                    retweet_count, favorite_count, tweet_id,
                    profile_pic_path, media_paths_str, t_co_links_str,
                    ''  # Empty is_disinfo column
                ]

                # Add to DataFrame
                all_tweets_df.loc[len(all_tweets_df)] = tweet_data

                # Write to local CSV as backup
                with open(csv_filename, 'a', newline='', encoding='utf-8') as file:
                    writer = csv.writer(file)
                    writer.writerow(tweet_data)

                if tweet_count >= target_count:
                    break

            print(f'{datetime.now()} - Got {tweet_count} tweets so far')
            if tweet_count >= target_count:
                break

        # Upload final DataFrame to GCP
        if gcp:
            try:
                gcp.save_tweets_dataframe(all_tweets_df, csv_filename)
                print(f'{datetime.now()} - Successfully uploaded complete DataFrame to GCP')
            except Exception as e:
                print(f'{datetime.now()} - Error uploading DataFrame to GCP: {e}')

        new_tweets_added = target_count - (tweet_count - MINIMUM_TWEETS) if tweet_count >= target_count else tweet_count
        print(f'{datetime.now()} - Done! Added {new_tweets_added} new tweets. Total tweets in file: {tweet_count}')

# Run the main async function
if __name__ == "__main__":
    asyncio.run(main())