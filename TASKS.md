# BitDash Firestudio Tasks

> **Note:** This file tracks the progress and upcoming tasks for the BitDash Firestudio project.

## SESSION MEMORY
### Current Session (2025-05-21)

**RECENT ACTIVITY:**
- Initialized project with Next.js and Firebase
- Set up basic authentication flow
- Configured Firestore database
- Added Tailwind CSS and Shadcn/ui

**IN PROGRESS:**
- Setting up project structure
- Implementing authentication
- Configuring Firebase services
- AI Integration and Optimization

**NEXT STEPS:**
- Create user profile pages
- Implement data fetching patterns
- Set up deployment pipeline

## Code Review & Improvement Tasks

### I. AI Backend (`src/ai/`)

#### `src/ai/genkit.ts`
1. **Model Evaluation & Selection**: Evaluate if `googleai/gemini-2.0-flash` is optimal; research alternatives.
2. **Plugin Configuration**: Explore and set advanced `googleAI()` plugin options.
3. **Environment-specific Configurations**: Externalize model names and sensitive settings.
4. **Error Handling/Logging**: Add robust error handling and logging around Genkit initialization.

#### `src/ai/flows/market-sentiment-analysis.ts`
1. **Robust Output Handling**: Replace `output!` with explicit checks and error handling.
2. **Structured Sentiment Output**: Change string-based sentiment outputs to structured objects.
3. **Prompt Engineering**: Experiment with few-shot examples and refine prompts.
4. **Enhanced Input Validation**: Add domain-specific validation for input prices.
5. **Flow Error Handling**: Implement explicit error handling.
6. **Testing**: Add unit and integration tests.
7. **Configurable Assets**: Make financial instruments configurable.
8. **Logging**: Add detailed logging for prompt inputs and outputs.

#### `src/ai/flows/report-financial-data-flow.ts`
1. **Prompt Robustness for Tool Usage**: Make tool usage more deterministic.
2. **Refine Tool Failure Handling**: Align prompt's tool failure instructions with actual flow error handling.
3. **Dynamic Date Formatting**: Ensure consistent date formatting.
4. **Explicit Tool Call & Error Handling**: Consider making tool calls explicit.
5. **Specific Fallback/Error Messages**: Provide more specific error messages.
6. **Tool Input/Output Schema Review**: Verify consistency between flow and tool schemas.

#### `src/ai/tools/get-financial-market-data-tool.ts`
1. **Implement Real Data Fetching**: Replace mock data with actual API calls.
2. **Robust Error Handling**: Implement comprehensive error handling.
3. **Retries & Timeouts**: Add retries and timeouts for external calls.
4. **API Key Management**: Securely manage API keys.
5. **Date Formatting Consistency**: Ensure output dates match schema.
6. **Unit Tests**: Test various scenarios.
7. **Update Comments**: Remove "mock data" comments once implemented.

### II. Frontend Components (`src/components/`)

#### `src/components/CorrelationPanel.tsx`
1. **Accessible Color Contrast**: Check contrast and add non-color indicators.
2. **Handle Empty Data**: Display message if `data` is empty.
3. **Correlation Value Presentation**: Add visual cues for positive/negative correlations.
4. **Unique Keys**: Use stable unique keys for list items.
5. **Magic Numbers**: Define correlation thresholds as named constants.
6. **Semantic HTML**: Use proper list elements.

#### `src/components/DashboardHeader.tsx`
1. **Implement Navigation**: Add actual navigation functionality.
2. **Active Navigation State**: Visually distinguish active link.
3. **Semantic Navigation**: Use proper navigation elements.
4. **ARIA Attributes**: Add proper accessibility attributes.
5. **Responsive Navigation**: Implement mobile-friendly menu.

#### `src/components/DataCard.tsx`
1. **Status Indicator Contrast**: Check color contrast.
2. **`aria-controls` Uniqueness**: Use `useId` for unique IDs.
3. **Height Animation**: Investigate more robust animation techniques.
4. **Error Message Customization**: Allow custom error messages.
5. **Configurable Initial State**: Add prop for `initialIsOpen`.

#### `src/components/ValueDisplay.tsx`
1. **Number Formatting**: Make formatting options configurable.
2. **Handle `null`/`undefined` Values**: Add proper fallbacks.

## Testing Strategy

### 1. Unit Testing
- [ ] Core data fetching and processing
- [ ] AI model output validation
- [ ] Component rendering and interactions
- [ ] Utility functions and helpers

### 2. Integration Testing
- [ ] Data flow between components
- [ ] API interaction handling
- [ ] State management
- [ ] Error scenarios and recovery

### 3. End-to-End Testing
- [ ] Critical user flows
- [ ] Data refresh scenarios
- [ ] Error handling and recovery
- [ ] Performance under load

## Deployment & Monitoring

### 1. Production Readiness
- [ ] Configure production environment variables
- [ ] Set up monitoring and alerting
- [ ] Implement logging and analytics
- [ ] Configure backup and recovery
- [ ] Document deployment procedures

### 2. Performance Monitoring
- [ ] Track API response times
- [ ] Monitor AI model performance
- [ ] Track user interactions
- [ ] Set up error tracking
- [ ] Implement usage analytics

## Commit Guidelines
1. **Type**: Use conventional commit types (feat, fix, docs, etc.)
2. **Scope**: Specify the area of changes (auth, ui, db, etc.)
3. **Message**: Clear, concise description of changes
4. **Body**: Detailed explanation (if needed)
5. **Footer**: Reference issues or breaking changes

Example:
```
feat(auth): add Google OAuth login

- Implement Google OAuth provider
- Add login/logout flows
- Update user session management

Closes #123
```
