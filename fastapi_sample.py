from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocketState
import uvicorn
import uuid
import json
from typing import Union, Literal, TypedDict
import asyncio
from loguru import logger
import os
from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from rtclient import (
    InputAudioTranscription,
    RTClient,
    ServerVAD,
    RTInputAudioItem,
    RTResponse,
    RTAudioContent,
    UserMessageItem,
    InputTextContentPart,
)


load_dotenv()

responses = []  # Store conversation


# Add this helper class at the top of the file (e.g., after your imports)
class RTMessage(dict):
    def __getattr__(self, name):
        return self.get(name)

    def __setattr__(self, name, value):
        self[name] = value


class TextDelta(TypedDict):
    id: str
    type: Literal["text_delta"]
    delta: str


class Transcription(TypedDict):
    id: str
    type: Literal["transcription"]
    text: str


class UserMessage(TypedDict):
    id: str
    type: Literal["user_message"]
    text: str


class ControlMessage(TypedDict):
    type: Literal["control"]
    action: str
    greeting: str | None = None
    id: str | None = None


WSMessage = Union[TextDelta, Transcription, UserMessage, ControlMessage]


class RTSession:
    def __init__(self, websocket: WebSocket, backend: str | None):
        self.session_id = str(uuid.uuid4())
        self.websocket = websocket
        self.logger = logger.bind(session_id=self.session_id)
        self.client = self._initialize_client(backend)
        self.logger.info("New session created")

    async def __aenter__(self):
        await self.client.__aenter__()
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        await self.client.__aexit__(exc_type, exc_value, traceback)
        self.logger.info("Session closed")

    def _initialize_client(self, backend: str | None):
        self.logger.debug(f"Initializing RT client with backend: {backend}")

        return RTClient(
            url="https://sanch-m751m6ic-eastus2.openai.azure.com/openai/realtime/",
            key_credential=AzureKeyCredential(
                "AQy8P8x5Gp0ZJ9c142ITx71PGcOSiKF8mNfbBiEspOIgOrNJrm7fJQQJ99BBACHYHv6XJ3w3AAAAACOGPeQS"
            ),
            azure_deployment="gpt-4o-mini-realtime-preview-phack",
        )

    async def send(self, message: WSMessage):
        await self.websocket.send_json(message)

    async def send_binary(self, message: bytes):
        await self.websocket.send_bytes(message)

    async def initialize(self):
        self.logger.debug("Configuring realtime session")
        system_prompt = """
You are an AI interviewer conducting a technical interview for coding problems. Your role is to *guide the candidate* by clarifying doubts and providing hints if needed—without directly giving the answer.

## *Guidelines*
- *DO NOT* provide the correct code or solution.
- *DO NOT* explicitly state the optimal algorithm or approach.
- *DO* adapt your responses based on the candidate's progress and explanations.

## *Interaction Style*
- Keep responses *short* and *engaging*.
- Encourage the candidate to *explain their reasoning aloud*.
- Maintain a professional yet conversational tone.

Always *guide, do not give answers. Your goal is to **assess the problem-solving skills, not just correctness of the answer*.

## *Here is the sequence of interview steps*
1- First Greet the interviewee
2- Tell them that we will directly jump into a technical interview
3- Start with the first question from the list below. 
4- Ask follow-up questions to understand the interviewee's thought process
5- Do not go to the next question until the candidate says, I am done with this question or candidate is struggling and wants to skip the question
6- Make sure you ask all the questions, one by one after the previous question is done
6- Once all the questions are over, give them a rating from 1-10 and thank you for attending the interview
7- If the candidate asks to finish or quit the inteview early, still give them a rating from 1-10 and thank them for attending the interview

## *Interview Question List*
1-	How to identify if a string is a palindrome?
2-	How do you find the max value in an integer array?
3-	Is Python a complied or interpreted language?

"""

        await self.client.configure(
            modalities={"text", "audio"},
            voice="alloy",
            input_audio_format="pcm16",
            input_audio_transcription=InputAudioTranscription(model="whisper-1"),
            turn_detection=ServerVAD(),
            instructions=system_prompt,
        )

        greeting: ControlMessage = {
            "type": "control",
            "action": "connected",
            "greeting": "You are now connected to the FastAPI server",
        }

        await self.send(greeting)

        # Optionally send a system prompt if defined
        # system_prompt = """
        # You are an AI interviewer conducting a technical interview for a coding problem. Your role is to *guide the candidate* by clarifying doubts, asking insightful follow-up questions, and providing hints—without directly giving the answer.
        # """
        # if system_prompt:
        #    system_message = RTMessage(
        #        {
        #            "type": "message",
        #            "role": "system",
        #            "content": [{"type": "input_text", "text": system_prompt}],
        #        }
        #    )
        # await self.client.send_item(system_message)
        # await self.client.generate_response()
        #    self.logger.debug("System prompt sent to the model")

        self.logger.debug("Realtime session configured successfully")
        asyncio.create_task(self.start_event_loop())

    # Runs continuoisly receiving bytes from websocket and then sending audio stream to Azure Open AI
    async def handle_binary_message(self, message: bytes):
        try:
            await self.client.send_audio(message)
        except Exception as error:
            self.logger.error(f"Failed to send audio data: {error}")
            raise

    async def handle_text_message(self, message: str):
        try:
            parsed: WSMessage = json.loads(message)
            self.logger.debug(f"Received text message type: {parsed['type']}")

            if parsed["type"] == "user_message":
                # Option 1 - works for one time
                await self.client.send_item(
                    item=UserMessageItem(
                        content=[InputTextContentPart(text=parsed["text"])]
                    )
                )

                # Option 2 - Erros about id
                # await self.client.send_item(
                #    {
                #        "type": "message",
                #        "role": "user",
                #        "content": [{"type": "input_text", "text": parsed["text"]}],
                #    }
                # )
                await self.client.generate_response()
                self.logger.debug("User message processed successfully")
        except Exception as error:
            self.logger.error(f"Failed to process user message: {error}")
            raise

    async def handle_text_content(self, content):
        try:
            content_id = f"{content.item_id}-{content.content_index}"
            async for text in content.text_chunks():
                delta_message: TextDelta = {
                    "id": content_id,
                    "type": "text_delta",
                    "delta": text,
                }
                await self.send(delta_message)

            await self.send(
                {"type": "control", "action": "text_done", "id": content_id}
            )
            self.logger.debug("Text content processed successfully")
        except Exception as error:
            self.logger.error(f"Error handling text content: {error}")
            raise

    async def handle_audio_content(self, content: RTAudioContent):
        async def handle_audio_chunks():
            print("3rd")
            async for chunk in content.audio_chunks():
                await self.send_binary(chunk)

        async def handle_audio_transcript():
            content_id = f"{content.item_id}-{content.content_index}"
            responseText = ""
            async for chunk in content.transcript_chunks():
                await self.send(
                    {"id": content_id, "type": "text_delta", "delta": chunk}
                )
                responseText = responseText + chunk
            await self.send(
                {"type": "control", "action": "text_done", "id": content_id}
            )
            print("AI Response Text: " + responseText)
            responses.append(["model", responseText])

        try:
            await asyncio.gather(handle_audio_chunks(), handle_audio_transcript())
            self.logger.debug("Audio content processed successfully")
        except Exception as error:
            self.logger.error(f"Error handling audio content: {error}")
            raise

    async def handle_response(self, event: RTResponse):
        try:
            async for item in event:
                if item.type == "message":
                    async for content in item:
                        if content.type == "text":
                            await self.handle_text_content(content)
                        elif content.type == "audio":
                            await self.handle_audio_content(content)
            self.logger.debug("Response handled successfully")
        except Exception as error:
            self.logger.error(f"Error handling response: {error}")
            raise

    # receives text spoken by user
    async def handle_input_audio(self, event: RTInputAudioItem):
        try:
            print("2nd")
            await self.send({"type": "control", "action": "speech_started"})
            await event
            # Prints user speech text
            if event.transcript:
                print("User Question Text: " + event.transcript)
            responses.append(["user", event.transcript])
            transcription: Transcription = {
                "id": event.id,
                "type": "transcription",
                "text": event.transcript or "",
            }
            await self.send(transcription)
            self.logger.debug(
                f"Input audio processed successfully, transcription length: {len(transcription['text'])}"
            )
        except Exception as error:
            self.logger.error(f"Error handling input audio: {error}")
            raise

    async def start_event_loop(self):
        try:
            self.logger.debug("Starting event loop")
            async for event in self.client.events():
                if event.type == "response":
                    await self.handle_response(event)
                elif event.type == "input_audio":
                    await self.handle_input_audio(event)
        except Exception as error:
            self.logger.error(f"Error in event loop: {error}")
            raise


app = FastAPI()
# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/realtime")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("New WebSocket connection established")

    async with RTSession(websocket, "azure") as session:
        try:
            await session.initialize()

            while websocket.client_state != WebSocketState.DISCONNECTED:
                message = await websocket.receive()
                if "bytes" in message:
                    await session.handle_binary_message(message["bytes"])
                elif "text" in message:
                    await session.handle_text_message(message["text"])
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
        finally:
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.close()
            logger.info("WebSocket connection closed")
            print("Responses: ", responses)

            # Store the responses in a file in /frontend to accessed
            # by the frontend next.js code for metrics and analysis
            with open("responses.json", "w") as f:
                json.dump(responses, f)

            # Run a subprocess to call "uv run final_llm.py" to evaluate the conversation
            # and store the result in interview_analysis.json
            import subprocess
            subprocess.run(["uv run", "final_llm.py"])


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
