import { Controller, Get } from '@nestjs/common';

const API_VERSION = process.env.npm_package_version || '0.0.1';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      name: 'treppd-api',
      version: API_VERSION,
      docs: '/api/docs',
      health: '/health',
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'api-node',
      timestamp: new Date().toISOString(),
    };
  }
}
