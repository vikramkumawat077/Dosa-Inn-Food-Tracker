
import asyncio
import os
from dotenv import load_dotenv
from livekit import api

load_dotenv()

URL = os.getenv('LIVEKIT_URL')
KEY = os.getenv('LIVEKIT_API_KEY')
SECRET = os.getenv('LIVEKIT_API_SECRET')

print(f"Testing connection to: {URL}")
print(f"Key: {KEY}")
print(f"Secret length: {len(SECRET) if SECRET else 0}")

async def main():
    try:
        lkapi = api.LiveKitAPI(URL, KEY, SECRET)
        rooms = await lkapi.room.list_rooms()
        print("Successfully connected! Rooms:", rooms)
        await lkapi.aclose()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
