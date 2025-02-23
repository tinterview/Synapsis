"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Power } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Player, Recorder } from "./lib/utils/audio";
import { WebSocketClient } from "./lib/utils/client";

//
// Types and Interfaces
//
interface Message {
  id: string;
  type: "user" | "assistant" | "status";
  content: string;
}

type WSControlAction = "speech_started" | "connected" | "text_done" | "audio_done";;

interface WSMessage {
  id?: string;
  type: "text_delta" | "transcription" | "user_message" | "control";
  delta?: string;
  text?: string;
  action?: WSControlAction;
  greeting?: string;
}

//
// Custom Hook: Audio Handlers
//
const useAudioHandlers = () => {
  const audioPlayerRef = useRef<Player | null>(null);
  const audioRecorderRef = useRef<Recorder | null>(null);

  const initAudioPlayer = async () => {
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Player();
      await audioPlayerRef.current.init(24000);
    }
    return audioPlayerRef.current;
  };

  // const handleAudioRecord = async (
  //   webSocketClient: WebSocketClient | null,
  //   isRecording: boolean
  // ) => {
  //   // If we're not currently recording, start
  //   if (!isRecording && webSocketClient) {
  //     if (!audioRecorderRef.current) {
  //       audioRecorderRef.current = new Recorder(async (buffer) => {
  //         await webSocketClient?.send({ type: "binary", data: buffer });
  //       });
  //     }
  //     const stream = await navigator.mediaDevices.getUserMedia({
  //       audio: {
  //         echoCancellation: true,
  //         sampleRate: 24000,
  //       },
  //     });
  //     await audioRecorderRef.current.start(stream);
  //     return true;
  //   }
  //   // If we are currently recording, stop
  //   else if (audioRecorderRef.current) {
  //     await audioRecorderRef.current.stop();
  //     audioRecorderRef.current = null;
  //     return false;
  //   }
  //   return isRecording;
  // };
  const handleAudioRecord = async (
    webSocketClient: WebSocketClient | null,
    isRecording: boolean
) => {
    try {
        if (!isRecording && webSocketClient) {
            if (!audioRecorderRef.current) {
                audioRecorderRef.current = new Recorder(async (buffer) => {
                    try {
                        await webSocketClient.send({
                            type: "binary",
                            data: buffer // Ensure we send ArrayBuffer
                        });
                    } catch (error) {
                        console.error("Error sending audio:", error);
                    }
                });
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 24000,
                }
            });
            
            await audioRecorderRef.current.start(stream);
            return true;
        } else if (audioRecorderRef.current) {
            await audioRecorderRef.current.stop();
            audioRecorderRef.current = null;
            // Send end-of-stream marker
            if (webSocketClient) {
                await webSocketClient.send({
                    type: "text",
                    data: JSON.stringify({ type: "control", action: "audio_done" })
                });
            }
            return false;
        }
        return isRecording;
    } catch (error) {
        console.error("Audio recording error:", error);
        return false;
    }
};

  return {
    audioPlayerRef,
    audioRecorderRef,
    initAudioPlayer,
    handleAudioRecord,
  };
};

//
// Main Chat Component
//
const ChatInterface = () => {
  //
  // State & References
  //
  const [endpoint, setEndpoint] = useState("ws://localhost:8080/realtime");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [validEndpoint, setValidEndpoint] = useState(true);

  // Map all messages for easy updates (especially for partial deltas)
  const messageMap = useRef(new Map<string, Message>());

  // Refs to current “in-progress” messages
  const currentConnectingMessage = useRef<Message | null>(null);
  const currentUserMessage = useRef<Message | null>(null);

  // WebSocket
  const webSocketClient = useRef<WebSocketClient | null>(null);

  // Chat scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Audio
  const { audioPlayerRef, audioRecorderRef, initAudioPlayer, handleAudioRecord } =
    useAudioHandlers();

  //
  // Helpers
  //
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  //
  // Handle incoming WS messages
  //
  const handleWSMessage = async (message: WSMessage) => {
    switch (message.type) {
      case "transcription":
        // Live transcription of the user (optional, if server supports it)
        if (message.id && currentUserMessage.current) {
          currentUserMessage.current.content = message.text || "";
          setMessages(Array.from(messageMap.current.values()));
        }
        break;

      case "text_delta":
        // Partial or chunked text from the assistant
        if (message.id) {
          const existingMsg = messageMap.current.get(message.id);
          if (existingMsg) {
            existingMsg.content += message.delta || "";
          } else {
            const newMsg: Message = {
              id: message.id,
              type: "assistant",
              content: message.delta || "",
            };
            messageMap.current.set(message.id, newMsg);
          }
          setMessages(Array.from(messageMap.current.values()));
        }
        break;

      case "control":
        if (message.action === "connected" && message.greeting) {
          // Update status message to reflect “connected”
          if (currentConnectingMessage.current) {
            currentConnectingMessage.current.content = message.greeting;
            setMessages(Array.from(messageMap.current.values()));
          }
        } else if (message.action === "speech_started") {
          // The server indicates a new user message is starting (transcription)
          audioPlayerRef.current?.clear();
          const contrivedId = "userMessage" + Math.random();
          currentUserMessage.current = {
            id: contrivedId,
            type: "user",
            content: "...",
          };
          messageMap.current.set(contrivedId, currentUserMessage.current);
          setMessages(Array.from(messageMap.current.values()));
        }else if (message.action === "text_done") {
          // Reset for next interaction
          currentUserMessage.current = null;
        }
        break;
    }
  };

  //
  // Loop over incoming data from WebSocket
  //
  const receiveLoop = async () => {
    const player = await initAudioPlayer();
    if (!webSocketClient.current) return;

    for await (const message of webSocketClient.current) {
      if (message.type === "text") {
        const data = JSON.parse(message.data) as WSMessage;
        await handleWSMessage(data);
      } else if (message.type === "binary" && player) {
        // Audio chunk from server
        player.play(new Int16Array(message.data));
      }
    }
  };

  //
  // Connect / Disconnect
  //
  const handleConnect = async () => {
    if (isConnected) {
      // Disconnect
      await disconnect();
    } else {
      // Connect
      const statusMessageId = `status-${Date.now()}`;
      currentConnectingMessage.current = {
        id: statusMessageId,
        type: "status",
        content: "Connecting...",
      };
      messageMap.current.clear();
      messageMap.current.set(statusMessageId, currentConnectingMessage.current);
      setMessages(Array.from(messageMap.current.values()));

      setIsConnecting(true);
      try {
        webSocketClient.current = new WebSocketClient(new URL(endpoint));
        setIsConnected(true);
        receiveLoop();
      } catch (error) {
        console.error("Connection failed:", error);
      } finally {
        setIsConnecting(false);
      }
    }
  };

  const disconnect = async () => {
    setIsConnected(false);
    if (isRecording) {
      await toggleRecording();
    }
    audioRecorderRef.current?.stop();
    await audioPlayerRef.current?.clear();
    await webSocketClient.current?.close();
    webSocketClient.current = null;
    messageMap.current.clear();
    setMessages([]);
  };

  useEffect(() => {
    // On unmount, make sure we clean up
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //
  // Validate Endpoint (simple check)
  //
  const validateEndpoint = (url: string) => {
    setEndpoint(url);
    try {
      new URL(url);
      setValidEndpoint(true);
    } catch {
      setValidEndpoint(false);
    }
  };

  //
  // Sending a typed message
  //
  const sendMessage = async () => {
    if (currentMessage.trim() && webSocketClient.current) {
      const messageId = `user-${Date.now()}`;
      const outMessage = {
        type: "user_message",
        text: currentMessage,
      };
      const newMessage: Message = {
        id: messageId,
        type: "user",
        content: currentMessage,
      };
      messageMap.current.set(messageId, newMessage);
      setMessages(Array.from(messageMap.current.values()));
      setCurrentMessage("");
      await webSocketClient.current.send({
        type: "text",
        data: JSON.stringify(outMessage),
      });
    }
  };

  //
  // Toggle Audio Recording
  //
  const toggleRecording = async () => {
    try {
      const newRecordingState = await handleAudioRecord(
        webSocketClient.current,
        isRecording
      );
      setIsRecording(newRecordingState);
    } catch (error) {
      console.error("Recording error:", error);
      setIsRecording(false);
    }
  };

  //
  // Render
  //
  return (
    <div className="flex flex-col items-center w-full p-4 bg-gray-50">
      {/* Connection Section */}
      <div className="w-full max-w-md bg-white p-4 rounded-lg shadow-md">
        <Accordion type="single" className="space-y-2" value="connection">
          <AccordionItem value="connection">
            <AccordionTrigger className="text-lg font-semibold">
              Middle Tier Endpoint
            </AccordionTrigger>
            <AccordionContent>
              <Input
                className="h-10 text-sm"
                value={endpoint}
                onChange={(e) => validateEndpoint(e.target.value)}
                disabled={isConnected}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button
          className={`w-full mt-2 py-2 flex items-center justify-center rounded-lg font-semibold transition-all shadow-md
            ${
              isConnecting
                ? "bg-yellow-500 text-white cursor-not-allowed opacity-70"
                : isConnected
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          onClick={handleConnect}
          disabled={isConnecting || !validEndpoint}
        >
          <Power className="w-5 h-5 mr-2" />
          {isConnecting ? "Connecting..." : isConnected ? "Disconnect" : "Connect"}
        </Button>
      </div>

      {/* Chat Section */}
      <div className="w-full max-w-md mt-4 bg-white p-4 rounded-lg shadow-md border h-96 overflow-y-auto">
        <div className="space-y-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg ${
                message.type === "user"
                  ? "bg-blue-100 ml-auto max-w-[80%]"
                  : message.type === "status"
                  ? "bg-gray-50 mx-auto max-w-[80%] text-center"
                  : "bg-gray-100 mr-auto max-w-[80%]"
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="w-full max-w-md mt-0 flex gap-2">
        <Input
          className="flex-grow h-10 text-sm"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          placeholder="Type your message..."
          onKeyUp={(e) => e.key === "Enter" && sendMessage()}
          disabled={!isConnected}
        />
        <Button
          variant="outline"
          onClick={toggleRecording}
          className={isRecording ? "bg-red-100" : ""}
          disabled={!isConnected}
        >
          {isRecording ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </Button>
        <Button onClick={sendMessage} disabled={!isConnected}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInterface;