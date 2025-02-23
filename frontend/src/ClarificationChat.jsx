import React, { useState, useRef, useEffect } from 'react';
import { Mic, Volume2, Volume2Off } from 'lucide-react';

const ClarificationChat = () => {
  const [messages, setMessages] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [voices, setVoices] = useState([]);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0) {
        setSelectedVoice(availableVoices[0]);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const speak = (text) => {
    if (!text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleClarificationResponse = async (audioBlob) => {
    try {
      // Create FormData and append the audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'clarification.webm');
      
      // Send to your backend for transcription
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      // Add the transcribed question to messages
      setMessages(prev => [...prev, {
        type: 'user',
        content: data.transcript
      }]);

      // Add the AI response to messages
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: data.answer
      }]);

      // Speak the response
      speak(data.answer);
    } catch (error) {
      console.error('Error processing clarification:', error);
      setMessages(prev => [...prev, {
        type: 'error',
        content: 'Error processing your question. Please try again.'
      }]);
    }
  };

  return (
    <div className="chat-section">
      <div 
        ref={chatContainerRef}
        className="chat-messages-container"
      >
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.type}`}
          >
            <p>{message.content}</p>
            {message.type === 'assistant' && (
              <button
                className="tts-button"
                onClick={() => message.content && speak(message.content)}
              >
                {isSpeaking ? <Volume2Off size={16} /> : <Volume2 size={16} />}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClarificationChat;