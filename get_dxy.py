import os
import requests
from dotenv import load_dotenv

def get_dxy_index():
    """
    Fetches and returns the current DXY (U.S. Dollar Index) value from Polygon.io API.
    
    Returns:
        float: The current DXY index value
    """
    # Load environment variables from .env file
    load_dotenv()
    
    # Get API key from environment variables
    api_key = os.getenv('POLYGON_API_KEY')
    if not api_key:
        raise ValueError("POLYGON_API_KEY environment variable not found")
    
    # API endpoint and parameters
    url = "https://api.polygon.io/v3/snapshot/indices"
    params = {
        'ticker': 'DXY',
        'apiKey': api_key
    }
    
    try:
        # Make the API request
        response = requests.get(url, params=params)
        response.raise_for_status()  # Raise an exception for HTTP errors
        
        # Parse the JSON response
        data = response.json()
        
        # Extract the DXY value
        if 'results' in data and len(data['results']) > 0:
            dxy_value = data['results'][0].get('value')
            if dxy_value is not None:
                return dxy_value
            
        raise ValueError("DXY value not found in the API response")
        
    except requests.exceptions.RequestException as e:
        print(f"Error making API request: {e}")
        raise
    except (KeyError, IndexError) as e:
        print(f"Error parsing API response: {e}")
        raise

def main():
    try:
        dxy_value = get_dxy_index()
        print(f"DXY Index Level: {dxy_value:.2f}")
    except Exception as e:
        print(f"Failed to retrieve DXY index: {e}")
        return 1
    return 0

if __name__ == "__main__":
    main()
