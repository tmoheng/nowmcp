# Input Validation & AI Usability Improvements

## Summary

We've implemented comprehensive Zod-based input validation and significantly improved the MCP server's usability for AI models.

## What Was Implemented

### 1. Zod Validation Schemas ✅

Created robust validation schemas in `src/schemas/`:

- **incident-schemas.ts**: Validates all incident tool inputs with proper type checking
- **config-schemas.ts**: Validates environment variables and configuration at startup

### 2. Smart Human-Readable Value Conversion ✅

AI models can now use **either numeric codes OR human-readable values**:

```javascript
// Both of these work!
{ "state": "In Progress", "priority": "Critical" }
{ "state": "2", "priority": "1" }
```

**Automatic conversion for:**
- **State**: "New" → "1", "In Progress" → "2", "Resolved" → "6", etc.
- **Priority**: "Critical" → "1", "High" → "2", "Moderate" → "3", etc.
- **Urgency/Impact**: "High" → "1", "Medium" → "2", "Low" → "3"

This makes it MUCH easier for AI models to use the tools intuitively!

### 3. Enhanced Tool Descriptions with Examples ✅

Every tool now includes:
- **Concrete usage examples** in the description
- **Clear enum values** in the schema
- **Common field names** suggestions
- **Better context** about what each field means

**Before:**
```json
{
  "description": "Query ServiceNow incidents with optional filters."
}
```

**After:**
```json
{
  "description": "Query ServiceNow incidents with optional filters. EXAMPLES: Find all new critical incidents: {\"filter\": {\"state\": \"New\", \"priority\": \"Critical\"}}. Find incidents assigned to a user: {\"filter\": {\"assigned_to\": \"john.doe\"}}."
}
```

### 4. Input Schema Enums ✅

All state/priority/urgency fields now have explicit enums in their schemas:

```json
{
  "state": {
    "type": "string",
    "enum": ["1", "2", "3", "6", "7", "8", "New", "In Progress", "On Hold", "Resolved", "Closed", "Canceled"],
    "description": "State: Use either \"New\"/\"1\", \"In Progress\"/\"2\", ..."
  }
}
```

This helps AI models:
- Know **exactly what values are valid**
- See **both numeric and human-readable options**
- Understand the **relationship between codes and meanings**

### 5. Better Error Messages ✅

Validation errors are now user-friendly:

**Before:**
```
Error: Invalid input
```

**After:**
```
Validation Error:
  - short_description: String must contain at least 1 character(s)
  - priority: Invalid enum value. Expected '1' | '2' | '3' | '4' | '5' | 'Critical' | 'High' | 'Moderate' | 'Low' | 'Planning'
```

### 6. Configuration Validation ✅

Environment variables are now validated at startup:
- URLs must be valid HTTPS URLs
- Trailing slashes are automatically removed
- Missing credentials provide clear error messages
- Invalid instance names are caught immediately

## Files Modified

### New Files Created:
- [src/schemas/incident-schemas.ts](../src/schemas/incident-schemas.ts) - Tool input validation
- [src/schemas/config-schemas.ts](../src/schemas/config-schemas.ts) - Config validation
- [docs/validation-improvements.md](validation-improvements.md) - This file

### Files Modified:
- [src/tools/incident-tools.ts](../src/tools/incident-tools.ts)
  - Added Zod validation to all functions
  - Replaced `any` types with proper typed interfaces
  - Improved tool descriptions with examples and enums

- [src/config/index.ts](../src/config/index.ts)
  - Added Zod validation for environment variables
  - Better error messages for configuration issues

## AI Model Usability Improvements

### Before These Changes:
❌ Models had to remember numeric codes (state "2" = In Progress)
❌ No validation until API call (wasted time/tokens)
❌ Vague error messages
❌ No examples in tool descriptions
❌ No guidance on valid field values

### After These Changes:
✅ Models can use intuitive values ("In Progress" instead of "2")
✅ Immediate validation with helpful error messages
✅ Clear examples in every tool description
✅ Explicit enums showing all valid options
✅ Better field descriptions with common values

## Usage Examples

### Creating an Incident (AI Model Perspective)

**Old way (confusing):**
```json
{
  "short_description": "Server down",
  "priority": "1",     // What does 1 mean?
  "urgency": "1",
  "state": "2"         // And 2?
}
```

**New way (intuitive):**
```json
{
  "short_description": "Server down",
  "priority": "Critical",  // Clear!
  "urgency": "High",
  "state": "In Progress"
}
```

Both work! But the new way is much more intuitive for AI models.

### Validation in Action

```javascript
// This will be caught immediately with a helpful error:
{
  "identifier": "",  // ❌ Empty string
  "state": "Working" // ❌ Invalid value
}

// Error message:
// Validation Error:
//   - identifier: String must contain at least 1 character(s)
//   - state: Invalid enum value. Expected '1' | '2' | ... | 'New' | 'In Progress' | ...
```

## Benefits for Production Use

1. **Fewer API Errors**: Validation happens before API calls
2. **Better Token Efficiency**: Models get it right the first time
3. **Improved User Experience**: Clear error messages
4. **Type Safety**: All inputs are properly typed
5. **Self-Documenting**: Examples in descriptions guide usage

## Next Steps (Recommendations)

While not implemented yet, consider:
- Add response formatting/parsing helpers
- Create "helper" tools for common operations (e.g., "get_open_critical_incidents")
- Add more comprehensive examples in a separate examples directory
- Add tests to verify validation logic
- Consider adding field autocomplete suggestions

## Testing the Improvements

Build the project:
```bash
npm run build
```

The validation will:
- Check environment variables at startup
- Validate all tool inputs before processing
- Provide helpful error messages for invalid inputs
- Accept both human-readable and numeric values
