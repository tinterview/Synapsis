import os
import json
from typing import Dict
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from langchain_openai import AzureChatOpenAI
from langchain.schema import SystemMessage, HumanMessage

# filepath: /home/noir/tinterview/tinterview/final_llm.py

load_dotenv()

# Azure OpenAI configuration
endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
subscription_key = os.getenv("AZURE_OPENAI_SUBSCRIPTION_KEY")
api_version = "2024-05-01-preview"

# Define metrics models
class ProblemSolving(BaseModel):
    decomposition_and_structuring: int = Field(..., description="Dissects problems systematically into smaller parts.")
    logical_progression_and_refinement: int = Field(..., description="Builds solutions step-by-step and refines them.")
    edge_case_consideration: int = Field(..., description="Considers boundary and corner cases.")

class CommunicationAndClarity(BaseModel):
    technical_explanation_depth: int = Field(..., description="Depth of technical explanations given.")
    conciseness_vs_verbosity: int = Field(..., description="Balance between being concise or overly verbose.")
    confidence_level: int = Field(..., description="Apparent confidence in communication.")

class EngagementAndAdaptability(BaseModel):
    interactivity_and_responsiveness: int = Field(..., description="Engagement with the interviewer and responsiveness.")
    flexibility_in_thinking: int = Field(..., description="Ability to adapt thinking when new ideas are presented.")

class StressHandling(BaseModel):
    hesitation_and_filler_words: int = Field(..., description="Usage of filler words (uh, um, like).")
    panic_vs_composure: int = Field(..., description="Overall composure or panic under stress.")

class MetaCognitiveAwareness(BaseModel):
    self_correction_frequency: int = Field(..., description="Frequency of self-correction.")
    debugging_thought_process: int = Field(..., description="Quality of debugging or critical thinking about own errors.")

class PerformanceVsExpectations(BaseModel):
    answer_speed_vs_quality: int = Field(..., description="Balance between speed of answers and their completeness.")
    completeness_of_answers: int = Field(..., description="How thorough and complete the answers are.")

class ConversationMetrics(BaseModel):
    problem_solving: ProblemSolving
    communication_and_clarity: CommunicationAndClarity
    engagement_and_adaptability: EngagementAndAdaptability
    stress_handling: StressHandling
    meta_cognitive_awareness: MetaCognitiveAwareness
    performance_vs_expectations: PerformanceVsExpectations

# Initialize the Azure OpenAI model
llm = AzureChatOpenAI(
    deployment_name=deployment,
    openai_api_key=subscription_key,
    azure_endpoint=endpoint,
    api_version=api_version,
)

def evaluate_conversation(conversation_file: str) -> Dict:
    """
    Reads a JSON file containing a list of [role, content] entries,
    where role is either 'user' or 'model', and returns a JSON
    with conversation metrics evaluated by the Azure OpenAI model.
    """
    with open(conversation_file, "r", encoding="utf-8") as f:
        conversation_history = json.load(f)

    # Build conversation text from history
    conversation_text = [
        f"{entry[0].upper()}: {entry[1]}" for entry in conversation_history
    ]

    system_prompt = """
You are an AI Judge tasked with analyzing a conversation for:
1. Problem Solving
2. Communication and Clarity
3. Engagement and Adaptability
4. Stress Handling
5. Meta Cognitive Awareness
6. Performance vs Expectations

Return a JSON object with these fields:
{
  "problem_solving": {
    "decomposition_and_structuring": 0,
    "logical_progression_and_refinement": 0,
    "edge_case_consideration": 0
  },
  "communication_and_clarity": {
    "technical_explanation_depth": 0,
    "conciseness_vs_verbosity": 0,
    "confidence_level": 0
  },
  "engagement_and_adaptability": {
    "interactivity_and_responsiveness": 0,
    "flexibility_in_thinking": 0
  },
  "stress_handling": {
    "hesitation_and_filler_words": 0,
    "panic_vs_composure": 0
  },
  "meta_cognitive_awareness": {
    "self_correction_frequency": 0,
    "debugging_thought_process": 0
  },
  "performance_vs_expectations": {
    "answer_speed_vs_quality": 0,
    "completeness_of_answers": 0
  }
}
""".strip()

    human_prompt = f"Conversation History:\n{chr(10).join(conversation_text)}"

    response = llm.invoke(
        [SystemMessage(content=system_prompt), HumanMessage(content=human_prompt)]
    )
    content = response.content

    # Remove potential markdown code fences, if present.
    for fence in ["```json", "```"]:
        if fence in content:
            content = content.split(fence)[1].split("```")[0]
            break

    metrics = ConversationMetrics.model_validate_json(content.strip())
    return metrics.model_dump()

def main():
    # Evaluate conversation and remove the source file if it exists.
    result = evaluate_conversation("responses.json")
    if os.path.exists("responses.json"):
        os.remove("responses.json")

    analysis_file = "interview_analysis.json"
    if os.path.exists(analysis_file):
        with open(analysis_file, "r", encoding="utf-8") as f:
            try:
                analysis_list = json.load(f)
                if not isinstance(analysis_list, list):
                    analysis_list = []
            except json.JSONDecodeError:
                analysis_list = []
    else:
        analysis_list = []

    # Prepend the new results and save.
    analysis_list.insert(0, result)
    with open(analysis_file, "w", encoding="utf-8") as f:
        json.dump(analysis_list, f, indent=2)

    print(result)

if __name__ == "__main__":
    main()