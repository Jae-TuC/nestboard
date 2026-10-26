import { Test, TestingModule } from '@nestjs/testing';
import { InivitationController } from './invitation.controller';

describe('InivitationController', () => {
  let controller: InivitationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InivitationController],
    }).compile();

    controller = module.get<InivitationController>(InivitationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
