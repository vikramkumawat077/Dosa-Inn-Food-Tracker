
import logging
import os
from dotenv import load_dotenv
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import openai, silero

load_dotenv()

async def entrypoint(ctx: JobContext):
    # System prompt - moved to instructions for Agent
    instructions = (
        "You are Rocky, a friendly voice assistant for 'Rocky Da Adda', a pure veg campus restaurant at IIT Kharagpur. "
        "Your interface is voice-only, so keep responses concise and conversational. "
        "Menu items include: Masala Chai, Aloo Paratha, Paneer Butter Masala, Veg Biryani. "
        "If asked about orders, say 'I can help check your order status'."
    )

    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Groq via OpenAI plugin for LLM
    groq_llm = openai.LLM(
        base_url="https://api.groq.com/openai/v1",
        api_key=os.environ.get("GROQ_API_KEY"),
        model="llama3-8b-8192",
    )
    
    # Groq via OpenAI plugin for STT (Whisper)
    groq_stt = openai.STT(
        base_url="https://api.groq.com/openai/v1",
        api_key=os.environ.get("GROQ_API_KEY"),
        model="whisper-large-v3",
    )

    # Initialize Silero VAD and TTS
    silero_vad = silero.VAD.load()
    silero_tts = silero.TTS.load()

    # Create the Agent logic
    agent = Agent(
        instructions=instructions,
        vad=silero_vad,
        stt=groq_stt,
        llm=groq_llm,
        tts=silero_tts,
    )

    # Create and start the Session
    session = AgentSession()
    await session.start(agent, room=ctx.room)
    
    # Optional: Initial greeting
    # Note: agent.say() is not available on Agent class directly in 1.4.2?
    # We might need to use session to say something, or chat_ctx?
    # agent.say() method existed in VoiceAssistant. 
    # In 1.4.2 AgentSession orchestrates.
    # We can probably emit an event or just rely on user interaction.
    # Or maybe session.conversation.say()?
    # Let's check AgentSession methods later if needed, for now just start it.

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
