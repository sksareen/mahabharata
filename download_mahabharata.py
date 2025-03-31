#!/usr/bin/env python3
import os
import re
import requests
from bs4 import BeautifulSoup
import time

# Create episodes directory if it doesn't exist
os.makedirs("episodes", exist_ok=True)

# URL of the podcast feed
url = "https://feeds.acast.com/public/shows/thestoriesofmahabharata"

# Get the feed content
response = requests.get(url)
soup = BeautifulSoup(response.content, 'xml')

# Find all episodes
items = soup.find_all('item')
print(f"Found {len(items)} episodes")

# Process each episode
for i, item in enumerate(items, 1):
    try:
        # Get episode title
        title = item.find('title').text.strip()
        # Clean title for filename
        clean_title = re.sub(r'[^\w\s-]', '', title).strip().replace(' ', '_')
        
        # Get episode number 
        episode_num = i
        # Try to extract episode number from title
        match = re.search(r'Episode\s+(\d+)', title, re.IGNORECASE) or re.search(r'episode\s+(\d+)', title, re.IGNORECASE)
        if match:
            episode_num = int(match.group(1))
            
        # Get enclosure URL (direct link to mp3)
        enclosure = item.find('enclosure')
        if enclosure and enclosure.get('url'):
            mp3_url = enclosure.get('url')
        else:
            # Try to find URL in content
            description = item.find('description').text
            soup_desc = BeautifulSoup(description, 'html.parser')
            audio_tag = soup_desc.find('audio')
            if audio_tag and audio_tag.get('src'):
                mp3_url = audio_tag.get('src')
            else:
                # Try to find URL with regex
                match = re.search(r'https://sphinx\.acast\.com/[^"\'>\s]+\.mp3', description)
                if match:
                    mp3_url = match.group(0)
                else:
                    print(f"Could not find MP3 URL for episode {episode_num}: {title}")
                    continue
        
        # Create filename with episode number for proper sorting
        filename = f"episodes/{episode_num:02d}_{clean_title}.mp3"
        
        # Download the file
        print(f"Downloading episode {episode_num}/{len(items)}: {title}")
        mp3_response = requests.get(mp3_url, stream=True)
        
        # Save the file
        with open(filename, 'wb') as f:
            for chunk in mp3_response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"Downloaded: {filename}")
        
        # Be nice to the server
        time.sleep(1)
        
    except Exception as e:
        print(f"Error downloading episode {i}: {str(e)}")

print("Download complete!") 