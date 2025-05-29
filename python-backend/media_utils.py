import os
import aiohttp
from datetime import datetime
import re

async def download_profile_to_memory(session, profile_url):
    """Download profile picture to memory instead of local file system"""
    if not profile_url:
        return None
        
    try:
        async with session.get(profile_url) as response:
            if response.status == 200:
                return await response.read()
    except Exception as e:
        print(f"Error downloading profile picture: {e}")
        
    return None

async def download_media_to_memory(session, media_url):
    """Download media file to memory instead of local file system"""
    if not media_url:
        return None
        
    try:
        async with session.get(media_url) as response:
            if response.status == 200:
                return await response.read()
    except Exception as e:
        print(f"Error downloading media: {e}")
        
    return None

def ensure_dir_exists(directory):
    """Create directory if it doesn't exist."""
    if not os.path.exists(directory):
        os.makedirs(directory)

def get_tweet_folder_structure(tweet_id):
    """Create folder structure based on tweet ID."""
    # Convert to string if not already
    id_str = str(tweet_id)
    
    # Use groups of 3 digits to create folders
    folder_path = "/".join([id_str[i:i+3] for i in range(0, min(9, len(id_str)), 3)])
    return folder_path

async def download_profile_picture(session, tweet, username, tweet_id):
    """Download profile picture from Twitter user."""
    if not tweet or not tweet.user or not hasattr(tweet.user, 'profile_image_url'):
        print(f'{datetime.now()} - No profile image for this user')
        return ""

    try:
        # Create organized directory structure for profile pictures
        profile_dir = "profile_pics"
        ensure_dir_exists(profile_dir)
        
        # Create tweet ID subdirectory structure
        tweet_subdir = get_tweet_folder_structure(tweet_id)
        full_dir = os.path.join(profile_dir, tweet_subdir)
        ensure_dir_exists(full_dir)
        
        # Get the image URL and replace '_normal' to get full size
        url = tweet.user.profile_image_url
        if url:
            url = url.replace('_normal', '')

        # Sanitize username for filename
        safe_username = re.sub(r'[^\w\-_]', '_', username)
        
        # Determine file extension from URL
        file_ext = '.jpg'  # Default
        if '.' in url.split('/')[-1]:
            file_ext = '.' + url.split('/')[-1].split('.')[-1]
            # Sometimes URLs have query parameters
            if '?' in file_ext:
                file_ext = file_ext.split('?')[0]

        # Create filename
        filename = f"{safe_username}_profile{file_ext}"
        filepath = os.path.join(full_dir, filename)

        # Download the image
        async with session.get(url) as response:
            if response.status == 200:
                with open(filepath, 'wb') as f:
                    f.write(await response.read())
                print(f'{datetime.now()} - Downloaded profile picture to {filepath}')
                return filepath
            else:
                print(f'{datetime.now()} - Error downloading profile picture: {response.status}')
                return ""

    except Exception as e:
        print(f'{datetime.now()} - Error downloading profile picture: {e}')
        return ""

async def download_media_content(session, tweet, tweet_id):
    """Download media content from tweet."""
    if not tweet or not hasattr(tweet, 'media') or not tweet.media:
        return []

    media_files = []
    try:
        # Create organized directory structure for media files
        media_dir = "downloaded_images"
        ensure_dir_exists(media_dir)
        
        # Create tweet ID subdirectory structure
        tweet_subdir = get_tweet_folder_structure(tweet_id)
        full_dir = os.path.join(media_dir, tweet_subdir)
        ensure_dir_exists(full_dir)

        # Process each media attachment
        for i, media in enumerate(tweet.media):
            if hasattr(media, 'media_url') and media.media_url:
                url = media.media_url
                
                # Determine file extension
                file_ext = '.jpg'  # Default
                if '.' in url.split('/')[-1]:
                    file_ext = '.' + url.split('/')[-1].split('.')[-1]
                    # Sometimes URLs have query parameters
                    if '?' in file_ext:
                        file_ext = file_ext.split('?')[0]
                
                # Create filename
                filename = f"tweet_{tweet_id}_media_{i}{file_ext}"
                filepath = os.path.join(full_dir, filename)

                # Download the image
                async with session.get(url) as response:
                    if response.status == 200:
                        with open(filepath, 'wb') as f:
                            f.write(await response.read())
                        print(f'{datetime.now()} - Downloaded media file to {filepath}')
                        media_files.append(filepath)
                    else:
                        print(f'{datetime.now()} - Error downloading media: {response.status}')

    except Exception as e:
        print(f'{datetime.now()} - Error downloading media: {e}')

    return media_files