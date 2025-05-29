from twikit import Client, TooManyRequests
from datetime import datetime
import asyncio
import aiohttp
import re
from configparser import ConfigParser
from config import QUERY, MINIMUM_TWEETS
from text_utils import extract_links, print_tweet_structure
from tweet_api import get_tweets
from media_utils import download_media_to_memory, download_profile_to_memory
from gcp_utils import GCPStorage


def extract_query_hashtag(query_string):
    """Extract the main hashtag from the query string in config.py."""
    import re
    # Look for hashtag pattern in the query
    hashtag_match = re.search(r'#(\w+)', query_string)
    if hashtag_match:
        return hashtag_match.group(1).lower()  # Return without the # symbol
    return ""


# Define a main async function to wrap the core logic
async def main():
    # Login credentials
    config = ConfigParser()
    config.read('config.ini')
    username = config['X']['username']
    email = config['X']['email']
    password = config['X']['password']

    print(f'{datetime.now()} - Account details : {username} {email} {password}')
    
    # Extract the main hashtag from the QUERY in config.py
    main_hashtag = extract_query_hashtag(QUERY)
    print(f'{datetime.now()} - Using main hashtag from config: #{main_hashtag}')

    # Initialize GCP storage
    print(f'{datetime.now()} - Initializing GCP Storage...')
    try:
        gcp = GCPStorage()
        print(f'{datetime.now()} - GCP Storage initialized successfully')
    except Exception as e:
        print(f'{datetime.now()} - Error initializing GCP Storage: {e}')
        print(f'{datetime.now()} - Cannot continue without cloud storage')
        return

    # Get latest tweet count from Firestore
    tweet_count = 0
    try:
        # Query Firestore for the highest Tweet_count value
        tweets_ref = gcp.db.collection('tweets')
        query = tweets_ref.order_by('Tweet_count', direction='DESCENDING').limit(1)
        results = query.stream()
        
        for doc in results:
            tweet_data = doc.to_dict()
            if 'Tweet_count' in tweet_data:
                tweet_count = int(tweet_data['Tweet_count'])
                print(f'{datetime.now()} - Found existing data in Firestore. Will continue from Tweet_count: {tweet_count}')
                break
    except Exception as e:
        print(f'{datetime.now()} - Error reading from Firestore: {e}. Starting from 0.')

    # Authenticate to X.com
    client = Client(language='en-US')

    # Use await for async methods
    print(f'{datetime.now()} - Logging in...')
    await client.login(auth_info_1=username, auth_info_2=email, password=password)
    print(f'{datetime.now()} - Logged in successfully')

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
                
                # Use the main hashtag from config.py
                hashtags_str = main_hashtag
                print(f"Using hashtag from config: #{hashtags_str}")

                # Download and directly upload profile picture to GCP
                profile_pic_path = ""
                if hasattr(tweet.user, 'profile_image_url'): 
                    profile_pic_url = tweet.user.profile_image_url
                    # Get original size by removing _normal
                    profile_pic_url = profile_pic_url.replace('_normal', '') if profile_pic_url else None
                    print(f"Found profile image URL: {profile_pic_url}")
                    
                    if profile_pic_url:
                        try:
                            # Download to memory then upload directly to GCP
                            profile_data = await download_profile_to_memory(session, profile_pic_url)
                            if profile_data:
                                # Upload directly to GCP from memory
                                profile_pic_path = gcp.upload_profile_pic_from_memory(profile_data, tweet_id, user_name)
                                print(f"{datetime.now()} - Uploaded profile picture to GCP")
                        except Exception as e:
                            print(f"{datetime.now()} - Error handling profile picture: {e}")

                # Download and directly upload media content to GCP
                media_paths = []
                media_paths_str = ""
                
                if hasattr(tweet, 'media') and tweet.media:
                    for i, media_item in enumerate(tweet.media):
                        try:
                            # Get media URL 
                            media_url = None
                            if hasattr(media_item, 'media_url'):
                                media_url = media_item.media_url
                                print(f"Found media URL: {media_url}")
                            
                            if not media_url:
                                continue
                                
                            # Download to memory then upload directly to GCP
                            media_data = await download_media_to_memory(session, media_url)
                            if media_data:
                                # Upload directly to GCP from memory
                                cloud_path = gcp.upload_media_file_from_memory(media_data, tweet_id, i)
                                media_paths.append(cloud_path)
                                print(f"{datetime.now()} - Uploaded media {i} to GCP")
                        except Exception as e:
                            print(f"{datetime.now()} - Error handling media {i}: {e}")
                
                if media_paths:
                    media_paths_str = '|'.join(media_paths)
                
                # Store tweet in Firestore
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
                    'Hashtags': hashtags_str,
                    'is_disinfo': ''
                }
                
                # Save directly to Firestore
                try:
                    gcp.save_tweet_json(tweet_json, str(tweet_id))
                    print(f"{datetime.now()} - Saved tweet {tweet_id} to Firestore")
                except Exception as e:
                    print(f"{datetime.now()} - Error saving tweet to Firestore: {e}")

                if tweet_count >= target_count:
                    break

            print(f'{datetime.now()} - Got {tweet_count} tweets so far')
            if tweet_count >= target_count:
                break

        new_tweets_added = tweet_count - (tweet_count - MINIMUM_TWEETS) if tweet_count >= target_count else tweet_count
        print(f'{datetime.now()} - Done! Added {new_tweets_added} new tweets. Total tweets: {tweet_count}')


# Run the main async function
if __name__ == "__main__":
    asyncio.run(main())