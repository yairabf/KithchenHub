import { Test, TestingModule } from '@nestjs/testing';

import { DeployInfoController } from './deploy-info.controller';

describe('DeployInfoController', () => {
  let controller: DeployInfoController;

  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeployInfoController],
    }).compile();

    controller = module.get<DeployInfoController>(DeployInfoController);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return deploy info with env-derived gitSha', () => {
    process.env.VERCEL_GIT_COMMIT_SHA = 'vercel-sha';
    process.env.VERCEL_DEPLOYMENT_ID = 'deployment-id';
    process.env.VERCEL_ENV = 'production';
    process.env.APP_VERSION = '1.2.3';

    const result = controller.getDeployInfo();

    expect(result).toEqual({
      gitSha: 'vercel-sha',
      deploymentId: 'deployment-id',
      environment: 'production',
      appVersion: '1.2.3',
    });
  });

  it('should fall back to GitHub SHA when Vercel SHA is missing', () => {
    process.env.GITHUB_SHA = 'github-sha';

    const result = controller.getDeployInfo();

    expect(result.gitSha).toBe('github-sha');
  });
});
