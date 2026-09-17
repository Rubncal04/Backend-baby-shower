import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Guest, GuestDocument } from '../shared/schemas/guest.schema';
import { Gift, GiftDocument } from '../shared/schemas/gift.schema';
import { Admin, AdminDocument } from '../shared/schemas/admin.schema';
import { Group, GroupDocument } from '../shared/schemas/group.schema';
import { GUESTS_SEED } from './guests.seed';
import { GIFTS_SEED } from './gifts.seed';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectModel(Guest.name) private readonly guestModel: Model<GuestDocument>,
    @InjectModel(Gift.name) private readonly giftModel: Model<GiftDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    private readonly configService: ConfigService,
  ) {}

  /** Seeds guests, groups, gifts, and the admin account when their collections are empty. */
  async onModuleInit() {
    await this.seedAdmin();
    await this.seedGuests();
    await this.seedGroups();
    await this.seedGifts();
  }

  /** Creates the default admin user from environment variables if none exists. */
  private async seedAdmin() {
    const existing = await this.adminModel.findOne({ key: 'admin' });
    if (existing) return;

    const email =
      this.configService.get<string>('ADMIN_EMAIL') || 'admin@horusautomation.com';
    const password =
      this.configService.get<string>('ADMIN_PASSWORD') || 'admin2026';
    const passwordHash = await bcrypt.hash(password, 10);

    await this.adminModel.create({ key: 'admin', email, passwordHash });
    console.log(`Admin seed creado: ${email}`);
  }

  /** Inserts the baby shower guest list if the guests collection is empty. */
  private async seedGuests() {
    const count = await this.guestModel.countDocuments();
    if (count > 0) return;

    const docs = GUESTS_SEED.map((guest) => ({
      ...guest,
      attending: null,
      attendingAt: null,
      accessToken: uuidv4(),
    }));

    await this.guestModel.insertMany(docs);
    console.log(`Seed de invitados: ${docs.length} personas.`);
  }

  /** Seeds groups from guests (including already deployed databases without a groups collection). */
  private async seedGroups() {
    const count = await this.groupModel.countDocuments();
    if (count > 0) return;

    const guests = await this.guestModel.find();
    const source = guests.length > 0 ? guests : GUESTS_SEED;
    const unique = new Map<string, { key: string; name: string; type: string }>();

    for (const guest of source) {
      unique.set(guest.groupKey, {
        key: guest.groupKey,
        name: guest.groupName,
        type: guest.type,
      });
    }

    const docs = Array.from(unique.values());
    if (!docs.length) return;

    await this.groupModel.insertMany(docs);
    console.log(`Seed de grupos: ${docs.length} grupos.`);
  }

  /** Inserts the gift catalog, marking the crib as pre-reserved and hidden. */
  private async seedGifts() {
    const count = await this.giftModel.countDocuments();
    if (count > 0) return;

    const docs = GIFTS_SEED.map((gift) => ({
      ...gift,
      reservedByGuestId: null,
      reservedByName: null,
      reservedByGroupKey: null,
      reservedAt: gift.preReserved ? new Date() : null,
    }));

    await this.giftModel.insertMany(docs);
    console.log(`Seed de regalos: ${docs.length} ítems.`);
  }
}
