from __future__ import annotations
import os
import json
import requests
import wikipedia
import time
import math
import pathlib
import uuid
import textwrap
import re
from typing import Dict, Any, List, Optional
from langchain.tools import tool
from ddgs import DDGS
from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from scrapingant_client import ScrapingAntClient

try:
    import numpy as np
    from sentence_transformers import SentenceTransformer, util
    _SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    _SENTENCE_TRANSFORMERS_AVAILABLE = False
    np = None

load_dotenv()
os.environ["LANGCHAIN_TRACING_V2"] = "false"

# Global variable to store the last played track ID for Spotify embed
_last_played_track_id = None

def get_last_played_track_id():
    """Get the last played track ID for Spotify embed."""
    return _last_played_track_id

def clear_last_played_track_id():
    """Clear the last played track ID."""
    global _last_played_track_id
    _last_played_track_id = None

# ------------------------------------------------
#  Weather
# ------------------------------------------------
@tool
def get_weather(location: str, include_forecast: bool = False) -> str:
    """
    Get current weather and optional 5-day forecast using Open-Meteo API.
    Global coverage with 1km resolution, no API key required.
    """
    try:
        # Geocoding with proper error handling
        geo_url = "https://nominatim.openstreetmap.org/search"
        geo_params = {
            "q": location.strip(),
            "format": "json",
            "limit": 1,
            "accept-language": "en"
        }
        geo_headers = {"User-Agent": "weather-tool/1.0"}
        
        geo_resp = requests.get(
            geo_url,
            params=geo_params,
            headers=geo_headers,
            timeout=10
        )
        geo_resp.raise_for_status()
        geo_data = geo_resp.json()
        
        if not geo_data:
            return f"Location '{location}' not found. Please try a more specific location."
        
        lat = float(geo_data[0]["lat"])
        lon = float(geo_data[0]["lon"])
        city_name = geo_data[0].get("display_name", location)
        
        # Weather API call
        weather_url = "https://api.open-meteo.com/v1/forecast"
        weather_params = {
            "latitude": lat,
            "longitude": lon,
            "current": [
                "temperature_2m",
                "relative_humidity_2m", 
                "apparent_temperature",
                "weather_code",
                "surface_pressure",
                "wind_speed_10m"
            ],
            "timezone": "auto"
        }
        
        if include_forecast:
            weather_params.update({
                "daily": [
                    "temperature_2m_max",
                    "temperature_2m_min", 
                    "precipitation_sum",
                    "weather_code"
                ],
                "forecast_days": 5
            })
        
        weather_resp = requests.get(weather_url, params=weather_params, timeout=10)
        weather_resp.raise_for_status()
        weather_data = weather_resp.json()
        
        # Parse current weather
        current = weather_data["current"]
        temp = current["temperature_2m"]
        feels_like = current["apparent_temperature"]
        humidity = current["relative_humidity_2m"]
        wind_speed = current["wind_speed_10m"]
        pressure = current["surface_pressure"]
        weather_desc = _get_weather_description(current["weather_code"])
        
        # Format response
        result = f"Weather for {city_name}:\n\n"
        result += f"Conditions: {weather_desc}\n"
        result += f"Temperature: {temp}°C (feels like {feels_like}°C)\n"
        result += f"Humidity: {humidity}%\n"
        result += f"Wind Speed: {wind_speed} m/s\n"
        result += f"Pressure: {pressure} hPa"
        
        if include_forecast:
            daily = weather_data["daily"]
            result += "\n\n5-Day Forecast:\n"
            for i, (date, temp_max, temp_min, precip, code) in enumerate(zip(
                daily["time"],
                daily["temperature_2m_max"],
                daily["temperature_2m_min"],
                daily["precipitation_sum"],
                daily["weather_code"]
            )):
                day_desc = _get_weather_description(code)
                result += f"{date}: {temp_min}°C - {temp_max}°C, {day_desc}"
                if precip > 0:
                    result += f", {precip}mm rain"
                result += "\n"
        
        return result.strip()
        
    except requests.RequestException as e:
        return f"Network error retrieving weather data: {str(e)}"
    except (KeyError, IndexError, ValueError) as e:
        return f"Error parsing weather data: {str(e)}"
    except Exception as e:
        return f"Unexpected error getting weather: {str(e)}"

def _get_weather_description(code: int) -> str:
    """Convert WMO weather code to description."""
    weather_codes = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy", 
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        71: "Slight snow",
        73: "Moderate snow",
        75: "Heavy snow",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail"
    }
    return weather_codes.get(code, "Unknown conditions")

# ------------------------------------------------
#  Wikipedia
# ------------------------------------------------
@tool
def wikipedia_lookup(title: str) -> str:
    """Get Wikipedia article summary with proper error handling."""
    try:
        wikipedia.set_lang("en")
        # Try exact match first
        summary = wikipedia.summary(title.strip(), sentences=8, auto_suggest=False)
        return summary
    except wikipedia.exceptions.DisambiguationError as e:
        # Return top 5 options for disambiguation
        options = e.options[:5]
        return f"Multiple articles found for '{title}'. Did you mean: {', '.join(options)}"
    except wikipedia.exceptions.PageError:
        # Try with auto-suggest
        try:
            summary = wikipedia.summary(title.strip(), sentences=8, auto_suggest=True)
            return summary
        except:
            return f"No Wikipedia article found for '{title}'. Please check spelling or try a different search term."
    except Exception as e:
        return f"Error accessing Wikipedia: {str(e)}"

# ------------------------------------------------
#  DuckDuckGo Search
# ------------------------------------------------
@tool
def web_search(query: str, max_results: int = 3) -> str:
    """Search the web using DuckDuckGo with robust error handling."""
    try:
        if not query.strip():
            return "Please provide a search query."
        
        with DDGS() as ddgs:
            results = list(ddgs.text(
                keywords=query.strip(),
                max_results=min(max_results, 10),
                safesearch='moderate'
            ))
        
        if not results:
            return f"No search results found for '{query}'"
        
        formatted_results = []
        for i, result in enumerate(results, 1):
            title = result.get('title', 'No title')
            body = result.get('body', 'No description')
            href = result.get('href', '')
            
            formatted_results.append(f"{i}. {title}\n{body}")
            if href:
                formatted_results.append(f"   Source: {href}")
        
        return "\n\n".join(formatted_results)
        
    except Exception as e:
        return f"Search error: {str(e)}"

@tool
def latest_news(topic: str, max_results: int = 5) -> str:
    """Get latest news headlines for a topic using DuckDuckGo."""
    try:
        if not topic.strip():
            return "Please provide a news topic."
        
        with DDGS() as ddgs:
            news_results = list(ddgs.news(
                keywords=topic.strip(),
                max_results=min(max_results, 10),
                safesearch='moderate'
            ))
        
        if not news_results:
            return f"No recent news found for '{topic}'"
        
        formatted_news = []
        for result in news_results:
            date = result.get('date', 'No date')
            title = result.get('title', 'No title')
            source = result.get('source', 'Unknown source')
            
            formatted_news.append(f"{date} - {title} ({source})")
        
        return "\n".join(formatted_news)
        
    except Exception as e:
        return f"News search error: {str(e)}"

# ------------------------------------------------
#  Resume Processing with Mistral
# ------------------------------------------------
@tool
def process_resume(resume_path: str) -> Dict[str, Any]:
    """
    Parse a PDF resume and extract structured information using Mistral AI.
    Requires MISTRAL_API_KEY environment variable.
    """
    try:
        import PyPDF2
        
        mistral_api_key = os.getenv("MISTRAL_API_KEY")
        if not mistral_api_key:
            return {"error": "MISTRAL_API_KEY environment variable not set"}
        
        if not os.path.isfile(resume_path):
            return {"error": f"File not found: {resume_path}"}
        
        # Extract text from PDF
        text_content = ""
        try:
            with open(resume_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text_content += page.extract_text() + "\n"
        except Exception as e:
            return {"error": f"PDF reading failed: {str(e)}"}
        
        if not text_content.strip():
            return {"error": "No text content extracted from PDF"}
        
        # Call Mistral API
        headers = {
            "Authorization": f"Bearer {mistral_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "mistral-large-latest",
            "messages": [
                {
                    "role": "user",
                    "content": f"""Extract structured information from this resume text and return only valid JSON:

{text_content}

Return JSON with this exact structure:
{{
    "personal_info": {{
        "name": "Full Name",
        "email": "email@example.com", 
        "phone": "phone number",
        "location": "city, state/country",
        "linkedin": "linkedin url",
        "github": "github url"
    }},
    "summary": "Professional summary",
    "experience": [
        {{
            "company": "Company Name",
            "position": "Job Title", 
            "duration": "Start - End Date",
            "description": "Job description"
        }}
    ],
    "education": [
        {{
            "institution": "School Name",
            "degree": "Degree and Major",
            "duration": "Start - End Date",
            "gpa": "GPA if available"
        }}
    ],
    "skills": ["skill1", "skill2"],
    "certifications": ["cert1", "cert2"],
    "projects": [
        {{
            "name": "Project Name",
            "description": "Description",
            "technologies": ["tech1", "tech2"]
        }}
    ]
}}"""
                }
            ],
            "temperature": 0.1
        }
        
        response = requests.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        
        if response.status_code != 200:
            return {"error": f"Mistral API error ({response.status_code}): {response.text}"}
        
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        # Parse JSON response
        try:
            # Clean up markdown formatting if present
            if "```json" in content:
                json_start = content.find("```json") + 7
                json_end = content.find("```", json_start)
                json_str = content[json_start:json_end].strip()
            elif "```" in content:
                json_start = content.find("```") + 3
                json_end = content.find("```", json_start)
                json_str = content[json_start:json_end].strip()
            else:
                json_str = content.strip()
            
            structured_data = json.loads(json_str)
            structured_data["raw_text"] = text_content
            return structured_data
            
        except json.JSONDecodeError:
            return {
                "error": "Could not parse JSON response",
                "raw_text": text_content,
                "ai_response": content
            }
            
    except ImportError:
        return {"error": "PyPDF2 not installed. Run: pip install PyPDF2"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}

# ------------------------------------------------
#  ScrapingAnt Web Scraping
# ------------------------------------------------
@tool
def scrapingant_page(url: str) -> str:
    """Extract clean markdown content from any webpage using ScrapingAnt API."""
    api_key = os.getenv("SCRAPINGANT_API_KEY")
    if not api_key:
        return "Error: SCRAPINGANT_API_KEY environment variable not set"
    
    try:
        # Validate URL
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        response = requests.get(
            "https://api.scrapingant.com/v2/markdown",
            params={
                "url": url,
                "x-api-key": api_key
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            markdown_content = data.get("markdown", "")
            
            if not markdown_content:
                return f"No content extracted from {url}"
            
            # Limit response size
            if len(markdown_content) > 20000:
                markdown_content = markdown_content[:20000] + "\n\n[Content truncated due to length...]"
            
            return markdown_content
        else:
            return f"ScrapingAnt API error ({response.status_code}): {response.text}"
            
    except requests.RequestException as e:
        return f"Network error scraping page: {str(e)}"
    except Exception as e:
        return f"Error scraping page: {str(e)}"

# ------------------------------------------------
#  Spotify Integration
# ------------------------------------------------
def get_spotify():
    return spotipy.Spotify(auth_manager=SpotifyOAuth(
        client_id="7cfca3547c38453f84fd4ae6de486006",
        client_secret="ffb3cad8c7884f21b969d1bbd326ef9a",
        redirect_uri="https://open.spotify.com/artist/6VuMaDnrHyPL1p4EHjYLi7?si=efeb285a235449b1",
        scope="user-read-playback-state user-modify-playback-state",
        open_browser=False,
        cache_path=".spotify_cache"
    ))

@tool
def search_tracks(query: str, limit: int = 5) -> str:
    """Search for tracks on Spotify with detailed results."""
    try:
        if not query.strip():
            return "Please provide a search query"
        
        sp = get_spotify()
        results = sp.search(q=query.strip(), type="track", limit=min(limit, 10))
        tracks = results.get("tracks", {}).get("items", [])
        
        if not tracks:
            return f"No tracks found for '{query}'"
        
        formatted_results = []
        for i, track in enumerate(tracks, 1):
            name = track['name']
            artists = ', '.join(artist['name'] for artist in track['artists'])
            album = track['album']['name']
            popularity = track['popularity']
            spotify_url = track['external_urls']['spotify']
            
            formatted_results.append(
                f"{i}. {name} by {artists}\n"
                f"   Album: {album}\n"
                f"   Popularity: {popularity}/100\n"
                f"   Spotify: {spotify_url}"
            )
        
        return "\n\n".join(formatted_results)
        
    except Exception as e:
        return f"Spotify search error: {str(e)}"

@tool
def play_smart_track(query: str) -> str:
    """Play a track by searching and playing the best match."""
    try:
        if not query.strip():
            return "Please provide a song or artist name"
        
        sp = get_spotify()
        
        # Check for active devices
        devices = sp.devices()["devices"]
        if not devices:
            return "No active Spotify device found. Please open Spotify on a device first."
        
        # Search for track with better matching
        search_query = query.strip()
        print(f"🎵 SPOTIFY: Searching for: '{search_query}'")
        
        # Try multiple search strategies for better results
        results = sp.search(q=search_query, type="track", limit=10)
        tracks = results.get("tracks", {}).get("items", [])
        
        if not tracks:
            # Try alternative search with quotes for exact phrase matching
            alt_query = f'"{search_query}"'
            print(f"🎵 SPOTIFY: Trying alternative search: {alt_query}")
            results = sp.search(q=alt_query, type="track", limit=10)
            tracks = results.get("tracks", {}).get("items", [])
        
        if not tracks:
            return f"No track found for '{query}'. Try being more specific or use different keywords."
        
        # Find the best match by checking track names and artist names
        best_match = None
        query_words = set(search_query.lower().split())
        
        for track in tracks:
            track_name = track['name'].lower()
            artist_names = ' '.join(artist['name'].lower() for artist in track['artists'])
            combined_text = f"{track_name} {artist_names}"
            
            # Calculate match score based on word overlap
            track_words = set(combined_text.split())
            match_score = len(query_words.intersection(track_words)) / len(query_words)
            
            print(f"🎵 SPOTIFY: Candidate - '{track['name']}' by {', '.join(a['name'] for a in track['artists'])} (score: {match_score:.2f})")
            
            if match_score > 0.3:  # At least 30% word match
                best_match = track
                break
        
        # If no good match found, use the first result
        if not best_match:
            best_match = tracks[0]
            print(f"🎵 SPOTIFY: No good match found, using first result")
        
        track = best_match
        
        track = tracks[0]
        track_id = track["id"]
        track_name = track["name"]
        artists = ', '.join(artist['name'] for artist in track['artists'])
        track_uri = track["uri"]
        album_name = track["album"]["name"]
        
        # Store track ID globally for frontend
        global _last_played_track_id
        _last_played_track_id = track_id
        print(f"🎵 SPOTIFY: Set _last_played_track_id to {track_id}")
        
        # Start playback
        try:
            sp.start_playback(device_id=devices[0]["id"], uris=[track_uri])
            print(f"🎵 SPOTIFY: Successfully started playback of track {track_id}")
        except Exception as playback_error:
            print(f"🎵 SPOTIFY: Playback error but continuing: {str(playback_error)}")
            # Even if playback fails, we still want to return the track ID
            # This ensures the frontend can display the embed
        
        # Always include the track ID in a consistent format that's easy to parse
        return f"Now playing: {track_name} by {artists} from the album {album_name}. [TRACK_ID:{track_id}]"
        
    except spotipy.SpotifyException as e:
        print(f"🎵 SPOTIFY ERROR: {str(e)}")
        return f"Spotify API error: {str(e)}"
    except Exception as e:
        print(f"🎵 SPOTIFY ERROR: {str(e)}")
        return f"Error playing track: {str(e)}"

@tool
def pause_music() -> str:
    """Pause current Spotify playback."""
    try:
        sp = get_spotify()
        sp.pause_playback()
        return "Playback paused"
    except Exception as e:
        return f"Error pausing playback: {str(e)}"

@tool
def skip_track() -> str:
    """Skip to next track on Spotify."""
    try:
        sp = get_spotify()
        sp.next_track()
        return "Skipped to next track"
    except Exception as e:
        return f"Error skipping track: {str(e)}"

@tool
def current_track() -> str:
    """Get currently playing track information."""
    try:
        sp = get_spotify()
        current = sp.currently_playing()
        
        if not current or not current.get('item'):
            return "Nothing is currently playing"
        
        track = current['item']
        track_name = track['name']
        artists = ', '.join(artist['name'] for artist in track['artists'])
        track_id = track['id']
        album_name = track['album']['name'] if 'album' in track else 'Unknown Album'
        
        # Store current track ID
        global _last_played_track_id
        _last_played_track_id = track_id
        print(f"🎵 SPOTIFY: Set _last_played_track_id to {track_id}")
        
        # Always include the track ID in a consistent format
        return f"Currently playing: {track_name} by {artists} from the album {album_name}. [TRACK_ID:{track_id}]"
        
    except Exception as e:
        return f"Error getting current track: {str(e)}"

@tool
def get_current_playing_song_details() -> str:
    """Get detailed information about the currently playing song."""
    try:
        sp = get_spotify()
        current = sp.currently_playing()
        
        if not current or not current.get('item'):
            return "No song is currently playing"
        
        track = current['item']
        
        # Extract track information
        song_name = track['name']
        artists = [artist['name'] for artist in track['artists']]
        album_name = track['album']['name']
        release_date = track['album']['release_date']
        
        # Duration and progress
        duration_ms = track['duration_ms']
        progress_ms = current.get('progress_ms', 0)
        duration_min = duration_ms // 60000
        duration_sec = (duration_ms % 60000) // 1000
        progress_min = progress_ms // 60000
        progress_sec = (progress_ms % 60000) // 1000
        
        # Additional details
        popularity = track.get('popularity', 'N/A')
        explicit = track.get('explicit', False)
        track_number = track['track_number']
        total_tracks = track['album']['total_tracks']
        
        # Playback state
        is_playing = current.get('is_playing', False)
        device = current.get('device', {})
        device_name = device.get('name', 'Unknown Device')
        device_type = device.get('type', 'Unknown')
        
        spotify_url = track['external_urls'].get('spotify', '')
        
        details = f"""Currently Playing Details:

Song: {song_name}
Artist(s): {', '.join(artists)}
Album: {album_name}
Release Date: {release_date}
Duration: {duration_min}:{duration_sec:02d}
Progress: {progress_min}:{progress_sec:02d}
Popularity: {popularity}/100
Explicit: {'Yes' if explicit else 'No'}
Track: {track_number}/{total_tracks}

Status: {'Playing' if is_playing else 'Paused'}
Device: {device_name} ({device_type})
Spotify URL: {spotify_url}"""

        return details
        
    except Exception as e:
        return f"Error getting song details: {str(e)}"

@tool
def add_to_playlist(track_query: str, playlist_name: str) -> str:
    """Add a track to a playlist (creates playlist if it doesn't exist)."""
    try:
        sp = get_spotify()
        user_id = sp.me()["id"]
        
        # Search for track
        track_results = sp.search(q=track_query.strip(), type="track", limit=1)
        tracks = track_results.get("tracks", {}).get("items", [])
        
        if not tracks:
            return f"Track not found: {track_query}"
        
        track = tracks[0]
        track_uri = track["uri"]
        track_name = track["name"]
        
        # Find or create playlist
        playlists = sp.current_user_playlists()["items"]
        playlist = next((p for p in playlists if p["name"].lower() == playlist_name.lower()), None)
        
        if not playlist:
            playlist = sp.user_playlist_create(user_id, playlist_name, public=False)
        
        # Add track to playlist
        sp.playlist_add_items(playlist["id"], [track_uri])
        
        return f"Added '{track_name}' to playlist '{playlist_name}'"
        
    except Exception as e:
        return f"Error adding to playlist: {str(e)}"

@tool
def set_volume(percent: int) -> str:
    """Set Spotify playback volume (0-100)."""
    try:
        if not 0 <= percent <= 100:
            return "Volume must be between 0 and 100"
        
        sp = get_spotify()
        devices = sp.devices()["devices"]
        
        if not devices:
            return "No active device found"
        
        sp.volume(percent, device_id=devices[0]["id"])
        return f"Volume set to {percent}%"
        
    except Exception as e:
        return f"Error setting volume: {str(e)}"

# ------------------------------------------------
#  Lyrics Retrieval
# ------------------------------------------------
@tool
def get_lyrics() -> str:
    """Get lyrics for the currently playing Spotify track."""
    try:
        sp = get_spotify()
        current_playback = sp.current_playback()
        
        if not current_playback or not current_playback.get("item"):
            return "No song is currently playing"
        
        track = current_playback["item"]
        title = track["name"]
        artists = ", ".join(artist["name"] for artist in track["artists"])
        track_id = track["id"]
        
        # Try Musixmatch API first
        try:
            api_url = "https://spotify-lyric-api.herokuapp.com/lyrics"
            response = requests.get(
                api_url, 
                params={"trackid": track_id}, 
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if not data.get("error") and data.get("lines"):
                    lyrics = "\n".join(line["words"] for line in data["lines"])
                    return f"Lyrics for {title} by {artists}:\n\n{lyrics}"
        except:
            pass
        
        # Fallback to DuckDuckGo search
        try:
            query = f"{title} {artists} lyrics"
            with DDGS() as ddgs:
                results = list(ddgs.text(keywords=query, max_results=3))
            
            if results:
                snippet = results[0]["body"]
                source = results[0]["href"]
                return f"Lyrics for {title} by {artists}:\n\n{snippet}\n\nSource: {source}"
        except:
            pass
        
        # Final fallback
        return f"Lyrics not found for {title} by {artists}. Try searching manually on Genius or Google."
        
    except Exception as e:
        return f"Error getting lyrics: {str(e)}"

# ------------------------------------------------
#  Sequential Thinking System
# ------------------------------------------------

# Configuration
MAX_DEPTH = 100
MAX_TOKENS = 50000
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
PERSIST_DIR = pathlib.Path(__file__).parent / "sequential_memory"
PERSIST_DIR.mkdir(exist_ok=True)

# Initialize embedding model
_embed = None
if _SENTENCE_TRANSFORMERS_AVAILABLE:
    try:
        _embed = SentenceTransformer(EMBED_MODEL_NAME)
    except Exception:
        _embed = None

def _tokens(text: str) -> int:
    """Simple token counter based on whitespace."""
    return len(text.split())

def _semantic_hash(text: str) -> str:
    """Generate semantic hash for similarity checking."""
    if _embed is None:
        return str(hash(text))[:16]
    
    try:
        vec = _embed.encode(text, normalize_embeddings=True)
        return str(np.packbits((vec > 0).astype(int)).tobytes().hex()[:16])
    except:
        return str(hash(text))[:16]

def _similarity(a: str, b: str) -> float:
    """Calculate semantic similarity between texts."""
    if _embed is None:
        # Fallback to word overlap
        words_a = set(a.lower().split())
        words_b = set(b.lower().split())
        if not words_a or not words_b:
            return 0.0
        return len(words_a & words_b) / len(words_a | words_b)
    
    try:
        v1 = _embed.encode(a, normalize_embeddings=True)
        v2 = _embed.encode(b, normalize_embeddings=True)
        return float(util.cos_sim(v1, v2))
    except:
        return 0.0

def _load_thoughts(session_id: str) -> List[Dict[str, Any]]:
    """Load thoughts from MongoDB storage with file fallback."""
    try:
        from sequential_thinking_mongodb import get_sequential_thinking_manager
        manager = get_sequential_thinking_manager()
        thoughts = manager.load_thoughts(session_id)
        if thoughts:
            return thoughts
        # If MongoDB returns empty, try file fallback
        return _load_thoughts_from_file(session_id)
    except:
        return _load_thoughts_from_file(session_id)

def _save_thoughts(session_id: str, thoughts: List[Dict[str, Any]]):
    """Save thoughts to MongoDB storage with file fallback."""
    try:
        from sequential_thinking_mongodb import get_sequential_thinking_manager
        manager = get_sequential_thinking_manager()
        manager.save_thoughts(session_id, thoughts)
        # Also save to file as backup
        _save_thoughts_to_file(session_id, thoughts)
    except:
        _save_thoughts_to_file(session_id, thoughts)

def _load_thoughts_from_file(session_id: str) -> List[Dict[str, Any]]:
    """Load thoughts from file storage."""
    try:
        file_path = PERSIST_DIR / f"{session_id}.jsonl"
        if not file_path.exists():
            return []
        
        thoughts = []
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    thoughts.append(json.loads(line))
        
        return sorted(thoughts, key=lambda x: x.get("step", 0))
    except Exception as e:
        print(f"❌ Error loading thoughts from file for session {session_id}: {e}")
        return []

def _save_thoughts_to_file(session_id: str, thoughts: List[Dict[str, Any]]):
    """Save thoughts to file storage."""
    try:
        file_path = PERSIST_DIR / f"{session_id}.jsonl"
        with open(file_path, 'w', encoding='utf-8') as f:
            for thought in thoughts:
                f.write(json.dumps(thought) + '\n')
        print(f"✅ Saved {len(thoughts)} thoughts to file for session {session_id}")
    except Exception as e:
        print(f"❌ Error saving thoughts to file for session {session_id}: {e}")

def _add_thought(
    session_id: str,
    text: str,
    branch_from: Optional[int] = None,
    operation: str = "append",
) -> Dict[str, Any]:
    """Add a thought to the reasoning chain."""
    thoughts = _load_thoughts(session_id)
    
    # Check token budget
    current_tokens = sum(_tokens(t["text"]) for t in thoughts)
    if current_tokens + _tokens(text) > MAX_TOKENS:
        raise ValueError("Token budget exceeded")
    
    if len(thoughts) >= MAX_DEPTH:
        raise ValueError("Maximum depth reached")
    
    # Check for duplicates
    duplicate_threshold = 0.92
    contradiction_keywords = ["however", "but", "actually", "wait", "no"]
    is_contradiction = any(keyword in text.lower() for keyword in contradiction_keywords)
    
    if thoughts and _embed is not None and not is_contradiction:
        last_text = thoughts[-1]["text"]
        similarity = _similarity(last_text, text)
        if similarity > duplicate_threshold:
            # Merge with last thought
            thoughts[-1]["text"] += f"\n[merged] {text}"
            thoughts[-1]["timestamp"] = int(time.time())
            _save_thoughts(session_id, thoughts)
            return thoughts[-1]
    
    # Create new thought
    new_thought = {
        "step": len(thoughts),
        "text": text,
        "timestamp": int(time.time()),
        "uuid": str(uuid.uuid4()),
        "semantic_id": _semantic_hash(text),
        "confidence": 0.95
    }
    
    if operation == "append" or branch_from is None:
        thoughts.append(new_thought)
    elif operation == "revise":
        if 0 <= branch_from < len(thoughts):
            thoughts[branch_from].update({
                "text": text,
                "timestamp": int(time.time())
            })
        else:
            raise IndexError("Invalid branch_from index")
    elif operation == "branch":
        if 0 <= branch_from < len(thoughts):
            new_thought["parent"] = branch_from
            thoughts.append(new_thought)
        else:
            raise IndexError("Invalid branch_from index")
    else:
        raise ValueError("Unknown operation")
    
    _save_thoughts(session_id, thoughts)
    return new_thought

def _format_thoughts(session_id: str) -> str:
    """Format thoughts for display."""
    thoughts = _load_thoughts(session_id)
    if not thoughts:
        return "No thoughts recorded yet."
    
    lines = []
    for thought in thoughts:
        prefix = f"{thought['step']:02d}"
        if thought.get("parent") is not None:
            prefix += f"→{thought['parent']}"
        indent = "  " * prefix.count("→")
        lines.append(f"{indent}{prefix}: {thought['text']}")
    
    return "\n".join(lines)

@tool
def sequential_think(
    thought: str,
    session_id: str = "default",
    branch_from: str = "None",
    operation: str = "append",
) -> str:
    """
    Add, revise, or branch a thought in the sequential-thinking system.
    
    Parameters:
    - thought: The thought to record
    - session_id: Unique identifier for this reasoning session
    - branch_from: Index to branch from ("None" for append)
    - operation: "append", "revise", or "branch"
    """
    try:
        if not thought.strip():
            return "Please provide a non-empty thought."
        
        # Parse branch_from
        branch_from_int = None
        if branch_from != "None" and branch_from is not None:
            try:
                branch_from_int = int(branch_from)
            except (ValueError, TypeError):
                return "Invalid branch_from value. Use integer or 'None'."
        
        _add_thought(session_id, thought.strip(), branch_from_int, operation)
        return _format_thoughts(session_id)
        
    except Exception as e:
        return f"Error in sequential thinking: {str(e)}"

@tool
def sequential_review(session_id: str = "default", clear: bool = False) -> str:
    """
    Review or clear the reasoning chain for a session.
    
    Parameters:
    - session_id: Session to review/clear
    - clear: If True, clear the session data
    """
    try:
        if clear:
            file_path = PERSIST_DIR / f"{session_id}.jsonl"
            file_path.unlink(missing_ok=True)
            return f"Session '{session_id}' cleared."
        
        return _format_thoughts(session_id)
        
    except Exception as e:
        return f"Error reviewing session: {str(e)}"

# ------------------------------------------------
#  Image Generation with OpenAI DALL-E 3
# ------------------------------------------------
@tool
def generate_image(prompt: str) -> str:
    """
    Generate an image using OpenAI DALL-E 3.
    Requires OPENAI_API environment variable.
    """
    openai_key = os.getenv("OPENAI_API")
    if not openai_key:
        return """Image Generation Requested

Your Prompt: "{}"

Service Currently Unavailable
Image generation requires an OpenAI API key with available credits.

Alternative Options:
• Visit DALL-E 2 directly: https://openai.com/dall-e-2/
• Try Midjourney: https://midjourney.com/
• Use Stable Diffusion: https://stablediffusionweb.com/
• Check out Bing Image Creator: https://www.bing.com/images/create

To Enable This Feature:
Add your OpenAI API key to the .env file as OPENAI_API=your_key_here""".format(prompt)
    
    try:
        if not prompt.strip():
            return "Please provide an image description."
        
        headers = {
            "Authorization": f"Bearer {openai_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "dall-e-3",
            "prompt": prompt.strip(),
            "n": 1,
            "size": "1024x1024",
            "quality": "standard",
            "response_format": "url"
        }
        
        response = requests.post(
            "https://api.openai.com/v1/images/generations",
            headers=headers,
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            image_url = data['data'][0]['url']
            
            return f"""Image Generated Successfully

Prompt: {prompt}

![Generated Image]({image_url})

Direct Link: {image_url}

Note: This image URL is temporary and will expire after some time."""
        
        else:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
            
            if "billing_hard_limit_reached" in str(error_data):
                return f"""Image Generation Requested

Your Prompt: {prompt}

OpenAI Billing Limit Reached
The current OpenAI API key has reached its billing limit.

Alternative Options:
• Visit DALL-E 2 directly: https://openai.com/dall-e-2/
• Try Midjourney: https://midjourney.com/
• Use Stable Diffusion: https://stablediffusionweb.com/
• Check out Bing Image Creator: https://www.bing.com/images/create

To Fix This:
Add credits to your OpenAI account or use a different API key."""
            
            return f"Image generation failed: {error_data}"
            
    except requests.RequestException as e:
        return f"Network error during image generation: {str(e)}"
    except Exception as e:
        return f"Image generation failed: {str(e)}"