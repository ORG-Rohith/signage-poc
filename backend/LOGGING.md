# Backend Logging Guide

## Overview

The backend now includes comprehensive structured logging across all major components to help you understand what's happening in the system. All logging uses NestJS's built-in `Logger` service.

## Log Levels

The application supports the following log levels:

- **`error`** - Only errors and critical failures
- **`warn`** - Warnings about unexpected conditions  
- **`log`** - General operational logs (default)
- **`debug`** - Detailed debugging information

## Configuration

### Setting Log Level via Environment Variable

You can control which log levels are displayed by setting the `LOG_LEVEL` environment variable:

```bash
# Development - show all logs
LOG_LEVEL=debug,log,warn,error npm run start:dev

# Production - only warnings and errors
LOG_LEVEL=warn,error npm run start:prod

# Only informational and error logs
LOG_LEVEL=log,error npm run start
```

### Default Log Levels

If `LOG_LEVEL` is not set, the application defaults to: `debug,log,warn,error`

## What Gets Logged

### Bootstrap (main.ts)
```
[Bootstrap] Application is starting on port 3001
[Bootstrap] Server listening on port 3001
[Bootstrap] Environment: development
[Bootstrap] Log level: debug,log,warn,error
```

### File Management (FileService)
```
[FileService] Saving file: document.pdf to folder 1
[FileService] File saved successfully with ID: 42
[FileService] Found 5 files in folder 1
[FileService] File with ID 42 (document.pdf) deleted successfully
```

### Screen Management (ScreenService)
```
[ScreenService] Creating new screen
[ScreenService] Screen created successfully - ID: 1, Code: SCR-A1B2C3
[ScreenService] Retrieved 5 screens
[ScreenService] Verifying screen code: SCR-A1B2C3 for folder: 2
[ScreenService] Screen SCR-A1B2C3 verified and assigned - File: presentation.pdf
```

### Folder Management (FolderService)
```
[FolderService] Creating folder with name: Marketing
[FolderService] Fetching all folders
```

### WebSocket Connections (FileGateway & ScreenGateway)
```
[FileGateway] WebSocket (FileGateway) initialized
[FileGateway] Client connected: socket_id_123, Total connected: 1
[FileGateway] Client abc123 joined folder 5
[FileGateway] Broadcasting fileAdded event to folder 5: {...}
[FileGateway] Client disconnected: socket_id_123, Total connected: 0

[ScreenGateway] Client connected: socket_id_456, Total connected: 1
[ScreenGateway] Client xyz789 joined screen 2
[ScreenGateway] Broadcasting screenUpdated event to screen 2: {...}
```

## Log Entry Format

Each log entry follows this format:
```
[Context] Timestamp Message
```

Where:
- **Context** - The service or class name
- **Timestamp** - Automatically added by NestJS
- **Message** - The actual log message

## Docker Usage

When running in Docker, logs are printed to stdout and can be viewed with:

```bash
# View logs from container
docker logs <container_id>

# Follow logs in real-time
docker logs -f <container_id>

# View logs with timestamps
docker logs --timestamps <container_id>
```

## Environment Variables Reference

```bash
# Server Configuration
PORT=3001                                    # Server port (default: 3001)
NODE_ENV=development                        # Environment (development/production)
LOG_LEVEL=debug,log,warn,error              # Comma-separated log levels
```

## Example Usage

### Development Mode with All Logs
```bash
export NODE_ENV=development
export LOG_LEVEL=debug,log,warn,error
npm run start:dev
```

### Production Mode - Minimal Logging
```bash
export NODE_ENV=production
export LOG_LEVEL=error,warn
npm run start:prod
```

### Debug Specific Feature
To debug a specific feature, run with debug logging:
```bash
LOG_LEVEL=debug npm run start:dev
```

## Best Practices

1. **Use appropriate log levels:**
   - `debug`: Detailed execution flow (variable values, loop iterations)
   - `log`: Important events (file saved, screen created, etc.)
   - `warn`: Unexpected but recoverable situations
   - `error`: Errors that require attention

2. **Include relevant context:**
   - User/entity IDs
   - Operation results
   - Timing information

3. **Avoid logging sensitive data:**
   - Don't log passwords or API keys
   - Don't log PII unless necessary

## Adding Logs to New Services

To add logging to a new service:

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MyService {
  private logger = new Logger('MyService');

  myMethod() {
    this.logger.log('Operation started');
    this.logger.debug('Detailed info here');
    this.logger.warn('Something unexpected');
    this.logger.error('An error occurred');
  }
}
```

## Troubleshooting

### Logs not appearing?
1. Check the `LOG_LEVEL` environment variable
2. Ensure the log level includes the type you're looking for
3. Restart the application after changing `LOG_LEVEL`

### Too many logs?
- Set `LOG_LEVEL=error,warn` for minimal logging
- Use `LOG_LEVEL=log,error` for production

### Need to find a specific issue?
- Set `LOG_LEVEL=debug` to see all logs
- Use `grep` to filter logs: `docker logs <container> | grep "ScreenService"`
