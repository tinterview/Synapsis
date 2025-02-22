import os
import asyncio
import websockets
import json
import sounddevice as sd
import numpy as np
import webrtcvad
from pydub import AudioSegment
from pydub.playback import play
from io import BytesIO

# Environment variables (Set these before running)
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
API_VERSION = "2024-12-17"  # Ensure this matches your API version

# WebSocket URL
ws_uri = f"wss://{AZURE_OPENAI_ENDPOINT}/openai/realtime?api-version={API_VERSION}&deployment={AZURE_OPENAI_DEPLOYMENT}"
ws_uri = "wss://sanch-m751m6ic-eastus2.openai.azure.com/openai/realtime?api-version=2024-12-17&deployment=gpt-4o-mini-realtime-preview"

print(ws_uri)

# Authentication headers
headers = {"Authorization": f"Bearer {AZURE_OPENAI_KEY}"}

# FizzBuzz problem as context
leetcode_problem_context = """
Given an integer n, return a string array where:
- "Fizz" if the number is divisible by 3.
- "Buzz" if the number is divisible by 5.
- "FizzBuzz" if the number is divisible by both 3 and 5.
- The number itself (as a string) otherwise.
"""

# System prompt to enforce interviewer behavior
system_prompt = """
You are an AI interviewer conducting a technical interview for a coding problem. Your role is to **guide the candidate** by clarifying doubts, asking insightful follow-up questions, and providing hints—without directly giving the answer.

## **Guidelines**
- **DO NOT** directly provide the correct code or solution.
- **DO NOT** explicitly state the optimal algorithm or approach.
- **DO** ask leading questions to help the candidate think critically.
- **DO** provide small hints or explain relevant concepts if the candidate is stuck.
- **DO** adapt your responses based on the candidate’s progress and explanations.
- **DO** probe deeper if the candidate gives an incomplete or incorrect explanation.

## **Interaction Style**
- Keep responses **concise** but **engaging**.
- Use **Socratic questioning** (e.g., *“What happens if the input is very large?”*).
- Encourage the candidate to **explain their reasoning aloud**.
- Maintain a professional yet conversational tone.

Always **guide, not give**. Your goal is to **assess and improve problem-solving skills, not just correctness**.
"""

# Audio parameters
SAMPLE_RATE = 16000
VAD_MODE = 3  # Sensitivity: 0 (least), 3 (most)
FRAME_DURATION = 30  # 30ms per frame
BUFFER_SIZE = int(SAMPLE_RATE * FRAME_DURATION / 1000)  # 30ms buffer

# Initialize VAD
vad = webrtcvad.Vad(VAD_MODE)


def record_audio_with_vad():
    """Continuously records audio, only buffering speech using VAD."""
    print("Listening for speech...")
    buffer = []
    recording = False

    with sd.InputStream(samplerate=SAMPLE_RATE, channels=1, dtype="int16") as stream:
        while True:
            audio_chunk, _ = stream.read(BUFFER_SIZE)
            audio_np = np.frombuffer(audio_chunk, dtype=np.int16)

            is_speech = vad.is_speech(audio_np.tobytes(), SAMPLE_RATE)

            if is_speech:
                if not recording:
                    print("Voice detected, recording...")
                    recording = True
                buffer.append(audio_np)
            elif recording:
                print("Silence detected, stopping recording...")
                break

    if buffer:
        audio_data = np.concatenate(buffer, axis=0)
        return audio_data
    return None


def audio_to_wav_bytes(audio_data):
    """Converts raw numpy audio to WAV format"""
    audio_segment = AudioSegment(
        audio_data.tobytes(),
        frame_rate=SAMPLE_RATE,
        sample_width=audio_data.dtype.itemsize,
        channels=1,
    )
    wav_io = BytesIO()
    audio_segment.export(wav_io, format="wav")
    return wav_io.getvalue()


def play_audio(wav_bytes):
    """Plays AI response audio"""
    audio_segment = AudioSegment.from_wav(BytesIO(wav_bytes))
    play(audio_segment)


async def converse_with_ai():
    async with websockets.connect(ws_uri, additional_headers=headers) as websocket:
        # Send system message with prompt and problem statement
        system_message = {
            "type": "system",
            "data": {
                "text": system_prompt
                + "\n\nProblem Statement:\n"
                + leetcode_problem_context
            },
        }
        await websocket.send(json.dumps(system_message))

        while True:
            # Record user input only when voice is detected
            user_audio = record_audio_with_vad()
            if user_audio is None:
                continue  # No speech detected, continue listening

            # Convert speech to WAV format
            user_audio_wav = audio_to_wav_bytes(user_audio)

            # Send user audio to the AI
            user_message = {"type": "user", "data": {"audio": user_audio_wav}}
            await websocket.send(json.dumps(user_message))

            # Receive AI response
            response = await websocket.recv()
            response_data = json.loads(response)

            if (
                response_data["type"] == "assistant"
                and "audio" in response_data["data"]
            ):
                ai_audio_wav = response_data["data"]["audio"]
                play_audio(ai_audio_wav)
            else:
                print("Received non-audio response from AI.")


# Run the AI conversation loop
asyncio.run(converse_with_ai())
