import re

# Extract t.co links from tweet text
def extract_links(text):
    # Pattern to match t.co URLs
    pattern = r'https?://t\.co/\w+'
    return re.findall(pattern, text)

def extract_hashtags(text):
    """Extract hashtags from tweet text"""
    if not text:
        return []
        
    # Regular expression to find hashtags
    hashtag_pattern = r'#(\w+)'
    hashtags = re.findall(hashtag_pattern, text)
    
    # Convert to lowercase for better matching
    return [tag.lower() for tag in hashtags]


# Function to print tweet structure for debugging
def print_tweet_structure(tweet, level=0, max_level=3):
    """Print tweet object structure for debugging"""
    if level >= max_level:
        return
    
    indent = '  ' * level
    if hasattr(tweet, '__dict__'):
        attrs = vars(tweet)
        for key, value in attrs.items():
            if key.startswith('_'):
                continue
                
            print(f"{indent}{key}: ", end='')
            
            # Handle different types of values
            if isinstance(value, (str, int, float, bool)) or value is None:
                print(value)
            elif isinstance(value, (list, tuple)):
                print(f"[{len(value)} items]")
                if level < max_level - 1 and value:
                    print_tweet_structure(value[0], level + 1, max_level)
            elif isinstance(value, dict):
                print(f"{{{len(value)} items}}")
                for k, v in list(value.items())[:1]:
                    print(f"{indent}  {k}: {type(v)}")
            else:
                print(f"<{type(value).__name__}>")
                print_tweet_structure(value, level + 1, max_level)