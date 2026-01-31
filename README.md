# nowmcp

A Model Context Protocol (MCP) server for ServiceNow integration, enabling AI assistants to interact with ServiceNow instances through a well-defined API.

## Overview

This MCP server provides AI assistants (Claude Desktop, Claude Code for VSCode, Claude CLI) with the ability to read, write, and query data from ServiceNow instances. Built with TypeScript and the MCP SDK, it supports multiple instances and provides table-specific tools for common ServiceNow operations.

## Quick Start

### Prerequisites
- Node.js (v18 or later)
- Access to a ServiceNow instance
- Service account credentials for ServiceNow

### Installation

1. **Clone and install**:
```bash
git clone <repository-url>
cd nowmcp
npm install
```

2. **Configure environment variables**:
```bash
cp .env.example .env
# Edit .env with your ServiceNow instance details
```

3. **Build the project**:
```bash
npm run build
```

### Configure with Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "servicenow": {
      "command": "node",
      "args": ["/absolute/path/to/nowmcp/build/index.js"],
      "env": {
        "SERVICENOW_INSTANCE_URL": "https://your-instance.service-now.com",
        "SERVICENOW_USERNAME": "your_username",
        "SERVICENOW_PASSWORD": "your_password"
      }
    }
  }
}
```

Restart Claude Desktop, and you should see ServiceNow tools available!

## ⚠️ Testing Status

**This project has NOT yet been tested against a live ServiceNow instance.**

The implementation is based on ServiceNow REST API documentation and follows standard patterns, but has not been validated with actual ServiceNow credentials or data. Testing with a ServiceNow instance is needed before production use.

**Completed Features (Untested):**
- ✅ Multi-instance configuration
- ✅ ServiceNow REST API client with Basic Auth
- ✅ Simplified query builder
- ✅ Incident management tools (query, get, create, update, delete)
- ✅ Connection testing utility

**What's Needed:**
- Access to a ServiceNow instance (developer instance or sandbox)
- Service account credentials
- Validation of all incident operations
- Error handling verification

## Design Philosophy

**Table-Specific Tools**: We provide dedicated tools for each ServiceNow table type (Incidents, RITMs, SC-Tasks, etc.) rather than generic tools. This approach:
- Eliminates the need for users to know ServiceNow's data model
- Provides clear, intuitive tool names and descriptions
- Includes table-specific fields and validation
- Makes it easier for AI assistants to understand available operations

**Simplified Query Builder**: Uses a user-friendly query syntax instead of raw ServiceNow encoded queries, making it accessible to non-ServiceNow experts.

## Features

### Core Capabilities
- ✅ Multi-instance support (dev, test, prod environments)
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Service account authentication
- ✅ Simplified query builder for filtering records
- ✅ Support for multiple ServiceNow table types
- ✅ Environment-based configuration (.env support)

### Supported ServiceNow Tables
1. **Incidents (INC)** - `incident` table
2. **Requested Items (RITM)** - `sc_req_item` table
3. **Service Catalog Tasks (SC-Task)** - `sc_task` table
4. **Variable Item Tasks (VIT)** - ServiceNow variable sets
5. **IPTs** - Integration/Process Tasks
6. **Extensible**: Easy to add support for additional tables

## Architecture

```
┌─────────────────────────────────────┐
│   Claude Client                     │
│   (Desktop/VSCode/CLI)              │
└──────────────┬──────────────────────┘
               │ MCP Protocol
┌──────────────▼──────────────────────┐
│   nowmcp Server                     │
│   ┌─────────────────────────────┐   │
│   │  Table-Specific Tools       │   │
│   │  - incident_query           │   │
│   │  - incident_create          │   │
│   │  - ritm_query               │   │
│   │  - sc_task_update           │   │
│   │  etc...                     │   │
│   └─────────────┬───────────────┘   │
│                 │                   │
│   ┌─────────────▼───────────────┐   │
│   │  ServiceNow API Client      │   │
│   │  - Authentication           │   │
│   │  - Query Builder            │   │
│   │  - Error Handling           │   │
│   └─────────────┬───────────────┘   │
└─────────────────┼───────────────────┘
                  │ HTTPS/REST
┌─────────────────▼───────────────────┐
│   ServiceNow Instance(s)            │
│   - dev.service-now.com             │
│   - test.service-now.com            │
│   - prod.service-now.com            │
└─────────────────────────────────────┘
```

## MCP Tools

### Currently Implemented ✅

#### Incident Management (Phase 3)
- ✅ `incident_query` - Query incidents with filters
- ✅ `incident_get` - Get specific incident by number or sys_id
- ✅ `incident_create` - Create a new incident
- ✅ `incident_update` - Update an existing incident
- ✅ `incident_delete` - Delete an incident (if permissions allow)

#### Generic Tools
- ✅ `servicenow_test_connection` - Test connection to ServiceNow instance
- ✅ `servicenow_query` - Query any table by name (advanced users)

### Planned (Not Yet Implemented) 📋

#### Requested Items (RITM) - Phase 4
- `ritm_query` - Query requested items
- `ritm_get` - Get specific RITM
- `ritm_update` - Update RITM status/fields
- `ritm_create` - Create new RITM

#### Service Catalog Tasks - Phase 5
- `sc_task_query` - Query catalog tasks
- `sc_task_get` - Get specific task
- `sc_task_update` - Update task
- `sc_task_create` - Create new task

#### Variable Item Tasks (VIT) - Phase 6
- `vit_query` - Query variable item tasks
- `vit_get` - Get specific VIT
- `vit_update` - Update VIT

#### IPT (Integration Process Tasks) - Phase 6
- `ipt_query` - Query IPTs
- `ipt_get` - Get specific IPT
- `ipt_update` - Update IPT

## Configuration

### Environment Variables

```env
# Primary Instance
SERVICENOW_INSTANCE_URL=https://dev12345.service-now.com
SERVICENOW_USERNAME=service_account_user
SERVICENOW_PASSWORD=service_account_password

# Optional: Multiple Instances
SERVICENOW_DEV_URL=https://dev12345.service-now.com
SERVICENOW_DEV_USERNAME=dev_user
SERVICENOW_DEV_PASSWORD=dev_pass

SERVICENOW_TEST_URL=https://test12345.service-now.com
SERVICENOW_TEST_USERNAME=test_user
SERVICENOW_TEST_PASSWORD=test_pass

SERVICENOW_PROD_URL=https://prod12345.service-now.com
SERVICENOW_PROD_USERNAME=prod_user
SERVICENOW_PROD_PASSWORD=prod_pass

# Default instance to use (dev, test, prod, or primary)
SERVICENOW_DEFAULT_INSTANCE=dev
```

### MCP Client Configuration

#### Claude Desktop
Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "servicenow": {
      "command": "node",
      "args": ["/path/to/nowmcp/build/index.js"],
      "env": {
        "SERVICENOW_INSTANCE_URL": "https://dev12345.service-now.com",
        "SERVICENOW_USERNAME": "your_username",
        "SERVICENOW_PASSWORD": "your_password"
      }
    }
  }
}
```

#### Claude Code (VSCode)
Add to VSCode settings or `.claude/config.json`:
```json
{
  "mcpServers": {
    "servicenow": {
      "command": "node",
      "args": ["/path/to/nowmcp/build/index.js"]
    }
  }
}
```

## Implementation Roadmap

### Phase 1: Foundation ✅ COMPLETE
- [x] Project setup (TypeScript, MCP SDK, dependencies)
- [x] Basic project structure
- [x] Configuration management (.env support)
- [x] ServiceNow API client base class
- [x] Authentication implementation (Basic Auth)
- [x] Connection testing utilities

### Phase 2: Core API Client ✅ COMPLETE
- [x] Table API wrapper (GET, POST, PUT, DELETE)
- [x] Simplified query builder
- [x] Response parsing and error handling
- [x] Multi-instance support
- [x] Request logging and debugging

### Phase 3: Incident Management Tools ✅ COMPLETE (NOT YET TESTED)
- [x] incident_query implementation
- [x] incident_get implementation
- [x] incident_create implementation
- [x] incident_update implementation
- [x] incident_delete implementation
- [ ] Tool testing and validation (requires ServiceNow instance)

### Phase 4: RITM Tools
- [ ] ritm_query implementation
- [ ] ritm_get implementation
- [ ] ritm_update implementation
- [ ] ritm_create implementation

### Phase 5: Service Catalog Task Tools
- [ ] sc_task_query implementation
- [ ] sc_task_get implementation
- [ ] sc_task_update implementation
- [ ] sc_task_create implementation

### Phase 6: VIT & IPT Tools
- [ ] vit_query, vit_get, vit_update implementation
- [ ] ipt_query, ipt_get, ipt_update implementation

### Phase 7: Generic Tools & Polish
- [ ] Generic query/get/create/update tools
- [ ] Comprehensive error handling
- [ ] Documentation and examples
- [ ] Testing with actual ServiceNow instance
- [ ] Performance optimization

### Phase 8: Advanced Features (Future)
- [ ] OAuth 2.0 support
- [ ] Attachment handling
- [ ] Batch operations
- [ ] ServiceNow GlideRecord-like query syntax
- [ ] Custom table support via configuration

## Development Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Development mode with watch
npm run dev

# Run tests (when implemented)
npm test
```

## Query Syntax Examples

The simplified query builder translates user-friendly syntax to ServiceNow queries:

```javascript
// Simple equality
{ state: "New", priority: "1" }
// → state=New^priority=1

// Comparisons
{ priority: { operator: "<=", value: "3" } }
// → priority<=3

// Date ranges
{ created: { operator: ">=", value: "2024-01-01" } }
// → sys_created_on>=2024-01-01

// Contains/Search
{ short_description: { operator: "CONTAINS", value: "network" } }
// → short_descriptionLIKEnetwork
```

## Usage Examples

### Query Recent High-Priority Incidents
```
Use the incident_query tool to find all Priority 1 incidents created in the last 7 days that are still open
```

### Create a New Incident
```
Create an incident with short description "Database connection timeout", description "Users unable to access application due to DB timeout errors", priority 2, urgency 2
```

### Update RITM Status
```
Update RITM12345 to set state to "Work in Progress" and add work notes "Starting provisioning process"
```

## API Reference

Based on ServiceNow REST API documentation:
- [Table API](https://docs.servicenow.com/bundle/vancouver-api-reference/page/integrate/inbound-rest/concept/c_TableAPI.html)
- [ServiceNow Query Parameters](https://docs.servicenow.com/bundle/vancouver-api-reference/page/integrate/inbound-rest/concept/c_TableAPI.html#table-GET)
- [Encoded Queries](https://docs.servicenow.com/bundle/vancouver-application-development/page/script/server-scripting/concept/c_EncodedQueryStrings.html)

## Documentation

- [API Verification Guide](docs/API_VERIFICATION.md) - Testing the API implementation
- [Validation Improvements](docs/validation-improvements.md) - Input validation with Zod
- [Chat Histories](docs/chat-histories/) - Development conversation records

## Contributing

This is currently a personal project. Contributions, suggestions, and feedback welcome!

## License

TBD

## Acknowledgments

Built with:
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol)
- ServiceNow REST API
- TypeScript & Node.js
- Zod for runtime validation
