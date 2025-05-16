from datetime import datetime
import asyncio
from random import randint
from config import QUERY

# Make get_tweets an async function
async def get_tweets(client, tweets): 
    if tweets is None:
        #* get tweets
        print(f'{datetime.now()} - Getting tweets...')
        # Use await for async methods
        tweets = await client.search_tweet(QUERY, product='Top')
    else:
        wait_time = randint(8, 15)
        print(f'{datetime.now()} - Getting next tweets after {wait_time} seconds ...')
        await asyncio.sleep(wait_time) 
        # Use await for async methods
        tweets = await tweets.next()

    return tweets