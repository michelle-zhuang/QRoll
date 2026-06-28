# Design Spec: Configure OpenRouter Free Models in Factory.ai Droid

This design document outlines the configuration changes required to add OpenRouter's free models to the custom models lists for the Factory.ai Droid CLI.

## Goal
Enable Droid CLI to use OpenRouter's free model tier (`nvidia/llama-nemotron-rerank-vl-1b-v2:free` and `cohere/north-mini-code:free`) while securely referencing the API key stored in macOS Keychain.

## Configuration Changes

### 1. Modern Configuration (`~/.factory/settings.json`)
The `customModels` array in `settings.json` will be updated to include the two new models.

```json
{
  "customModels": [
    {
      "model": "qwen/qwen3.6-35b-a3b",
      "id": "custom:Qwen-35B-(LM-Studio)-0",
      "index": 0,
      "baseUrl": "http://127.0.0.1:1234/v1",
      "apiKey": "lm-studio",
      "displayName": "Qwen 35B (LM Studio)",
      "maxOutputTokens": 8192,
      "noImageSupport": true,
      "provider": "generic-chat-completion-api"
    },
    {
      "model": "nvidia/llama-nemotron-rerank-vl-1b-v2:free",
      "id": "custom:Llama-Nemotron-Free-1",
      "index": 1,
      "baseUrl": "https://openrouter.ai/api/v1",
      "apiKey": "${OPENROUTER_API_KEY}",
      "displayName": "Llama Nemotron (OpenRouter Free)",
      "maxOutputTokens": 8192,
      "noImageSupport": true,
      "provider": "generic-chat-completion-api"
    },
    {
      "model": "cohere/north-mini-code:free",
      "id": "custom:Cohere-North-Mini-Free-2",
      "index": 2,
      "baseUrl": "https://openrouter.ai/api/v1",
      "apiKey": "${OPENROUTER_API_KEY}",
      "displayName": "Cohere North Mini Code (OpenRouter Free)",
      "maxOutputTokens": 8192,
      "noImageSupport": true,
      "provider": "generic-chat-completion-api"
    }
  ]
}
```

### 2. Legacy Configuration (`~/.factory/config.json`)
The `custom_models` array in `config.json` will be updated to match the new definitions in snake_case format.

```json
{
  "custom_models": [
    {
      "model_display_name": "Qwen 35B (LM Studio)",
      "model": "qwen/qwen3.6-35b-a3b",
      "base_url": "http://127.0.0.1:1234/v1",
      "api_key": "lm-studio",
      "provider": "generic-chat-completion-api",
      "max_tokens": 8192
    },
    {
      "model_display_name": "Llama Nemotron (OpenRouter Free)",
      "model": "nvidia/llama-nemotron-rerank-vl-1b-v2:free",
      "base_url": "https://openrouter.ai/api/v1",
      "api_key": "${OPENROUTER_API_KEY}",
      "provider": "generic-chat-completion-api",
      "max_tokens": 8192
    },
    {
      "model_display_name": "Cohere North Mini Code (OpenRouter Free)",
      "model": "cohere/north-mini-code:free",
      "base_url": "https://openrouter.ai/api/v1",
      "api_key": "${OPENROUTER_API_KEY}",
      "provider": "generic-chat-completion-api",
      "max_tokens": 8192
    }
  ]
}
```

### 3. API Key Integration
The configuration references `${OPENROUTER_API_KEY}`. The user should export this environment variable in their shell configuration (`~/.zshrc`) to load it directly from the macOS Keychain:

```bash
export OPENROUTER_API_KEY=$(security find-generic-password -w -s "OpenRouter API Key" -a "luo.richard@gmail.com")
```
