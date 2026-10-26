import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [InvitationService],
  controllers: [InvitationController],
  exports: [InvitationService]
})
export class InivitationModule {}
