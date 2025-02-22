from openai import AzureOpenAI

# Set up environment variables or default values
endpoint = "https://sanchar-aoai-eastus.openai.azure.com"
deployment = "gpt-4o-mini-phack"
subscription_key = "2b1e15adc48d44eebc663af4ff7ebd2c"

# Initialize Azure OpenAI Service client with key-based authentication
client = AzureOpenAI(
    azure_endpoint=endpoint,
    api_key=subscription_key,
    api_version="2024-05-01-preview",
)

# Prepare the chat prompt
chat_prompt = [
    {
        "role": "system",
        "content": [
            {
                "type": "text",
                "text": "You are an AI assistant that helps people find information.",
            }
        ],
    }
]

# Generate the completion
completion = client.chat.completions.create(
    model=deployment,
    messages=chat_prompt,
    max_tokens=800,
    temperature=0.7,
    top_p=0.95,
    frequency_penalty=0,
    presence_penalty=0,
    stop=None,
    stream=False,
)

# Print the result
print(completion.to_json())
