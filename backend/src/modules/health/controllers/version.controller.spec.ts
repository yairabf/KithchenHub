import { Test, TestingModule } from '@nestjs/testing';
import { VersionController } from './version.controller';
import {
  CURRENT_API_VERSION,
  SUPPORTED_API_VERSIONS,
  DEPRECATED_API_VERSIONS,
  SUNSET_API_VERSIONS,
} from '../../../common/versioning/api-version.constants';

describe('VersionController', () => {
  let controller: VersionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VersionController],
    }).compile();

    controller = module.get<VersionController>(VersionController);
  });

  describe('getVersionInfo', () => {
    it('should return version information', () => {
      const result = controller.getVersionInfo();

      expect(result).toHaveProperty('current');
      expect(result).toHaveProperty('supported');
      expect(result).toHaveProperty('deprecated');
      expect(result).toHaveProperty('sunset');
      expect(result).toHaveProperty('docs');
    });

    it('should return current version', () => {
      const result = controller.getVersionInfo();
      expect(result.current).toBe(CURRENT_API_VERSION);
    });

    it('should return supported versions array', () => {
      const result = controller.getVersionInfo();
      expect(result.supported).toEqual([...SUPPORTED_API_VERSIONS]);
      expect(Array.isArray(result.supported)).toBe(true);
    });

    it('should return deprecated versions array', () => {
      const result = controller.getVersionInfo();
      expect(result.deprecated).toEqual([...DEPRECATED_API_VERSIONS]);
      expect(Array.isArray(result.deprecated)).toBe(true);
    });

    it('should return sunset versions array', () => {
      const result = controller.getVersionInfo();
      expect(result.sunset).toEqual([...SUNSET_API_VERSIONS]);
      expect(Array.isArray(result.sunset)).toBe(true);
    });

    it('should return docs object with v1 endpoint', () => {
      const result = controller.getVersionInfo();
      expect(result.docs).toHaveProperty('v1');
      expect(result.docs.v1).toBe('/api/docs/v1');
    });

    it('should include current version in supported versions', () => {
      const result = controller.getVersionInfo();
      expect(result.supported).toContain(result.current);
    });
  });
});
