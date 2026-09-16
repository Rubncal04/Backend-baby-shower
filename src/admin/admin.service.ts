import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Admin, AdminDocument } from '../shared/schemas/admin.schema';
import { Guest, GuestDocument } from '../shared/schemas/guest.schema';
import { Gift, GiftDocument } from '../shared/schemas/gift.schema';
import { EVENT_INFO } from '../seed/event.seed';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(Guest.name) private readonly guestModel: Model<GuestDocument>,
    @InjectModel(Gift.name) private readonly giftModel: Model<GiftDocument>,
    private readonly configService: ConfigService,
  ) {}

  /** Verifies admin credentials and returns a signed JWT valid for 8 hours. */
  async login(email: string, password: string) {
    if (!email || !password) {
      throw new BadRequestException('Correo y contraseña son obligatorios');
    }

    const admin = await this.adminModel.findOne({ key: 'admin' });
    if (!admin || admin.email.toLowerCase() !== email.toLowerCase()) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const secret =
      this.configService.get<string>('JWT_SECRET') || 'baby-shower-secret-2026';
    const token = jwt.sign({ email: admin.email }, secret, { expiresIn: '8h' });

    return { token, email: admin.email };
  }

  /** Returns event info plus attendance and gift reservation counters for the dashboard. */
  async getOverview() {
    const guests = await this.guestModel.find();
    const gifts = await this.giftModel.find().sort({ order: 1 });

    const attending = guests.filter((guest) => guest.attending === true).length;
    const notAttending = guests.filter((guest) => guest.attending === false).length;
    const pending = guests.filter((guest) => guest.attending === null).length;
    const visibleGifts = gifts.filter((gift) => gift.visible);
    const reservedVisible = visibleGifts.filter((gift) => gift.reserved).length;

    return {
      event: EVENT_INFO,
      guests: {
        total: guests.length,
        attending,
        notAttending,
        pending,
      },
      gifts: {
        total: gifts.length,
        visible: visibleGifts.length,
        reserved: reservedVisible,
        available: visibleGifts.length - reservedVisible,
        hiddenReserved: gifts.filter((gift) => !gift.visible && gift.reserved).length,
      },
    };
  }

  /** Returns guests grouped for the attendance checklist, including phone numbers. */
  async getGuests() {
    const guests = await this.guestModel.find().sort({ type: 1, groupKey: 1, name: 1 });
    const groups = new Map<
      string,
      {
        type: string;
        groupKey: string;
        groupName: string;
        members: ReturnType<AdminService['toAdminGuest']>[];
      }
    >();

    for (const guest of guests) {
      if (!groups.has(guest.groupKey)) {
        groups.set(guest.groupKey, {
          type: guest.type,
          groupKey: guest.groupKey,
          groupName: guest.groupName,
          members: [],
        });
      }
      groups.get(guest.groupKey).members.push(this.toAdminGuest(guest));
    }

    return { groups: Array.from(groups.values()) };
  }

  /** Updates a guest attendance from the admin checklist. */
  async updateAttendance(guestId: string, attending: boolean | null) {
    if (attending !== true && attending !== false && attending !== null) {
      throw new BadRequestException('El valor de asistencia no es válido.');
    }

    const guest = await this.guestModel.findOne({ id: guestId });
    if (!guest) throw new NotFoundException('Invitado no encontrado');

    guest.attending = attending;
    guest.attendingAt = attending === null ? null : new Date();
    await guest.save();

    return this.toAdminGuest(guest);
  }

  /** Returns the full gift list, including the hidden pre-reserved crib. */
  async getGifts() {
    const gifts = await this.giftModel.find().sort({ order: 1 });
    return {
      gifts: gifts.map((gift) => this.toAdminGift(gift)),
    };
  }

  /** Releases a non-pre-reserved gift so another group can pick it. */
  async releaseGift(giftId: string) {
    const gift = await this.giftModel.findOne({ id: giftId });
    if (!gift) throw new NotFoundException('Regalo no encontrado');
    if (gift.preReserved) {
      throw new BadRequestException(
        'La Cuna Cama ya estaba reservada y no se puede liberar.',
      );
    }

    gift.reserved = false;
    gift.reservedByGuestId = null;
    gift.reservedByName = null;
    gift.reservedByGroupKey = null;
    gift.reservedAt = null;
    await gift.save();

    return this.toAdminGift(gift);
  }

  /** Maps a guest document to the admin checklist shape. */
  private toAdminGuest(guest: GuestDocument) {
    return {
      id: guest.id,
      name: guest.name,
      phone: guest.phone,
      type: guest.type,
      groupKey: guest.groupKey,
      groupName: guest.groupName,
      attending: guest.attending,
      attendingAt: guest.attendingAt,
      hasPhone: Boolean(guest.phone),
    };
  }

  /** Maps a gift document to the admin catalog shape, including who reserved it. */
  private toAdminGift(gift: GiftDocument) {
    return {
      id: gift.id,
      name: gift.name,
      icon: gift.icon,
      order: gift.order,
      tier: gift.tier,
      visible: gift.visible,
      preReserved: gift.preReserved,
      reserved: gift.reserved,
      reservedByGuestId: gift.reservedByGuestId,
      reservedByName: gift.reservedByName,
      reservedByGroupKey: gift.reservedByGroupKey,
      reservedAt: gift.reservedAt,
    };
  }
}
