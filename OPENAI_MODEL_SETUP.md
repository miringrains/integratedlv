# OpenAI Model Setup Guide

## GPT-5.1 Availability

GPT-5.1 was released on November 12, 2025, but **API access may not be available to all accounts yet**. The model is being rolled out gradually.

### How to Enable GPT-5.1 (if available)

1. **Check API Access**:
   - Go to https://platform.openai.com/models
   - Look for `gpt-5.1` in the list of available models
   - If it's not listed, it's not available for your account yet

2. **Enable in OpenAI Dashboard** (if option exists):
   - Go to https://platform.openai.com/settings/organization
   - Check "Model Access" or "Beta Features" section
   - Enable GPT-5.1 if available

3. **Check API Key Permissions**:
   - Ensure your API key has access to newer models
   - Some models require specific API access tiers

### Current Model Fallback Chain

The code automatically tries models in this order:

1. `gpt-5.1` - Latest model (Nov 2025) - **May not be available yet**
2. `gpt-5` - GPT-5 (Aug 2025) - **May not be available yet**
3. `gpt-4o` - GPT-4 Optimized - **Most reliable, widely available** ✅
4. `gpt-4-turbo` - GPT-4 Turbo fallback ✅
5. `gpt-4` - GPT-4 base (final fallback) ✅

### What You'll See in Logs

If GPT-5.1 is not available, you'll see:
```
⚠️ Model gpt-5.1 not available in your OpenAI account, trying next model...
⚠️ Model gpt-5 not available in your OpenAI account, trying next model...
✅ Successfully used OpenAI model: gpt-4o
```

This is **normal and expected** - the code will automatically use the best available model.

### Recommended Action

**No action needed** - The code will automatically fallback to `gpt-4o` which is:
- ✅ Widely available
- ✅ High quality
- ✅ Reliable
- ✅ Cost-effective

### If You Want to Force a Specific Model

You can modify `src/lib/openai.ts` and change the `models` array:

```typescript
// Use only GPT-4o (most reliable)
const models = ['gpt-4o']

// Or try GPT-5.1 first, then GPT-4o
const models = ['gpt-5.1', 'gpt-4o']
```

### Checking Available Models via API

You can check which models are available to your account:

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" | grep '"id"' | grep 'gpt'
```

Look for models like:
- `gpt-5.1` (if available)
- `gpt-5` (if available)
- `gpt-4o` (should be available)
- `gpt-4-turbo` (should be available)

## Summary

**The feature works perfectly with GPT-4o** - you don't need GPT-5.1 for ticket summaries to work. The fallback chain ensures the best available model is used automatically.

