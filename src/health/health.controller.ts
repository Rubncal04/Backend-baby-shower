import { Controller, Get } from '@nestjs/common';

/** Returns a minimal response so the client can wake up the server before any real request. */
@Controller('health')
export class HealthController {
  @Get()
  ping() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
