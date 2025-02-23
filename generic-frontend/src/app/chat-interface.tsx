"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Power, Settings, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Player, Recorder } from "@/lib/audio";
import { WebSocketClient } from "@/lib/client";
import SessionMetrics from "@/components/ui/session-metrics";
import InterviewAnalysis from '@/components/ui/interview-analysis';

interface Message {
  id: string;
  type: "user" | "assistant" | "status";
  content: string;
  timestamp?: number;
}

type WSControlAction = "speech_started" | "connected" | "text_done";

interface WSMessage {
  id?: string;
  type: "text_delta" | "transcription" | "user_message" | "control";
  delta?: string;
  text?: string;
  action?: WSControlAction;
  greeting?: string;
}

interface AudioHandlers {
  audioPlayerRef: React.RefObject<Player>;
  audioRecorderRef: React.RefObject<Recorder>;
  initAudioPlayer: () => Promise<Player>;
  handleAudioRecord: (webSocketClient: WebSocketClient | null, isRecording: boolean) => Promise<boolean>;
}

const useAudioHandlers = (): AudioHandlers => {
  const audioPlayerRef = useRef<Player | null>(null);
  const audioRecorderRef = useRef<Recorder | null>(null);

  const initAudioPlayer = async (): Promise<Player> => {
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Player();
      await audioPlayerRef.current.init(24000);
    }
    return audioPlayerRef.current;
  };

  const handleAudioRecord = async (
    webSocketClient: WebSocketClient | null,
    isRecording: boolean
  ): Promise<boolean> => {
    if (!isRecording && webSocketClient) {
      if (!audioRecorderRef.current) {
        audioRecorderRef.current = new Recorder(async (buffer) => {
          await webSocketClient?.send({ type: "binary", data: buffer });
        });
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          sampleRate: 24000,
        },
      });
      await audioRecorderRef.current.start(stream);
      return true;
    } else if (audioRecorderRef.current) {
      await audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
      return false;
    }
    return isRecording;
  };

  return {
    audioPlayerRef,
    audioRecorderRef,
    initAudioPlayer,
    handleAudioRecord,
  };
};

const ChatInterface: React.FC = () => {
  const [endpoint, setEndpoint] = useState<string>("ws://localhost:8080/realtime");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [validEndpoint, setValidEndpoint] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [sessionStartTime] = useState<number>(Date.now());
  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  const webSocketClient = useRef<WebSocketClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageMap = useRef<Map<string, Message>>(new Map());
  const currentConnectingMessage = useRef<Message | null>(null);
  const currentUserMessage = useRef<Message | null>(null);

  const { audioPlayerRef, audioRecorderRef, initAudioPlayer, handleAudioRecord } =
    useAudioHandlers();

  const getSessionDuration = (): string => {
    const duration = Math.floor((Date.now() - sessionStartTime) / 60000);
    return `${duration}m`;
  };

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleWSMessage = async (message: WSMessage): Promise<void> => {
    let updatedMessages: Message[] = [];

    switch (message.type) {
      case "transcription":
        if (message.id && currentUserMessage.current) {
          currentUserMessage.current.content = message.text || "";
          updatedMessages = Array.from(messageMap.current.values());
          setMessages(updatedMessages);
        }
        break;

      case "text_delta":
        if (message.id) {
          const existingMessage = messageMap.current.get(message.id);
          if (existingMessage) {
            existingMessage.content += message.delta || "";
          } else {
            const newMessage: Message = {
              id: message.id,
              type: "assistant",
              content: message.delta || "",
              timestamp: Date.now(),
            };
            messageMap.current.set(message.id, newMessage);
          }
          updatedMessages = Array.from(messageMap.current.values());
          setMessages(updatedMessages);
        }
        break;

      case "control":
        if (message.action === "connected" && message.greeting && currentConnectingMessage.current) {
          currentConnectingMessage.current.content = message.greeting;
          updatedMessages = Array.from(messageMap.current.values());
          setMessages(updatedMessages);
        } else if (message.action === "speech_started") {
          if (audioPlayerRef.current) {
            await audioPlayerRef.current.clear();
          }
          const messageId = "userMessage" + Date.now();
          currentUserMessage.current = {
            id: messageId,
            type: "user",
            content: "...",
            timestamp: Date.now(),
          };
          messageMap.current.set(messageId, currentUserMessage.current);
          updatedMessages = Array.from(messageMap.current.values());
          setMessages(updatedMessages);
        }
        break;
    }
  };

  const receiveLoop = async (): Promise<void> => {
    const player = await initAudioPlayer();
    if (!webSocketClient.current) return;

    try {
      for await (const message of webSocketClient.current) {
        if (message.type === "text") {
          const data = JSON.parse(message.data) as WSMessage;
          await handleWSMessage(data);
        } else if (message.type === "binary" && player) {
          player.play(new Int16Array(message.data));
        }
      }
    } catch (error) {
      setHasError(true);
      setErrorMessage("Connection lost. Please reconnect.");
      await disconnect();
    }
  };

  const handleConnect = async (): Promise<void> => {
    setHasError(false);
    setErrorMessage("");
    
    if (isConnected) {
      await disconnect();
    } else {
      const statusMessageId = `status-${Date.now()}`;
      currentConnectingMessage.current = {
        id: statusMessageId,
        type: "status",
        content: "Connecting...",
        timestamp: Date.now(),
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
        setHasError(true);
        setErrorMessage("Connection failed. Please check the endpoint and try again.");
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          type: "status",
          content: "Connection failed. Please check the endpoint and try again.",
          timestamp: Date.now(),
        };
        messageMap.current.set(errorMessage.id, errorMessage);
        setMessages(Array.from(messageMap.current.values()));
      } finally {
        setIsConnecting(false);
      }
    }
  };

  const disconnect = async (): Promise<void> => {
    setIsConnected(false);
    if (isRecording) {
      await toggleRecording();
    }
    if (audioRecorderRef.current) {
      await audioRecorderRef.current.stop();
    }
    if (audioPlayerRef.current) {
      await audioPlayerRef.current.clear();
    }
    if (webSocketClient.current) {
      await webSocketClient.current.close();
      webSocketClient.current = null;
    }
    messageMap.current.clear();
    setMessages([]);
    setHasError(false);
    setErrorMessage("");

    // Start polling for analysis file
    if (!pollInterval.current) {
      pollInterval.current = setInterval(checkForAnalysisFile, 1000); // Check every second
    }
  };

  const sendMessage = async (): Promise<void> => {
    const trimmedMessage = currentMessage.trim();
    if (trimmedMessage && webSocketClient.current) {
      const messageId = `user-${Date.now()}`;
      const newMessage: Message = {
        id: messageId,
        type: "user",
        content: trimmedMessage,
        timestamp: Date.now(),
      };
      messageMap.current.set(messageId, newMessage);
      setMessages(Array.from(messageMap.current.values()));
      setCurrentMessage("");

      try {
        await webSocketClient.current.send({
          type: "text",
          data: JSON.stringify({
            type: "user_message",
            text: trimmedMessage,
          }),
        });
      } catch (error) {
        console.error("Failed to send message:", error);
        setHasError(true);
        setErrorMessage("Failed to send message. Please try again.");
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          type: "status",
          content: "Failed to send message. Please try again.",
          timestamp: Date.now(),
        };
        messageMap.current.set(errorMessage.id, errorMessage);
        setMessages(Array.from(messageMap.current.values()));
      }
    }
  };

  const toggleRecording = async (): Promise<void> => {
    try {
      const newRecordingState = await handleAudioRecord(
        webSocketClient.current,
        isRecording
      );
      setIsRecording(newRecordingState);
    } catch (error) {
      console.error("Recording error:", error);
      setIsRecording(false);
      setHasError(true);
      setErrorMessage("Failed to toggle recording. Please check your microphone permissions.");
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: "status",
        content: "Failed to toggle recording. Please check your microphone permissions.",
        timestamp: Date.now(),
      };
      messageMap.current.set(errorMessage.id, errorMessage);
      setMessages(Array.from(messageMap.current.values()));
    }
  };

  const validateEndpoint = (url: string): void => {
    setEndpoint(url);
    try {
      new URL(url);
      setValidEndpoint(true);
      setHasError(false);
      setErrorMessage("");
    } catch {
      setValidEndpoint(false);
      setHasError(true);
      setErrorMessage("Invalid WebSocket URL");
    }
  };

  const checkForAnalysisFile = async () => {
    try {
      const response = await fetch('/interview_analysis.json');
      if (response.ok) {
        const data = await response.json();
        setAnalysisData(data[0]); // Get first object from array
        setShowAnalysis(true);
        // Clear polling interval once we have the data
        if (pollInterval.current) {
          clearInterval(pollInterval.current);
          pollInterval.current = null;
        }
      }
    } catch (error) {
      console.log('Analysis file not ready yet');
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  useEffect(() => {
    // Auto-connect when component mounts
    if (!isConnected && !isConnecting && validEndpoint) {
      handleConnect();
    }
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Left Sidebar */}
      <div className="w-80 bg-white/80 backdrop-blur-sm p-6 flex flex-col border-r border-primary/10 shadow-lg">
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <Settings className="w-6 h-6 text-primary animate-pulse-gentle" />
          <h1 className="text-xl font-semibold text-primary">Settings</h1>
        </div>
        
        {/* Connection Settings */}
        <Card className="bg-white/90 backdrop-blur-sm border-primary/20 animate-bounce-in mb-6">
          <CardHeader>
            <CardTitle className="text-base text-primary flex items-center gap-2">
              Connection Settings
              {hasError && <AlertCircle className="w-4 h-4 text-destructive" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="WebSocket Endpoint"
                  value={endpoint}
                  onChange={(e) => validateEndpoint(e.target.value)}
                  disabled={isConnected}
                  className={`border-primary/20 focus:border-primary transition-colors ${
                    hasError ? 'border-destructive' : ''
                  }`}
                />
                {hasError && (
                  <p className="text-sm text-destructive mt-1">{errorMessage}</p>
                )}
              </div>
              <Button
                className={`w-full transition-all duration-300 ${
                  isConnected 
                    ? "bg-destructive hover:bg-destructive/90" 
                    : "bg-primary hover:bg-primary/90"
                }`}
                onClick={handleConnect}
                disabled={isConnecting || !validEndpoint}
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Power className="w-4 h-4 mr-2" />
                )}
                {isConnecting ? "Connecting..." : isConnected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Session Metrics */}
        <SessionMetrics
          metrics={{
            timeSpent: getSessionDuration(),
            totalMessages: messages.length,
            userMessages: messages.filter(m => m.type === "user").length,
            assistantMessages: messages.filter(m => m.type === "assistant").length
          }}
        />

        {/* Connection Status */}
        <div className="mt-4 text-sm text-center">
          <p className={`${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
            {isConnected ? '● Connected' : '○ Disconnected'}
          </p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex justify-center bg-white/80 backdrop-blur-sm">
        <div className="w-full max-w-2xl flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                key={message.id}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                } animate-fade-in`}
              >
                <div
                  className={`message-bubble p-4 rounded-2xl max-w-[80%] shadow-md transition-all hover:shadow-lg ${
                    message.type === "user"
                      ? "bg-primary text-white"
                      : message.type === "status"
                      ? "bg-secondary text-secondary-foreground mx-auto text-center"
                      : "bg-accent text-accent-foreground"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  {message.timestamp && (
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-primary/10 bg-white/90 backdrop-blur-sm p-6">
          <div className="flex gap-3">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyUp={(e) => e.key === "Enter" && sendMessage()}
              disabled={!isConnected}
              className="flex-1 border-primary/20 focus:border-primary transition-colors"
            />
            <Button
              variant="outline"
              onClick={toggleRecording}
              className={`transition-all duration-300 ${
                isRecording 
                  ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" 
                  : "hover:border-primary hover:text-primary"
              }`}
              disabled={!isConnected}
            >
              {isRecording ? (
                <Mic className="w-4 h-4 animate-pulse" />
              ) : (
                <MicOff className="w-4 h-4" />
              )}
            </Button>
            <Button 
              onClick={sendMessage} 
              disabled={!isConnected || !currentMessage.trim()}
              className="bg-primary hover:bg-primary/90 transition-colors"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
    {showAnalysis && analysisData && (
      <InterviewAnalysis data={analysisData} />
    )}
  </div>
);
};

export default ChatInterface;