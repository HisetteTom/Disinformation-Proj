import os

# Constants
MINIMUM_TWEETS = 10
QUERY = '(#tech) lang:en until:2021-05-05 since:2020-01-01 -filter:retweets -filter:replies'
IMAGES_DIR = 'downloaded_images'
PROFILE_PICS_DIR = 'profile_pics'

# Create directories if they don't exist
os.makedirs(IMAGES_DIR, exist_ok=True)
os.makedirs(PROFILE_PICS_DIR, exist_ok=True)
