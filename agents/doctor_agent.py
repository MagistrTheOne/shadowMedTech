#!/usr/bin/env python3
"""
LiveKit Voice AI Agent for Medical Training
Handles voice conversations with medical representatives using STT, LLM (GigaChat), and TTS.
"""

import asyncio
import os
import json
import aiohttp
from typing import Annotated, Optional
from dotenv import load_dotenv

from livekit import agents, rtc
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
    llm,
    voice_assistant,
    AgentSession,
    Agent,
    RoomInputOptions,
    stt,
    tts,
)
from livekit.plugins import openai, silero

# Load environment variables
load_dotenv()

# Configuration
LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
GIGACHAT_API_URL = os.getenv("GIGACHAT_API_URL", "https://gigachat.devices.sberbank.ru/api/v1")
GIGACHAT_OAUTH_URL = os.getenv("GIGACHAT_OAUTH_URL", "https://ngw.devices.sberbank.ru:9443/api/v2/oauth")
GIGACHAT_AUTHORIZATION_KEY = os.getenv("GIGACHAT_AUTHORIZATION_KEY")
NEXTJS_API_URL = os.getenv("NEXTJS_API_URL", "http://localhost:3000")
USE_SILERO_TTS = os.getenv("USE_SILERO_TTS", "true").lower() == "true"
USE_OPENAI_STT = os.getenv("USE_OPENAI_STT", "true").lower() == "true"

# GigaChat Access Token cache
_gigachat_token: Optional[str] = None
_token_expiry: float = 0


async def get_gigachat_token() -> str:
    """Get or refresh GigaChat access token."""
    global _gigachat_token, _token_expiry
    import time
    import uuid

    # Check if token is still valid (with 5 minute buffer)
    if _gigachat_token and time.time() < _token_expiry - 300:
        return _gigachat_token

    async with aiohttp.ClientSession() as session:
        async with session.post(
            GIGACHAT_OAUTH_URL,
            headers={
                "Authorization": f"Bearer {GIGACHAT_AUTHORIZATION_KEY}",
                "Content-Type": "application/x-www-form-urlencoded",
                "RqUID": str(uuid.uuid4()),
            },
            data={"scope": os.getenv("GIGACHAT_SCOPE", "GIGACHAT_API_PERS")},
            ssl=False,
        ) as resp:
            if resp.status != 200:
                error_text = await resp.text()
                raise Exception(f"Failed to get GigaChat token: {resp.status} - {error_text}")
            
            data = await resp.json()
            _gigachat_token = data.get("access_token")
            expires_in = data.get("expires_at", 1800)
            _token_expiry = time.time() + expires_in
            
            return _gigachat_token


async def call_gigachat_api(messages: list, system_prompt: str, visit_id: str) -> str:
    """Call GigaChat API to generate doctor's response."""
    token = await get_gigachat_token()
    
    # Prepare messages for GigaChat (combine system prompt with messages)
    giga_messages = messages.copy()
    # Insert system message at the beginning if not already there
    if not any(msg.get("role") == "system" for msg in giga_messages):
        giga_messages.insert(0, {"role": "system", "content": system_prompt})

    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{GIGACHAT_API_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={
                "model": "GigaChat",
                "messages": giga_messages,
                "temperature": 0.7,
                "max_tokens": 1024,
            },
            ssl=False,
        ) as resp:
            if resp.status != 200:
                error_text = await resp.text()
                raise Exception(f"GigaChat API error {resp.status}: {error_text}")
            
            data = await resp.json()
            if "choices" not in data or len(data["choices"]) == 0:
                raise Exception(f"Invalid GigaChat response: {data}")
            
            return data["choices"][0]["message"]["content"]


async def save_message_to_db(visit_id: str, role: str, content: str):
    """Save conversation message to database via Next.js API."""
    try:
        service_token = os.getenv("AGENT_SERVICE_TOKEN")
        headers = {"Content-Type": "application/json"}
        if service_token:
            headers["x-service-token"] = service_token
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{NEXTJS_API_URL}/api/visits/{visit_id}/messages",
                headers=headers,
                json={
                    "role": role,
                    "content": content,
                    "metadata": {"source": "livekit-agent"},
                },
            ) as resp:
                if resp.status not in (200, 201):
                    error_text = await resp.text()
                    print(f"Warning: Failed to save message to DB: {resp.status} - {error_text}")
    except Exception as e:
        print(f"Error saving message to DB: {e}")


async def get_visit_data(visit_id: str) -> dict:
    """Get visit and doctor data from Next.js API."""
    # Use service token if available
    service_token = os.getenv("AGENT_SERVICE_TOKEN")
    headers = {}
    if service_token:
        headers["x-service-token"] = service_token
    
    async with aiohttp.ClientSession() as session:
        # Try agent endpoint first, fallback to regular endpoint
        async with session.get(
            f"{NEXTJS_API_URL}/api/visits/{visit_id}/agent",
            headers=headers,
        ) as resp:
            if resp.status == 404:
                # Fallback to regular endpoint
                async with session.get(f"{NEXTJS_API_URL}/api/visits/{visit_id}") as fallback_resp:
                    if fallback_resp.status != 200:
                        error_text = await fallback_resp.text()
                        raise Exception(f"Failed to get visit data: {fallback_resp.status} - {error_text}")
                    return await fallback_resp.json()
            
            if resp.status != 200:
                error_text = await resp.text()
                raise Exception(f"Failed to get visit data: {resp.status} - {error_text}")
            
            return await resp.json()


class GigaChatLLM(llm.LLM):
    """Custom LLM implementation using GigaChat API."""
    
    def __init__(self, visit_id: str, doctor_prompt: str, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.visit_id = visit_id
        self.doctor_prompt = doctor_prompt
        self.conversation_history: list = []
    
    async def chat(
        self,
        chat_ctx: llm.ChatContext,
        fnc_ctx: Optional[llm.FunctionContext] = None,
        fnc_ctx_fill_mode: Optional[llm.FunctionContext.FillMode] = None,
    ) -> Annotated[llm.ChatContext, "messages"]:
        """Generate response using GigaChat."""
        
        # Convert chat context to GigaChat format
        messages = []
        for msg in chat_ctx.messages:
            if isinstance(msg, llm.ChatMessage):
                role = "assistant" if msg.role == llm.ChatRole.ASSISTANT else "user"
                content = msg.content or ""
                messages.append({"role": role, "content": content})
                
                # Save user messages to DB when they appear in chat context
                if msg.role == llm.ChatRole.USER and content:
                    await save_message_to_db(self.visit_id, "user", content)
                    print(f"User message saved: {content[:50]}...")
        
        # Call GigaChat API
        response_text = await call_gigachat_api(
            messages=messages,
            system_prompt=self.doctor_prompt,
            visit_id=self.visit_id,
        )
        
        # Save assistant message to DB
        await save_message_to_db(self.visit_id, "assistant", response_text)
        
        # Add to conversation history
        self.conversation_history.append({"role": "assistant", "content": response_text})
        
        # Return as ChatContext
        chat_ctx.messages.append(
            llm.ChatMessage(
                role=llm.ChatRole.ASSISTANT,
                content=response_text,
            )
        )
        
        return chat_ctx


async def entrypoint(ctx: JobContext):
    """Main entry point for the agent."""
    print(f"Doctor Agent starting for job: {ctx.job.id}, room: {ctx.job.room_name}")
    
    # Extract metadata from job or environment
    # For direct dispatch, metadata comes from job.metadata
    # For environment-based dispatch, use environment variables
    metadata_str = ctx.job.metadata or "{}"
    try:
        if isinstance(metadata_str, str):
            metadata = json.loads(metadata_str)
        else:
            metadata = metadata_str
    except:
        metadata = {}
    
    visit_id = metadata.get("visit_id") or os.getenv("VISIT_ID")
    doctor_name = metadata.get("doctor_name") or os.getenv("DOCTOR_NAME", "Доктор")
    room_name = ctx.job.room_name or os.getenv("ROOM_NAME")
    
    if not visit_id:
        raise ValueError("visit_id is required in job metadata or VISIT_ID environment variable")
    
    # Get visit and doctor data
    try:
        visit_data = await get_visit_data(visit_id)
        doctor_data = visit_data.get("doctor", {})
        doctor_prompt = doctor_data.get("prompt_template", "")
        personality = doctor_data.get("personality_type", "rational")
        empathy_level = doctor_data.get("empathy_level", 5)
    except Exception as e:
        print(f"Warning: Failed to load visit data: {e}")
        doctor_prompt = "Ты опытный врач. Веди профессиональную беседу с медицинским представителем на русском языке."
    
    # Build system prompt
    system_prompt = f"""{doctor_prompt}

Ты - {doctor_name}, опытный врач. Веди профессиональную беседу с медицинским представителем.
Отвечай на русском языке, будь вежливым но требовательным к деталям.
Фокусируйся на медицинских аспектах препаратов и лечения.

Тип личности: {personality}
Уровень эмпатии: {empathy_level}/10

Будь естественным в разговоре, задавай вопросы о препаратах, их применении и эффективности."""
    
    # Connect to room (room_name is already set in job context)
    # AutoSubscribe.AUDIO_ONLY означает, что агент автоматически подписывается на все аудио треки
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    print(f"Connected to room: {ctx.room.name}")
    print(f"Waiting for participants to join and publish audio tracks...")
    
    # Setup STT according to LiveKit Agents documentation
    # https://docs.livekit.io/agents/models/
    if USE_OPENAI_STT:
        stt_instance = openai.STT(language="ru")
    else:
        # Use default STT or another provider
        stt_instance = openai.STT(language="ru")
    
    # Setup TTS for Russian language
    # Note: Silero plugin may not expose TTS directly in v1.2.17+
    # Using OpenAI TTS for now, which supports Russian well
    if USE_SILERO_TTS:
        # Try to use Silero if available, fallback to OpenAI
        try:
            # Check if Silero has TTS class (API may have changed)
            if hasattr(silero, 'TTS'):
                tts_instance = silero.TTS(
                    voice="aidar",
                    sample_rate=24000,
                    speaker="ru",
                )
            else:
                # Fallback to OpenAI TTS (supports Russian)
                print("Silero TTS not available, using OpenAI TTS")
                tts_instance = openai.TTS(voice="nova", model="tts-1")
        except Exception as e:
            print(f"Failed to initialize Silero TTS: {e}, using OpenAI TTS")
            tts_instance = openai.TTS(voice="nova", model="tts-1")
    else:
        # OpenAI TTS (supports Russian)
        tts_instance = openai.TTS(voice="nova", model="tts-1")
    
    # Setup VAD (Voice Activity Detection)
    vad = openai.VAD.load()
    
    # Create custom LLM with GigaChat
    # Using custom LLM implementation since GigaChat is not in standard plugins
    custom_llm = GigaChatLLM(
        visit_id=visit_id,
        doctor_prompt=system_prompt,
    )
    
    # Use AgentSession according to new LiveKit Agents documentation
    # https://docs.livekit.io/agents/build/
    # AgentSession is the recommended way in v1.2.13+
    session = AgentSession(
        stt=stt_instance,
        llm=custom_llm,
        tts=tts_instance,
        vad=vad,
    )
    
    # Create agent with instructions
    agent = Agent(
        instructions=system_prompt,
    )
    
    # Start the session
    # AgentSession automatically handles:
    # - STT transcription of user speech
    # - LLM processing (calls GigaChatLLM.chat() which saves messages)
    # - TTS synthesis
    # - Audio streaming to room participants
    await session.start(
        room=ctx.room,
        agent=agent,
        room_input_options=RoomInputOptions(),
    )
    
    # Messages are automatically saved in GigaChatLLM.chat() method:
    # - User messages: saved when they appear in chat context
    # - Assistant messages: saved after GigaChat generates response
    print("Agent session started")
    
    # Keep agent alive while room is active
    print("Waiting for conversation...")
    
    try:
        await ctx.wait_for_disconnect()
        print("Agent disconnected from room")
    except Exception as e:
        print(f"Error in agent loop: {e}")
    finally:
        await session.aclose()
        print("Agent cleaned up")


if __name__ == "__main__":
    # Run as worker (for production) or dev mode (for testing)
    # Usage:
    #   python doctor_agent.py dev --room <room_name>  # Connect directly to room
    #   python doctor_agent.py start                    # Run as worker
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))

