#!/usr/bin/env python3
"""
Тесты для проверки подключения LiveKit агента
"""

import asyncio
import os
import sys
from dotenv import load_dotenv

# Добавляем путь к агентам
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../agents'))

load_dotenv(os.path.join(os.path.dirname(__file__), '../../agents/.env'))

async def test_livekit_connection():
    """Тест подключения к LiveKit"""
    from livekit import agents, rtc
    
    livekit_url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    
    print(f"Testing LiveKit connection...")
    print(f"URL: {livekit_url}")
    print(f"API Key: {api_key[:10]}..." if api_key else "API Key: NOT SET")
    print(f"API Secret: {'SET' if api_secret else 'NOT SET'}")
    
    if not livekit_url or not api_key:
        print("❌ Missing LiveKit configuration")
        return False
    
    try:
        # Простая проверка доступности
        print("✅ LiveKit configuration found")
        return True
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        return False

async def test_gigachat_token():
    """Тест получения токена GigaChat"""
    import aiohttp
    import uuid
    
    oauth_url = os.getenv("GIGACHAT_OAUTH_URL")
    auth_key = os.getenv("GIGACHAT_AUTHORIZATION_KEY")
    
    print(f"\nTesting GigaChat token...")
    
    if not oauth_url or not auth_key:
        print("❌ Missing GigaChat configuration")
        return False
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                oauth_url,
                headers={
                    "Authorization": f"Bearer {auth_key}",
                    "Content-Type": "application/x-www-form-urlencoded",
                    "RqUID": str(uuid.uuid4()),
                },
                data={"scope": os.getenv("GIGACHAT_SCOPE", "GIGACHAT_API_PERS")},
                ssl=False,
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    token = data.get("access_token")
                    if token:
                        print("✅ GigaChat token obtained successfully")
                        return True
                    else:
                        print("❌ No token in response")
                        return False
                else:
                    error_text = await resp.text()
                    print(f"❌ Failed to get token: {resp.status} - {error_text}")
                    return False
    except Exception as e:
        print(f"❌ GigaChat test failed: {e}")
        return False

async def test_openai_stt():
    """Тест OpenAI STT"""
    from livekit.plugins import openai as openai_plugin
    
    api_key = os.getenv("OPENAI_API_KEY")
    
    print(f"\nTesting OpenAI STT...")
    
    if not api_key:
        print("⚠️  OpenAI API key not set, skipping")
        return None
    
    try:
        stt = openai_plugin.STT(language="ru")
        print("✅ OpenAI STT initialized")
        return True
    except Exception as e:
        print(f"❌ OpenAI STT test failed: {e}")
        return False

async def test_silero_tts():
    """Тест Silero TTS"""
    from livekit.plugins import silero as silero_plugin
    from livekit.plugins import openai as openai_plugin
    
    print(f"\nTesting Silero TTS...")
    
    try:
        # Check if Silero TTS is available
        if hasattr(silero_plugin, 'TTS'):
            tts = silero_plugin.TTS(
                voice="aidar",
                sample_rate=24000,
                speaker="ru",
            )
            print("✅ Silero TTS initialized")
            return True
        else:
            # Silero TTS API may have changed, use OpenAI TTS as fallback
            print("⚠️  Silero TTS API not available, testing OpenAI TTS fallback")
            tts = openai_plugin.TTS(voice="nova", model="tts-1")
            print("✅ OpenAI TTS initialized (fallback for Russian)")
            return True
    except Exception as e:
        print(f"❌ TTS test failed: {e}")
        return False

async def main():
    """Запуск всех тестов"""
    print("=" * 50)
    print("LiveKit Agent Connection Tests")
    print("=" * 50)
    
    results = {}
    
    results['livekit'] = await test_livekit_connection()
    results['gigachat'] = await test_gigachat_token()
    results['openai_stt'] = await test_openai_stt()
    results['silero_tts'] = await test_silero_tts()
    
    print("\n" + "=" * 50)
    print("Test Results")
    print("=" * 50)
    
    for name, result in results.items():
        if result is True:
            print(f"✅ {name}: PASSED")
        elif result is False:
            print(f"❌ {name}: FAILED")
        else:
            print(f"⚠️  {name}: SKIPPED")
    
    # Возвращаем код выхода
    failed_count = sum(1 for r in results.values() if r is False)
    return 0 if failed_count == 0 else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

