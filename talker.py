import os
import time
import azure.cognitiveservices.speech as speechsdk
from dotenv import load_dotenv
from openai import AzureOpenAI

# Load environment variables
load_dotenv()

# Configuration
SPEECH_KEY = os.getenv("SPEECH_KEY")
SPEECH_REGION = os.getenv("SPEECH_REGION")
OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
VOICE_NAME = "en-US-JennyNeural"  # Choose from available voices

# Initialize clients
openai_client = AzureOpenAI(
    api_key=OPENAI_KEY,
    api_version="2024-02-01",
    azure_endpoint=OPENAI_ENDPOINT
)

# Configure speech components
speech_config = speechsdk.SpeechConfig(subscription=SPEECH_KEY, region=SPEECH_REGION)
speech_config.speech_synthesis_voice_name = VOICE_NAME

# Create audio configurations
audio_input_config = speechsdk.audio.AudioConfig(use_default_microphone=True)
audio_output_config = speechsdk.audio.AudioConfig(use_default_speaker=True)

# Create recognizer and synthesizer
recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_input_config)
synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_output_config)

# Conversation history
conversation_history = [
    {"role": "system", "content": "You are a helpful assistant. Keep responses concise and natural."}
]

def process_message(text: str):
    """Process user input through OpenAI and synthesize response"""
    try:
        # Add user message to history
        conversation_history.append({"role": "user", "content": text})
        
        # Get OpenAI response
        response = openai_client.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=conversation_history,
            temperature=0.7
        )
        
        assistant_response = response.choices[0].message.content
        
        # Add assistant response to history
        conversation_history.append({"role": "assistant", "content": assistant_response})
        
        # Print and synthesize response
        print(f"Assistant: {assistant_response}")
        synthesizer.speak_text_async(assistant_response).get()
        
    except Exception as e:
        print(f"Error: {str(e)}")

# Register event handlers
def recognized_callback(evt: speechsdk.SpeechRecognitionEventArgs):
    if evt.result.reason == speechsdk.ResultReason.RecognizedSpeech:
        user_input = evt.result.text
        print(f"User: {user_input}")
        process_message(user_input)

recognizer.recognized.connect(recognized_callback)

# Start continuous recognition
print("Speak to start the conversation... (Press Ctrl+C to stop)")
recognizer.start_continuous_recognition()

# Keep the program running
try:
    while True:
        time.sleep(0.5)
except KeyboardInterrupt:
    recognizer.stop_continuous_recognition()
    print("\nConversation ended.")