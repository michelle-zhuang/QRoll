# OpenRouter Models Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add OpenRouter's free models to the custom models list in both the modern `settings.json` and legacy `config.json` configurations.

**Architecture:** Add new JSON objects to the custom model arrays in both config files, incrementing model indices where required.

**Tech Stack:** JSON, macOS Keychain, Shell scripting.

## Global Constraints

- Must update both `~/.factory/settings.json` and `~/.factory/config.json`.
- Must use `${OPENROUTER_API_KEY}` placeholder for the api_key/apiKey field.
- Must ensure JSON files remain valid after edits.

---

### Task 1: Update settings.json

**Files:**
- Modify: `/Users/richardluo/.factory/settings.json`

**Interfaces:**
- Consumes: None
- Produces: JSON containing Llama Nemotron and Cohere North Mini Code custom models

- [ ] **Step 1: Verify the file does not already contain OpenRouter models**

Run:
```bash
grep -i "openrouter" /Users/richardluo/.factory/settings.json
```
Expected output: Empty (exit code 1)

- [ ] **Step 2: Update settings.json with the new custom models**

Add the custom models to the `customModels` array in `/Users/richardluo/.factory/settings.json`. Ensure the array becomes:

```json
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
```

- [ ] **Step 3: Verify settings.json is valid JSON and contains the new models**

Run:
```bash
python3 -m json.tool /Users/richardluo/.factory/settings.json > /dev/null && grep -o "custom:Cohere-North-Mini-Free-2" /Users/richardluo/.factory/settings.json
```
Expected output:
```
custom:Cohere-North-Mini-Free-2
```

---

### Task 2: Update config.json

**Files:**
- Modify: `/Users/richardluo/.factory/config.json`

**Interfaces:**
- Consumes: None
- Produces: JSON containing Llama Nemotron and Cohere North Mini Code custom_models

- [ ] **Step 1: Verify the file does not already contain OpenRouter models**

Run:
```bash
grep -i "openrouter" /Users/richardluo/.factory/config.json
```
Expected output: Empty (exit code 1)

- [ ] **Step 2: Update config.json with the new custom models**

Add the custom models to the `custom_models` array in `/Users/richardluo/.factory/config.json`. Ensure the array becomes:

```json
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
```

- [ ] **Step 3: Verify config.json is valid JSON and contains the new models**

Run:
```bash
python3 -m json.tool /Users/richardluo/.factory/config.json > /dev/null && grep -o "Cohere North Mini Code" /Users/richardluo/.factory/config.json
```
Expected output:
```
Cohere North Mini Code
```
