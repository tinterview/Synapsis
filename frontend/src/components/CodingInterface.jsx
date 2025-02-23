import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { AlertCircle, Check, Clock, XCircle, Camera, Mic } from 'lucide-react';
import './CodingInterface.css';

const CodingInterface = ({ onBackClick, onEndInterview, isDarkMode }) => {
  const codeTemplates = {
    python: {
      template: 'def fizzbuzz(n):\n    # Your code here\n    pass'
    },
    javascript: {
      template: 'function fizzbuzz(n) {\n    // Your code here\n    return [];\n}'
    },
    java: {
      template: 'public class Solution {\n    public List<String> fizzbuzz(int n) {\n        // Your code here\n        return new ArrayList<>();\n    }\n}'
    }
  };

  // All state variables
  const [language, setLanguage] = useState('python');
  const [userCode, setUserCode] = useState(codeTemplates.python.template);
  const [userInput, setUserInput] = useState('15');
  const [runOutput, setRunOutput] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [isRecording, setIsRecording] = useState(true);
  const [isClarifying, setIsClarifying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [expandedTestCase, setExpandedTestCase] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);

  // All refs
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);

  // Language IDs for Judge0 API
  const languageIds = {
    python: 71,
    javascript: 63,
    java: 62
  };

  // Test cases
  const testCases = [
    { id: 1, input: '3', expectedOutput: '[\'1\', \'2\', \'Fizz\']' },
    { id: 2, input: '5', expectedOutput: '[\'1\', \'2\', \'Fizz\', \'4\', \'Buzz\']' },
    { id: 3, input: '15', expectedOutput: '[\'1\', \'2\', \'Fizz\', \'4\', \'Buzz\', \'Fizz\', \'7\', \'8\', \'Fizz\', \'Buzz\', \'11\', \'Fizz\', \'13\', \'14\', \'FizzBuzz\']' }
  ];

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-start video recording effect
  useEffect(() => {
    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });

        mediaStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        mediaRecorderRef.current = new MediaRecorder(stream);
        videoChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            videoChunksRef.current.push(e.data);
          }
        };
        
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'interview-recording.webm';
          a.click();

          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
          }
        };
        
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error starting recording:", err);
        setIsRecording(false);
      }
    };

    startRecording();

    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Time formatting helper
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Language change handler
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setUserCode(codeTemplates[newLang].template);
  };

  // Clarification recording handler
  const toggleClarification = async () => {
    if (!isClarifying) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        
        audioRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        
        audioRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          a.download = `clarification-${timestamp}.webm`;
          a.click();
          
          stream.getTracks().forEach(track => track.stop());
        };
        
        audioRecorderRef.current.start();
        setIsClarifying(true);
      } catch (err) {
        console.error("Error starting audio recording:", err);
      }
    } else {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
      }
      setIsClarifying(false);
    }
  };

  // Code submission helper
  const buildSubmissionCode = (code, language) => {
    if (language === 'python') {
      return `${code}\n\nif __name__ == '__main__':\n    import sys\n    n = int(sys.stdin.read().strip())\n    print(fizzbuzz(n))`;
    } else if (language === 'javascript') {
      return `${code}\n\nconst fs = require('fs');\nconst input = parseInt(fs.readFileSync(0, 'utf-8').trim());\nconsole.log(fizzbuzz(input));`;
    } else if (language === 'java') {
      return `${code}\n\nimport java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        Solution sol = new Solution();\n        System.out.println(sol.fizzbuzz(n));\n    }\n}`;
    }
    return code;
  };

  // Judge0 API handlers
  const submitToJudge0 = async (code, input) => {
    const finalCode = buildSubmissionCode(code, language);
    const response = await fetch('https://judge0-ce.p.rapidapi.com/submissions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': '4000f75be5mshaf05e34616add58p1d134fjsnb11b66308dd8',
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      body: JSON.stringify({
        source_code: finalCode,
        language_id: languageIds[language],
        stdin: input
      })
    });
    return await response.json();
  };

  const getSubmissionResult = async (token) => {
    const response = await fetch(`https://judge0-ce.p.rapidapi.com/submissions/${token}`, {
      headers: {
        'X-RapidAPI-Key': '4000f75be5mshaf05e34616add58p1d134fjsnb11b66308dd8',
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      }
    });
    return await response.json();
  };

  // Run code handler
  const handleRun = async () => {
    setIsRunning(true);
    setRunOutput({
      stdout: 'Running your code...',
      error: null
    });

    try {
      const { token } = await submitToJudge0(userCode, userInput);
      let result;
      
      do {
        await new Promise(resolve => setTimeout(resolve, 1000));
        result = await getSubmissionResult(token);
      } while (result.status?.description === 'Processing');

      setRunOutput({
        stdout: result.stdout ? result.stdout.trim() : 'No output',
        error: result.stderr || result.compile_output || null
      });
    } catch (error) {
      setRunOutput({
        stdout: '',
        error: 'Error running code: ' + error.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Submit code handler
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setTestResults({
      running: true,
      cases: testCases.map(testCase => ({
        ...testCase,
        status: 'running'
      }))
    });

    try {
      const results = await Promise.all(
        testCases.map(async (testCase) => {
          const { token } = await submitToJudge0(userCode, testCase.input);
          let result;
          
          do {
            await new Promise(resolve => setTimeout(resolve, 1000));
            result = await getSubmissionResult(token);
          } while (result.status?.description === 'Processing');

          const output = result.stdout ? result.stdout.trim() : '';
          const passed = output === testCase.expectedOutput;

          return {
            ...testCase,
            status: passed ? 'passed' : 'failed',
            actualOutput: output,
            error: result.stderr || result.compile_output || null
          };
        })
      );

      setTestResults({
        running: false,
        cases: results
      });
    } catch (error) {
      setTestResults({
        running: false,
        cases: testCases.map(testCase => ({
          ...testCase,
          status: 'error',
          error: 'Error running test case'
        }))
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Test case handlers
  const handleTestCaseClick = (testCaseId) => {
    setExpandedTestCase(expandedTestCase === testCaseId ? null : testCaseId);
  };

  // Interview end handlers
  const handleEndInterview = () => {
    setShowEndConfirmation(true);
  };

  const confirmEndInterview = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (audioRecorderRef.current && isClarifying) {
      audioRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    onEndInterview();
  };

  return (
    <div className={`interface-container ${isDarkMode ? 'dark-mode' : ''}`}>
      {showEndConfirmation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>End Interview?</h3>
            <p>Are you sure you want to end the interview? This will save your recording and submit your final code.</p>
            <div className="modal-buttons">
              <button className="modal-button cancel" onClick={() => setShowEndConfirmation(false)}>
                Cancel
              </button>
              <button className="modal-button confirm" onClick={confirmEndInterview}>
                End Interview
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="interface-nav">
        <div className="nav-left">
          <button className="back-button" onClick={onBackClick}>
            ← Back to Home
          </button>
          <h1>AI Coding Assistant</h1>
          <div className="language-selector">
            <select 
              value={language}
              onChange={handleLanguageChange}
              className="language-select"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
            </select>
          </div>
        </div>
        <div className="timer">
          {formatTime(elapsedTime)}
        </div>
      </nav>

      <main className="interface-content">
        <section className="problem-panel">
          <div className="problem-header">
            <h2>FizzBuzz</h2>
            <span className="difficulty-badge easy">Easy</span>
          </div>
          
          <div className="problem-description">
            <p>Write a function that returns an array of strings for numbers from 1 to n, where:</p>
            <ul>
              <li>For multiples of 3, use "Fizz" instead of the number</li>
              <li>For multiples of 5, use "Buzz" instead of the number</li>
              <li>For multiples of both 3 and 5, use "FizzBuzz"</li>
              <li>For other numbers, use the number itself as a string</li>
            </ul>
            
            <div className="examples-section">
              <h3>Example:</h3>
              <div className="example-box">
                <div><strong>Input:</strong> n = 5</div>
                <div><strong>Output:</strong> ['1', '2', 'Fizz', '4', 'Buzz']</div>
                <div className="explanation">Every third number becomes 'Fizz', every fifth number becomes 'Buzz'</div>
              </div>
            </div>
          </div>
        </section>

        <section className="editor-panel">
          <div className="editor-toolbar">
            <div className="toolbar-controls">
              <div className="input-group">
                <label>Test Input:</label>
                <input 
                  type="text" 
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Enter a number"
                />
              </div>
              <div className="button-group">
                <button 
                  className={`run-btn ${isRunning ? 'running' : ''}`} 
                  onClick={handleRun}
                  disabled={isRunning}
                >
                  {isRunning ? 'Running...' : 'Run'}
                </button>
                <button 
                  className={`clarify-btn ${isClarifying ? 'recording' : ''}`}
                  onClick={toggleClarification}
                >
                  <Mic size={16} />
                  {isClarifying ? 'End Clarification' : 'Clarify'}
                </button>
                <button 
                  className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
                <button 
                  className="end-interview-btn"
                  onClick={handleEndInterview}
                >
                  End Interview
                </button>
              </div>
            </div>
          </div>

          <Editor
            height="calc(100vh - 400px)"
            defaultLanguage="python"
            language={language}
            value={userCode}
            onChange={(value) => setUserCode(value)}
            theme={isDarkMode ? "vs-dark" : "light"}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              padding: { top: 20 },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              roundedSelection: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: 'on',
              renderLineHighlight: 'all',
              suggestOnTriggerCharacters: true
            }}
          />

          {runOutput && (
            <div className="output-panel">
              <h3>Output:</h3>
              <pre className={`output-content ${runOutput.error ? 'error' : ''}`}>
                {runOutput.error ? runOutput.error : runOutput.stdout}
              </pre>
            </div>
          )}

          {testResults && (
            <div className="test-results">
              <h3>Test Results:</h3>
              <div className="test-cases">
                {testResults.cases.map((test) => (
                  <div key={test.id} className="test-case-wrapper">
                    <div 
                      className={`test-case ${test.status}`}
                      onClick={() => handleTestCaseClick(test.id)}
                    >
                      <div className="test-case-header">
                        <div className="test-case-info">
                          <span>Test Case {test.id}</span>
                          {test.status === 'running' && <Clock className="icon" />}
                          {test.status === 'passed' && <Check className="icon success" />}
                          {test.status === 'failed' && <XCircle className="icon error" />}
                          {test.status === 'error' && <AlertCircle className="icon warning" />}
                        </div>
                        <span className={`status ${test.status}`}>
                          {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    {expandedTestCase === test.id && (
                      <div className="test-case-details">
                        <div className="detail-row">
                          <span className="detail-label">Input:</span>
                          <span className="detail-value">{test.input}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Expected Output:</span>
                          <span className="detail-value">{test.expectedOutput}</span>
                        </div>
                        {test.actualOutput && (
                          <div className="detail-row">
                            <span className="detail-label">Your Output:</span>
                            <span className="detail-value">{test.actualOutput}</span>
                          </div>
                        )}
                        {test.error && (
                          <div className="detail-row error">
                            <span className="detail-label">Error:</span>
                            <span className="detail-value">{test.error}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="chat-panel">
          <div className="interviewer-info">
            <div className="interviewer-avatar">
              <img src="/api/placeholder/40/40" alt="Interviewer" />
            </div>
            <div className="interviewer-details">
              <h3>Joe Smith</h3>
              <p className="interviewer-status">Technical Interviewer</p>
            </div>
          </div>
          
          <div className="chat-messages">
            <div className="message interviewer">
              <p>Hi! I'll be your interviewer today. Let's work on solving the FizzBuzz problem. Feel free to ask any questions!</p>
            </div>
          </div>

          <div className="video-container">
            <video 
              ref={videoRef} 
              className="video-preview" 
              autoPlay 
              playsInline 
              muted
            />
            <div className="recording-status">
              <span className={`status-indicator ${isRecording ? 'recording' : ''}`}></span>
              {isRecording ? 'Recording in progress...' : 'Recording stopped'}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CodingInterface;
