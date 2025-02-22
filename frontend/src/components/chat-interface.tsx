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

interface Message {
  id: string;
  type: "user" | "assistant" | "status";
  content: string;
}

const ChatInterface = () => {
  const [endpoint, setEndpoint] = useState("ws://localhost:8080/realtime");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [validEndpoint, setValidEndpoint] = useState(true);
  const webSocketClient = useRef<WebSocketClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleConnect = async () => {
    if (isConnected) {
      setIsConnected(false);
      webSocketClient.current?.close();
      webSocketClient.current = null;
      setMessages([]);
    } else {
      setIsConnecting(true);
      try {
        webSocketClient.current = new WebSocketClient(new URL(endpoint));
        setIsConnected(true);
      } catch (error) {
        console.error("Connection failed:", error);
      } finally {
        setIsConnecting(false);
      }
    }
  };

  const sendMessage = async () => {
    if (currentMessage.trim() && webSocketClient.current) {
      const newMessage: Message = {
        id: `user-${Date.now()}`,
        type: "user",
        content: currentMessage,
      };
      setMessages([...messages, newMessage]);
      setCurrentMessage("");
    }
  };

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
                onChange={(e) => setEndpoint(e.target.value)}
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

      {/* Chatbot Section */}
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
          onClick={() => console.log("Recording toggled")}
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
