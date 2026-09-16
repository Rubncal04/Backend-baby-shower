import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Guest, GuestSchema } from './schemas/guest.schema';
import { Gift, GiftSchema } from './schemas/gift.schema';
import { Admin, AdminSchema } from './schemas/admin.schema';
import { JwtGuard } from './jwt.guard';
import { GuestTokenGuard } from './guest-token.guard';
import { SeedService } from '../seed/seed.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Guest.name, schema: GuestSchema },
      { name: Gift.name, schema: GiftSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
  ],
  providers: [JwtGuard, GuestTokenGuard, SeedService],
  exports: [MongooseModule, JwtGuard, GuestTokenGuard],
})
export class SharedModule {}
