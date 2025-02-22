// src/services/codeRunner.js

// Function to safely execute code with custom input
export const executeCode = async (code, input, language) => {
  // In a real implementation, this would make an API call to a backend service
  // For the hackathon, you'd want to integrate with your backend that can run code safely
  
  try {
    const response = await fetch('your-backend-url/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        input,
        language
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: 'Failed to execute code. Please try again.'
    };
  }
};

// Function to run test cases
export const runTestCases = async (code, testCases, language) => {
  // In a real implementation, this would batch test all cases
  try {
    const response = await fetch('your-backend-url/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        testCases,
        language
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: 'Failed to run test cases. Please try again.'
    };
  }
};