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
import { v4 as uuidv4 } from 'uuid';
import { Admin, AdminDocument } from '../shared/schemas/admin.schema';
import { Guest, GuestDocument, GuestType } from '../shared/schemas/guest.schema';
import { Gift, GiftDocument } from '../shared/schemas/gift.schema';
import { Group, GroupDocument } from '../shared/schemas/group.schema';
import { EVENT_INFO } from '../seed/event.seed';
import { normalizePhone } from '../shared/phone.util';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(Guest.name) private readonly guestModel: Model<GuestDocument>,
    @InjectModel(Gift.name) private readonly giftModel: Model<GiftDocument>,
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
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

  /** Returns guests grouped for the attendance checklist, including empty groups. */
  async getGuests() {
    const [groupDocs, guests] = await Promise.all([
      this.groupModel.find().sort({ type: 1, name: 1 }),
      this.guestModel.find().sort({ type: 1, groupKey: 1, name: 1 }),
    ]);

    const groups = new Map<
      string,
      {
        type: string;
        groupKey: string;
        groupName: string;
        members: ReturnType<AdminService['toAdminGuest']>[];
      }
    >();

    for (const group of groupDocs) {
      groups.set(group.key, {
        type: group.type,
        groupKey: group.key,
        groupName: group.name,
        members: [],
      });
    }

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

  /** Returns every group so the admin can assign guests, including empty groups. */
  async getGroups() {
    const [groupDocs, guests] = await Promise.all([
      this.groupModel.find().sort({ type: 1, name: 1 }),
      this.guestModel.find(),
    ]);

    const counts = new Map<string, number>();
    for (const guest of guests) {
      counts.set(guest.groupKey, (counts.get(guest.groupKey) || 0) + 1);
    }

    return {
      groups: groupDocs.map((group) => ({
        groupKey: group.key,
        groupName: group.name,
        type: group.type,
        memberCount: counts.get(group.key) || 0,
      })),
    };
  }

  /** Creates a group that can later receive guests. */
  async createGroup(body: CreateGroupDto) {
    const name = this.requireName(body?.name);
    const type = this.requireType(body?.type);
    const key = await this.buildUniqueGroupKey(type, body?.key, name);

    const group = await this.groupModel.create({ key, name, type });
    return this.toAdminGroup(group, 0);
  }

  /** Updates a group's name or type and syncs those fields to its guests. */
  async updateGroup(groupKey: string, body: UpdateGroupDto) {
    const group = await this.groupModel.findOne({ key: groupKey });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const previousType = group.type;
    if (body?.name !== undefined) {
      group.name = this.requireName(body.name);
    }
    if (body?.type !== undefined) {
      group.type = this.requireType(body.type);
    }
    await group.save();

    await this.guestModel.updateMany(
      { groupKey: group.key },
      { $set: { type: group.type, groupName: group.name } },
    );

    if (group.type !== previousType) {
      await this.releaseGroupGift(group.key);
    }

    const memberCount = await this.guestModel.countDocuments({ groupKey: group.key });
    return this.toAdminGroup(group, memberCount);
  }

  /** Deletes a group. Rejects if it still has guests. */
  async deleteGroup(groupKey: string) {
    const group = await this.groupModel.findOne({ key: groupKey });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const memberCount = await this.guestModel.countDocuments({ groupKey });
    if (memberCount > 0) {
      throw new BadRequestException(
        `El grupo todavía tiene ${memberCount} invitado(s). Muévelos o elimínalos primero.`,
      );
    }

    await this.releaseGroupGift(groupKey);
    await this.groupModel.deleteOne({ key: groupKey });
    return { success: true, groupKey };
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

  /** Creates a guest, joining an existing group when groupKey or groupName already match. */
  async createGuest(body: CreateGuestDto) {
    const name = this.requireName(body?.name);
    const type = this.requireType(body?.type);
    const phone = this.parseOptionalPhone(body?.phone);
    const group = await this.resolveGroup(type, body?.groupKey, body?.groupName, name);

    const guest = await this.guestModel.create({
      id: this.createGuestId(name),
      name,
      phone: phone ?? null,
      type: group.type,
      groupKey: group.groupKey,
      groupName: group.groupName,
      attending: null,
      attendingAt: null,
      accessToken: uuidv4(),
    });

    return this.toAdminGuest(guest);
  }

  /** Updates a guest's name, phone, type, or group assignment. */
  async updateGuest(guestId: string, body: UpdateGuestDto) {
    const guest = await this.guestModel.findOne({ id: guestId });
    if (!guest) throw new NotFoundException('Invitado no encontrado');

    const previousGroupKey = guest.groupKey;
    const previousName = guest.name;

    if (body?.name !== undefined) {
      guest.name = this.requireName(body.name);
    }

    if (body?.phone !== undefined) {
      guest.phone = this.parseOptionalPhone(body.phone) ?? null;
    }

    const nextType = body?.type !== undefined ? this.requireType(body.type) : guest.type;
    const hasGroupKey = body?.groupKey !== undefined;
    const hasGroupName = body?.groupName !== undefined;
    const groupChanged = hasGroupKey || hasGroupName || body?.type !== undefined;

    if (groupChanged) {
      const group = await this.resolveGroup(
        nextType,
        hasGroupKey ? body.groupKey : hasGroupName ? undefined : guest.groupKey,
        hasGroupName ? body.groupName : hasGroupKey ? undefined : guest.groupName,
        guest.name,
        guest.id,
        previousGroupKey,
      );
      guest.type = group.type;
      guest.groupKey = group.groupKey;
      guest.groupName = group.groupName;
    }

    await guest.save();

    if (guest.groupKey === previousGroupKey) {
      await this.guestModel.updateMany(
        { groupKey: guest.groupKey },
        { $set: { type: guest.type, groupName: guest.groupName } },
      );
    }

    if (guest.name !== previousName) {
      await this.giftModel.updateMany(
        { reservedByGuestId: guest.id },
        { $set: { reservedByName: guest.name } },
      );
    }

    if (guest.groupKey !== previousGroupKey) {
      await this.releaseGroupGiftIfOrphaned(previousGroupKey);
    }

    return this.toAdminGuest(guest);
  }

  /** Deletes a guest and releases their group's gift if nobody else remains. */
  async deleteGuest(guestId: string) {
    const guest = await this.guestModel.findOne({ id: guestId });
    if (!guest) throw new NotFoundException('Invitado no encontrado');

    const groupKey = guest.groupKey;
    await this.giftModel.updateMany(
      { reservedByGuestId: guest.id },
      { $set: { reservedByGuestId: null } },
    );
    await this.guestModel.deleteOne({ id: guestId });
    await this.releaseGroupGiftIfOrphaned(groupKey);

    return { success: true, id: guestId };
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

  /** Resolves the group a guest should join, creating and persisting it when needed. */
  private async resolveGroup(
    type: GuestType,
    groupKey: string | undefined,
    groupName: string | undefined,
    guestName: string,
    _excludeGuestId?: string,
    currentGroupKey?: string,
  ) {
    const trimmedKey = groupKey?.trim();
    const trimmedName = groupName?.trim();

    if (trimmedKey) {
      const existing = await this.groupModel.findOne({ key: trimmedKey });
      if (existing) {
        if (existing.type !== type && existing.key !== currentGroupKey) {
          throw new BadRequestException(
            `El grupo "${existing.name}" es de tipo ${existing.type}.`,
          );
        }
        const name = trimmedName || existing.name;
        const nextType = existing.key === currentGroupKey ? type : existing.type;
        return this.ensureGroup(existing.key, name, nextType);
      }

      if (!trimmedName) {
        throw new BadRequestException(
          'Para crear un grupo nuevo debes indicar groupName.',
        );
      }

      return this.ensureGroup(trimmedKey, trimmedName, type);
    }

    if (!trimmedName) {
      throw new BadRequestException(
        'Indica groupKey de un grupo existente o groupName para crear uno.',
      );
    }

    if (/persona\s*sola/i.test(trimmedName)) {
      const key = `${type}-sola-${this.slugify(guestName)}-${uuidv4().slice(0, 6)}`;
      return this.ensureGroup(key, trimmedName, type);
    }

    const existingByName = await this.groupModel.findOne({ type, name: trimmedName });
    if (existingByName) {
      return this.ensureGroup(existingByName.key, existingByName.name, existingByName.type);
    }

    const generatedKey = await this.buildUniqueGroupKey(type, undefined, trimmedName);
    return this.ensureGroup(generatedKey, trimmedName, type);
  }

  /** Creates or updates a group document so it always appears in the assignable list. */
  private async ensureGroup(key: string, name: string, type: GuestType) {
    const group = await this.groupModel.findOneAndUpdate(
      { key },
      { $set: { name, type }, $setOnInsert: { key } },
      { new: true, upsert: true },
    );
    return {
      type: group.type,
      groupKey: group.key,
      groupName: group.name,
    };
  }

  /** Builds a unique group key from an optional value or the group name. */
  private async buildUniqueGroupKey(
    type: GuestType,
    rawKey: string | undefined,
    name: string,
  ) {
    const preferred = rawKey?.trim() || `${type}-${this.slugify(name)}`;
    const existing = await this.groupModel.findOne({ key: preferred });
    if (!existing) return preferred;
    return `${preferred}-${uuidv4().slice(0, 6)}`;
  }

  /** Maps a group document plus member count to the admin group shape. */
  private toAdminGroup(group: GroupDocument, memberCount: number) {
    return {
      groupKey: group.key,
      groupName: group.name,
      type: group.type,
      memberCount,
    };
  }

  /** Releases a group's gift reservation regardless of remaining members. */
  private async releaseGroupGift(groupKey: string) {
    await this.giftModel.updateMany(
      { reservedByGroupKey: groupKey, preReserved: false },
      {
        $set: {
          reserved: false,
          reservedByGuestId: null,
          reservedByName: null,
          reservedByGroupKey: null,
          reservedAt: null,
        },
      },
    );
  }

  /** Releases a group's gift when that group no longer has any members. */
  private async releaseGroupGiftIfOrphaned(groupKey: string) {
    const remaining = await this.guestModel.countDocuments({ groupKey });
    if (remaining > 0) return;
    await this.releaseGroupGift(groupKey);
  }

  /** Validates and trims a guest name. */
  private requireName(name: string) {
    const trimmed = name?.trim();
    if (!trimmed) throw new BadRequestException('El nombre es obligatorio.');
    return trimmed;
  }

  /** Validates that the guest type is familia or amigos. */
  private requireType(type: string): GuestType {
    if (type !== 'familia' && type !== 'amigos') {
      throw new BadRequestException('El tipo debe ser familia o amigos.');
    }
    return type;
  }

  /** Normalizes an optional phone, treating empty values as null. */
  private parseOptionalPhone(phone: string | null | undefined) {
    if (phone === undefined) return undefined;
    if (phone === null || String(phone).trim() === '') return null;

    const normalized = normalizePhone(String(phone));
    if (!normalized) {
      throw new BadRequestException('El celular debe tener 10 dígitos.');
    }
    return normalized;
  }

  /** Builds a unique public id from the guest name. */
  private createGuestId(name: string) {
    return `${this.slugify(name)}-${uuidv4().slice(0, 8)}`;
  }

  /** Converts a label into a lowercase slug safe for ids and group keys. */
  private slugify(value: string) {
    const slug = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug || 'invitado';
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
