import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [MembersService],
  controllers: [MembersController],
  exports: [MembersService]
})
export class MembersModule {}
