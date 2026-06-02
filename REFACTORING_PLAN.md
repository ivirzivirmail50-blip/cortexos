# Second Brain Refactoring Plan

## Executive Summary

This document outlines the refactoring plan for two major improvement areas:
1. **UI/UX Modernization** - Create a polished, modern interface
2. **Model Differentiation** - Make different AI models produce distinctly different outputs

---

## 1. UI/UX Improvement Plan

### Current Issues
- Heavy use of inline styles instead of Tailwind classes
- Inconsistent component usage (UI components exist but aren't used everywhere)
- Missing modern design elements: animations, gradients, glassmorphism effects
- Chat interface looks basic and dated
- No visual feedback for loading states, transitions, or interactions

### Implementation Steps

#### Phase 1A: Enhance Global Styles (`globals.css`)
- Add modern CSS variables for gradients, shadows, glass effects
- Add animation keyframes (fade-in, slide-up, pulse, glow)
- Improve scrollbar styling
- Add utility classes for glassmorphism, gradients

#### Phase 1B: Update Layout Components
- Refresh sidebar with better spacing, hover effects, and visual hierarchy
- Add subtle background patterns/gradients
- Improve mobile responsiveness

#### Phase 1C: Modernize Chat Interface (`agent-chat.tsx`)
- Use proper message bubbles with avatar icons
- Add typing indicators with animation
- Implement smooth transitions
- Add agent-specific visual theming (using persona colors)
- Better empty state with suggestions

#### Phase 1D: Dashboard Page Enhancement
- Add welcome card with gradient
- Improve stats cards with icons and better typography
- Add quick-action buttons with hover effects
- Better agent grid with hover animations

#### Phase 1E: Settings Page Polish
- Better provider selection cards
- Model selector with badges
- Visual feedback for saved state

---

## 2. Model Differentiation Plan

### Current Issues
**CRITICAL**: The `prompt-builder.ts` system exists but is NOT USED by any agent!
- `planner-agent.ts` has hardcoded generic prompt
- `writer-agent.ts` has hardcoded generic prompt  
- `researcher-agent.ts` has hardcoded generic prompt
- Other agents same issue

The `personas.ts` and `model-flavors.ts` files are well-designed but completely unused!

### Root Cause
Agents call `createLLM()` directly with inline system prompts instead of using `buildSystemPrompt()` from `prompt-builder.ts`.

### Implementation Steps

#### Phase 2A: Create Agent Prompt Registry
Create a new file `packages/ai-core/src/config/agent-prompts.ts` that:
- Exports structured prompt templates for each agent type
- Includes specific formatting instructions per agent
- Defines output expectations clearly

#### Phase 2B: Refactor Agent Files to Use Prompt Builder
Update each agent to:
1. Import `buildSystemPrompt` and `getTemperatureForModel`
2. Accept `model` parameter from config
3. Build system prompt using the persona + flavor system
4. Use temperature based on model+agent combination

Files to update:
- `planner-agent.ts`
- `writer-agent.ts`
- `researcher-agent.ts`
- `coder-agent.ts`
- `summarizer-agent.ts`
- `analyst-agent.ts`
- `multi-agent.ts`

#### Phase 2C: Enhance Persona Prompts
Improve `personas.ts` with:
- More distinctive personality descriptions
- Specific formatting preferences per agent
- Example output patterns
- Clear "do/don't" guidelines

#### Phase 2D: Enhance Model Flavors
Improve `model-flavors.ts` with:
- More distinctive tone directives
- Model-specific formatting hints
- Better temperature differentiation

#### Phase 2E: API Integration
Update API routes to:
- Pass current model selection to agent functions
- Return debug info showing which persona+flavor was used

---

## File Structure After Refactoring

```
packages/ai-core/src/
├── config/
│   ├── llm.ts              # Provider configs (existing)
│   ├── personas.ts         # Agent personalities (existing, enhance)
│   ├── model-flavors.ts    # Model-specific tones (existing, enhance)
│   ├── prompt-builder.ts   # Prompt combiner (existing, now actually used!)
│   └── agent-prompts.ts    # NEW: Agent-specific prompt templates
├── agents/
│   ├── planner-agent.ts    # Refactored to use prompt builder
│   ├── writer-agent.ts     # Refactored to use prompt builder
│   ├── researcher-agent.ts # Refactored to use prompt builder
│   ├── coder-agent.ts      # Refactored to use prompt builder
│   ├── summarizer-agent.ts # Refactored to use prompt builder
│   ├── analyst-agent.ts    # Refactored to use prompt builder
│   └── multi-agent.ts      # Refactored to use prompt builder
```

---

## Expected Outcomes

### UI/UX
- ✨ Modern, polished interface with smooth animations
- 🎨 Consistent visual language with gradients and glass effects
- 💬 Beautiful chat interface with agent-specific theming
- 📱 Better responsive design

### Model Differentiation
- 🎯 Each agent has a distinct, recognizable personality
- 🔄 Switching models produces noticeably different output styles
- 🌡️ Temperature and tone properly adjusted per model+agent combo
- 📊 Debug info shows which persona+flavor is active

---

## Implementation Order

1. **Phase 2A-B**: Fix the prompt system first (highest impact, foundational)
2. **Phase 1A**: Enhanced global styles (enables all UI improvements)
3. **Phase 1B-D**: UI component updates (visible improvements)
4. **Phase 2C-E**: Fine-tune prompts and integration
5. **Testing & Polish**: Verify changes work correctly

---

## Notes

- All changes maintain backward compatibility
- Turkish language support preserved throughout
- No breaking changes to API contracts
- Existing .env.local configuration continues to work
