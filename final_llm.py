from langchain_openai import AzureChatOpenAI  # Updated import
from langchain.schema import SystemMessage, HumanMessage
from pydantic import BaseModel, Field
from typing import Dict
from pprint import pprint


# Set your Azure OpenAI API environment variables
# os.environ["AZURE_OPENAI_ENDPOINT"] = "https://sanchar-aoai-eastus.openai.azure.com"  # Removed trailing slash
# os.environ["AZURE_OPENAI_KEY"] = "2b1e15adc48d44eebc663af4ff7ebd2c"
# os.environ["AZURE_OPENAI_DEPLOYMENT"] = "gpt-4o-mini-phack"
# os.environ["AZURE_API_VERSION"] = "2024-05-01-preview"
endpoint = "https://sanchar-aoai-eastus.openai.azure.com"
deployment = "gpt-4o-mini-phack"
subscription_key = "2b1e15adc48d44eebc663af4ff7ebd2c"
api_version = "2024-05-01-preview"


# Define structured evaluation format
class InterviewEvaluation(BaseModel):
    correctness: float = Field(
        ..., description="Score (0-10) for correctness of the solution."
    )
    efficiency: float = Field(
        ..., description="Score (0-10) for time and space complexity."
    )
    readability: float = Field(
        ..., description="Score (0-10) for code structure and clarity."
    )
    approach: float = Field(
        ..., description="Score (0-10) for the candidate's problem-solving approach."
    )
    edge_cases: float = Field(..., description="Score (0-10) for handling edge cases.")
    clarity: float = Field(
        ..., description="Score (0-10) for explaining their approach."
    )
    conciseness: float = Field(
        ..., description="Score (0-10) for clear and concise communication."
    )
    ai_interaction: int = Field(..., description="Number of AI hints used.")
    speed: float = Field(
        ..., description="Score (0-10) for speed in solving the problem."
    )
    iterations: int = Field(..., description="Number of major code revisions.")
    final_score: float = Field(..., description="Overall performance rating (0-10).")
    feedback_summary: str = Field(
        ..., description="Detailed review of the candidate's performance."
    )


# Initialize Azure OpenAI model
llm = AzureChatOpenAI(
    deployment_name=deployment,
    openai_api_key=subscription_key,
    azure_endpoint=endpoint,
    api_version=api_version,
)


def evaluate_interview(
    leetcode_question: str, interview_transcript: str, candidate_solution: str
) -> Dict:
    """Uses Azure OpenAI to evaluate the candidate's interview performance."""

    system_prompt = """
    You are an AI Judge evaluating a technical interview.
    Your job is to assess problem-solving skills, coding efficiency, clarity of communication,
    and ability to solve the problem efficiently.
    
    Provide structured scores from 0 to 10 and a detailed feedback summary.
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
    - Readability: Is the code clean and well-structured?
    - Approach: Did the candidate take a structured approach to solving the problem?
    - Edge Cases: Did they handle all edge cases properly?
    - Clarity: How well did they explain their thought process?
    - Conciseness: Were their explanations clear and to the point?
    - AI Interaction: How many AI hints did they require?
    - Speed: How fast did they solve the problem?
    - Iterations: How many times did they modify their approach?
    - Final Score: Overall performance rating.
    - Feedback Summary: Strengths, weaknesses, and areas for improvement.

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

    # Run the AI Judge on Azure OpenAI
    response = llm.invoke(
        [SystemMessage(content=system_prompt), HumanMessage(content=human_prompt)]
    )

    # Extract JSON from the response
    content = response.content
    # Remove markdown code block formatting if present
    if "```json" in content:
        content = content.split("```json")[1]
        content = content.split("```")[0]
    elif "```" in content:
        content = content.split("```")[1]
        content = content.split("```")[0]

    # Clean the content and parse it
    content = content.strip()
    evaluation = InterviewEvaluation.model_validate_json(
        content
    )  # Updated from parse_raw
    return evaluation.dict()


# Example Usage:
leetcode_question = "Given an integer n, return a string array where: ..."
interview_transcript = (
    "Interviewer: How would you solve this? Candidate: I think I should use a loop..."
)
candidate_solution = "def fizzBuzz(n): return ['Fizz' if i%3==0 else 'Buzz' if i%5==0 else str(i) for i in range(1, n+1)]"

# Run evaluation
evaluation_results = evaluate_interview(
    leetcode_question, interview_transcript, candidate_solution
)

pprint(evaluation_results)
