"""Refresh the checked-in episode snapshot from Moonshot's official SoundOn RSS."""
import datetime
import email.utils
import json
from pathlib import Path
import urllib.request
import xml.etree.ElementTree as ET

FEED = 'https://feeds.soundon.fm/podcasts/8529b16e-4bf3-4470-87e4-c8ec8ddd5c76.xml'
with urllib.request.urlopen(FEED, timeout=30) as response:
    root = ET.fromstring(response.read())
items = sorted(root.findall('./channel/item'), key=lambda item: email.utils.parsedate_to_datetime(item.findtext('pubDate')), reverse=True)
episodes = []
for item in items[:3]:
    published = email.utils.parsedate_to_datetime(item.findtext('pubDate'))
    seconds = int(item.findtext('{http://www.itunes.com/dtds/podcast-1.0.dtd}duration'))
    episodes.append({'title': item.findtext('title'), 'url': item.findtext('link'), 'publishedAt': published.date().isoformat(), 'durationMinutes': round(seconds / 60)})
if len(episodes) < 3:
    raise ValueError('Expected at least three published episodes; existing snapshot was preserved')
snapshot = {'source': FEED, 'episodes': episodes}
Path(__file__).resolve().parents[1].joinpath('src/data/episodes.json').write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n')
print('Updated three episodes from the official feed. Run npm run build and review the changes.')
