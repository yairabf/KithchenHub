---
type: "agent_requested"
description: "Updates backend README.md based on latest changes"
---

# Update Backend Documentation Command

This command analyzes recent changes in the backend codebase and updates the `backend/README.md` file to reflect new features, modules, and API endpoints.

## When to Use

- After adding new modules or features to the backend
- After refactoring or restructuring backend code
- When API endpoints change or new ones are added
- After making significant architectural changes
- Periodically to keep documentation in sync with code

## Execution Steps

When this command is triggered, the AI agent should:

### 1. **Analyze Recent Changes**
   - Check git status for modified/new files in `backend/src/modules/`
   - Look at git diff for the last 10-20 commits in backend
   - Identify new modules, controllers, services, and DTOs
   - Note any structural changes to existing modules

### 2. **Scan Module Structure**
   - List all modules in `backend/src/modules/`
   - For each module, identify:
     - Controllers and their endpoints
     - Services and their responsibilities
     - DTOs for request/response validation
     - Any special features or capabilities

### 3. **Update README Sections**

   Update these sections in `backend/README.md`:

   **a. Features Section**
   - Add new features from recently added modules
   - Update existing feature descriptions if modified
   - Keep bullet points concise and clear

   **b. API Conventions Section**
   - Add new public/protected routes
   - Document new endpoint patterns
   - Update base URL examples if needed

   **c. Project Structure Section**
   - Add new modules with brief descriptions
   - Update module descriptions if responsibilities changed
   - Maintain the tree structure format
   - Example format:
     ```
     modules/
       module-name/            # Brief description of module
     ```

   **d. Environment Variables (if applicable)**
   - Add any new required environment variables
   - Document their purpose and example values

### 4. **Review and Validate**
   - Ensure README is accurate and up-to-date
   - Verify all new modules are documented
   - Check that removed modules are not listed
   - Maintain consistent formatting and style
   - Keep descriptions concise but informative

### 5. **Important Guidelines**
   - **Preserve existing content** unless it's outdated
   - **Be concise** - one line per module is usually enough
   - **Focus on what matters** to API consumers
   - **Don't duplicate** information that's in Swagger docs
   - **Keep it practical** - prioritize getting started info
   - **Maintain structure** - follow the existing README format

## Example Scenarios

### Scenario 1: New Import Module Added
```
Recent changes detected:
- New module: backend/src/modules/import/
- Controllers: ImportController with POST /import endpoint
- Services: ImportService handles guest mode data migration
- DTOs: ImportRequestDto, ImportResponseDto

Actions:
1. Add to Features: "- Data import from guest mode to household accounts"
2. Add to Project Structure:
   ```
   import/                    # Guest mode data import and deduplication
   ```
3. Add to API Conventions (if endpoint is public):
   - Document the endpoint pattern
```

### Scenario 2: Module Refactored
```
Recent changes detected:
- Shopping module restructured
- New endpoints added for bulk operations
- Search functionality enhanced

Actions:
1. Update shopping module description in Project Structure
2. Add note about bulk operations to Features
3. Keep existing structure, just enhance descriptions
```

### Scenario 3: Authentication Changes
```
Recent changes detected:
- New JWT refresh token rotation
- Added offline sync endpoint
- Updated auth guards

Actions:
1. Update Features section: "- JWT auth with Google sign-in, guest login, token refresh, and offline sync"
2. Update API Conventions with new /auth/sync endpoint if applicable
3. Add any new environment variables for JWT configuration
```

## Output Format

After updating the README:
1. Show a summary of changes made
2. List the sections updated
3. Confirm the file was written successfully

Example output:
```
✅ Backend README.md updated successfully!

Changes made:
- Added Import module to Project Structure
- Updated Features section with data import capability
- Added household utilities to common section

Sections updated:
- Features (line 5-11)
- Project Structure (line 58-72)
```

## Notes

- This command should be **read-heavy** - understand what exists before changing
- Always maintain the **existing style and format**
- Focus on **developer-facing information** - what they need to use the API
- Don't document internal implementation details
- Keep it **high-level** - Swagger handles the detailed API docs
- **Test commands should not be changed** unless testing infrastructure changed
- **Environment variables** should only be added if they're required for new features
