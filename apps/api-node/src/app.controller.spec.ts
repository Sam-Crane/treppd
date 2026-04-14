import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API metadata', () => {
      const result = appController.root();
      expect(result.name).toBe('treppd-api');
      expect(result.version).toBeDefined();
      expect(result.docs).toBe('/api/docs');
      expect(result.health).toBe('/health');
    });
  });

  describe('health', () => {
    it('should return status ok', () => {
      const result = appController.health();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('api-node');
      expect(result.timestamp).toBeDefined();
    });
  });
});
