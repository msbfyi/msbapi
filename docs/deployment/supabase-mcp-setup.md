# Supabase Model Context Protocol (MCP) Setup

This guide explains how to set up the Supabase Model Context Protocol (MCP) to
enable AI assistants like Claude to interact with your Supabase project.

## What is MCP?

The Model Context Protocol (MCP) is a standard for connecting Large Language
Models (LLMs) to platforms like Supabase. It allows AI assistants to:

- Query your Supabase database
- Interact with Supabase features
- Generate and execute SQL queries
- Understand your database schema

## Prerequisites

Before setting up MCP, ensure you have:

- A Supabase account with access to this project
- An MCP-compatible AI client (Claude Desktop, Cursor, etc.)
- Understanding of the security implications (see Security Considerations below)

## Installation Methods

### Option 1: Remote MCP Server (Recommended for Development)

The remote MCP server connects directly to your Supabase cloud platform.

#### For Claude Desktop

1. Open Claude Desktop settings
2. Navigate to MCP configuration
3. Add the Supabase MCP server:
   ```json
   {
     "mcpServers": {
       "supabase": {
         "command": "npx",
         "args": ["-y", "@supabase/mcp"]
       }
     }
   }
   ```
4. Restart Claude Desktop
5. When prompted, authenticate with your Supabase account
6. Select this project from the list
7. Choose appropriate feature groups to limit access

#### For Cursor

1. Open Cursor settings
2. Go to Features → MCP
3. Add Supabase as an MCP provider
4. Follow the authentication flow
5. Select this project

### Option 2: Local Postgres MCP Server

For more control or local Supabase instances:

1. Install the Postgres MCP server:

   ```bash
   npm install -g @modelcontextprotocol/server-postgres
   ```

2. Configure your MCP client with the connection string:

   ```json
   {
     "mcpServers": {
       "postgres": {
         "command": "mcp-server-postgres",
         "args": ["postgresql://postgres:[password]@localhost:54322/postgres"]
       }
     }
   }
   ```

3. Note: This runs queries as read-only transactions by default

## Configuration

### Limiting Access Scope

For security, limit MCP access to specific features:

1. **Project Selection**: Only connect to development/staging projects
2. **Feature Groups**: Limit to specific Supabase features:
   - Database (read-only recommended)
   - Storage
   - Auth
   - Edge Functions

3. **Database Branching**: Use Supabase database branches for MCP access:
   ```bash
   supabase branches create mcp-dev
   ```

### Authentication

MCP authentication is handled through:

1. Browser-based login to your Supabase account
2. Automatic permission granting
3. No need for personal access tokens

## Security Considerations

⚠️ **IMPORTANT**: Read these security guidelines before connecting MCP to your
project.

### Do NOT:

- ❌ Connect to production environments
- ❌ Share MCP access with customers or untrusted users
- ❌ Grant write permissions without review
- ❌ Auto-approve all AI-generated queries
- ❌ Connect to databases with sensitive customer data

### DO:

- ✅ Use development or staging environments only
- ✅ Enable read-only mode when possible
- ✅ Manually review AI-generated queries before execution
- ✅ Use database branching for MCP access
- ✅ Limit feature group access to minimum required
- ✅ Regularly audit MCP activity
- ✅ Understand prompt injection risks

### Potential Risks

1. **Prompt Injection Attacks**: Malicious prompts could attempt to access or
   modify data
2. **Unauthorized Data Access**: AI might query sensitive information
   unintentionally
3. **Data Modification**: Write operations should always be manually reviewed
4. **Schema Exposure**: AI can see your entire database schema

## Usage Examples

Once configured, you can ask your AI assistant to:

```
Show me the schema for the movies table
```

```
Query the 10 most recently watched movies
```

```
Generate a report of movies watched by year
```

```
Help me write a query to find movies with ratings above 4 stars
```

## Verification

To verify MCP is working correctly:

1. Ask your AI assistant: "Can you see my Supabase database?"
2. Request a simple query: "List the tables in my database"
3. Review the results to ensure proper access

## Troubleshooting

### MCP Not Connecting

- Restart your AI client
- Check Supabase authentication status
- Verify project selection in MCP settings
- Check console logs for error messages

### Permission Denied

- Verify your Supabase account has access to the project
- Check feature group permissions
- Ensure service role key is not required for your use case

### Queries Failing

- Verify database is online
- Check query syntax
- Ensure read-only mode is compatible with your query
- Review Supabase logs for errors

## Best Practices

1. **Start with Read-Only**: Begin with read-only access and expand only as
   needed
2. **Use Branches**: Create dedicated database branches for MCP experimentation
3. **Review All Queries**: Always review AI-generated queries before execution
4. **Document Changes**: Keep track of schema changes made through MCP
5. **Regular Audits**: Periodically review MCP access logs
6. **Limit Scope**: Only grant access to tables and features you need

## Additional Resources

- [Supabase MCP Documentation](https://supabase.com/docs/guides/getting-started/mcp)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)

## Project-Specific Notes

For this Personal API project:

- MCP is useful for exploring movie data and generating reports
- Consider using a separate development database for MCP access
- Review the database schema in [docs/database/schema.md](../database/schema.md)
- Keep TMDB API keys and sensitive credentials out of MCP scope

## Maintenance

- Review MCP access permissions quarterly
- Update MCP client versions regularly
- Audit AI-generated queries for security issues
- Document any schema changes made through MCP interactions
