import { Test, TestingModule } from '@nestjs/testing';
import { InivitationService } from './invitation.service';

describe('InivitationService', () => {
  let service: InivitationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InivitationService],
    }).compile();

    service = module.get<InivitationService>(InivitationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
