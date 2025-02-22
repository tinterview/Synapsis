import os
from langchain.chat_models import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage
from pydantic import BaseModel, Field
from typing import Dict, List

# Set your OpenAI API key
os.environ["OPENAI_API_KEY"] = "your-openai-api-key"

# Define the AI Judge Evaluation Format
class InterviewEvaluation(BaseModel):
    correctness: float = Field(..., description="Score (0-10) for whether the code is correct.")
    efficiency: float = Field(..., description="Score (0-10) for time and space complexity.")
    readability: float = Field(..., description="Score (0-10) for clean, readable code.")
    approach: float = Field(..., description="Score (0-10) for logical problem-solving approach.")
    edge_cases: float = Field(..., description="Score (0-10) for handling edge cases.")
    clarity: float = Field(..., description="Score (0-10) for clear verbal explanations.")
    conciseness: float = Field(..., description="Score (0-10) for concise communication.")
    ai_interaction: int = Field(..., description="Number of times AI hints were used.")
    speed: float = Field(..., description="Score (0-10) based on time taken.")
    iterations: int = Field(..., description="Number of significant code revisions.")
    final_score: float = Field(..., description="Overall performance score (0-10).")
    feedback_summary: str = Field(..., description="Detailed performance review.")

# Initialize GPT-4 AI Model
llm = ChatOpenAI(model_name="gpt-4-turbo", temperature=0)

def evaluate_interview(leetcode_question: str, interview_transcript: str, candidate_solution: str) -> Dict:
    """Generates AI evaluation of the interview performance."""
    
    system_prompt = """
    You are an AI Judge evaluating a technical interview. 
    Your task is to analyze the candidate's problem-solving approach, coding efficiency, clarity of communication, 
    and ability to handle the problem under constraints.
    
    Provide structured scores from 0 to 10 for each category and a detailed feedback summary.
    """

    human_prompt = f"""
    ## LeetCode Question:
    {leetcode_question}

    ## Interview Transcript:
    {interview_transcript}

    ## Candidate's Final Code:
    {candidate_solution}

    ## Evaluation Criteria:
    - Correctness: Is the final code logically correct?
    - Efficiency: Is the solution optimized for time and space complexity?
    - Readability: Is the code clean, well-formatted, and easy to understand?
    - Approach: Did the candidate follow a structured problem-solving approach?
    - Edge Cases: Did they handle all edge cases properly?
    - Clarity: How well did they explain their thought process?
    - Conciseness: Were their explanations concise?
    - AI Interaction: How many AI hints did they use?
    - Speed: How quickly did they reach a working solution?
    - Iterations: How many times did they significantly change their approach?
    - Final Score: Overall performance rating.
    - Feedback Summary: A detailed analysis of strengths and weaknesses.

    ## Output Format:
    Return a JSON object following this schema:
    ```json
    {{
        "correctness": float,
        "efficiency": float,
        "readability": float,
        "approach": float,
        "edge_cases": float,
        "clarity": float,
        "conciseness": float,
        "ai_interaction": int,
        "speed": float,
        "iterations": int,
        "final_score": float,
        "feedback_summary": str
    }}
    ```
    """

    # Run LLM
    response = llm.predict_messages([
        SystemMessage(content=system_prompt),
        HumanMessage(content=human_prompt)
    ])

    # Convert to structured JSON
    evaluation = InterviewEvaluation.parse_raw(response.content)
    return evaluation.dict()

# Example Usage:
leetcode_question = "Given an integer n, return a string array where: ..."
interview_transcript = "Interviewer: How would you solve this? Candidate: I think I should use a loop..."
candidate_solution = "def fizzBuzz(n): return ['Fizz' if i%3==0 else 'Buzz' if i%5==0 else str(i) for i in range(1, n+1)]"

# Run evaluation
evaluation_results = evaluate_interview(leetcode_question, interview_transcript, candidate_solution)

# Print formatted results
from pprint import pprint
pprint(evaluation_results)
