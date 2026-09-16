import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Guest, GuestDocument } from '../shared/schemas/guest.schema';
import { Gift, GiftDocument } from '../shared/schemas/gift.schema';
import { EVENT_INFO } from '../seed/event.seed';
import { normalizePhone, tierForGuestType } from '../shared/phone.util';

@Injectable()
export class InviteService {
  constructor(
    @InjectModel(Guest.name) private readonly guestModel: Model<GuestDocument>,
    @InjectModel(Gift.name) private readonly giftModel: Model<GiftDocument>,
  ) {}

  /** Returns public invitation details for the landing page. */
  getEvent() {
    return EVENT_INFO;
  }

  /** Finds the group that owns a phone number and returns members plus the matching gift catalog. */
  async identify(phoneInput: string) {
    const phone = normalizePhone(phoneInput);
    if (!phone) {
      throw new BadRequestException(
        'Ingresa un número de celular válido de 10 dígitos.',
      );
    }

    const matched = await this.guestModel.findOne({ phone });
    if (!matched) {
      throw new NotFoundException(
        `No encontramos ese número. ${EVENT_INFO.identifyHint}`,
      );
    }

    return this.buildGroupPayload(matched.groupKey);
  }

  /** Issues a guest session token after confirming the phone belongs to the same group. */
  async openSession(phoneInput: string, guestId: string) {
    const phone = normalizePhone(phoneInput);
    if (!phone) {
      throw new BadRequestException(
        'Ingresa un número de celular válido de 10 dígitos.',
      );
    }

    const matched = await this.guestModel.findOne({ phone });
    if (!matched) {
      throw new NotFoundException(
        `No encontramos ese número. ${EVENT_INFO.identifyHint}`,
      );
    }

    const guest = await this.guestModel.findOne({ id: guestId });
    if (!guest || guest.groupKey !== matched.groupKey) {
      throw new BadRequestException(
        'Esa persona no pertenece al grupo de este número.',
      );
    }

    const payload = await this.buildGroupPayload(guest.groupKey, guest.id);

    return {
      token: guest.accessToken,
      guest: this.toPublicGuest(guest),
      ...payload,
    };
  }

  /** Restores the current guest session with group members and available gifts. */
  async getMe(guest: GuestDocument) {
    const payload = await this.buildGroupPayload(guest.groupKey, guest.id);
    return {
      guest: this.toPublicGuest(guest),
      ...payload,
    };
  }

  /** Updates the identified guest's attendance (true = attending, false = not attending). */
  async updateAttendance(guest: GuestDocument, attending: boolean) {
    if (typeof attending !== 'boolean') {
      throw new BadRequestException('Debes indicar si asistes o no.');
    }

    guest.attending = attending;
    guest.attendingAt = new Date();
    await guest.save();

    return this.getMe(guest);
  }

  /** Atomically reserves a visible gift for the guest's group if it is still available. */
  async reserveGift(guest: GuestDocument, giftId: string) {
    const tier = tierForGuestType(guest.type);

    const already = await this.giftModel.findOne({
      reserved: true,
      reservedByGroupKey: guest.groupKey,
    });
    if (already) {
      throw new ConflictException(
        `Tu grupo ya reservó "${already.name}". Solo pueden elegir un regalo.`,
      );
    }

    try {
      const updated = await this.giftModel.findOneAndUpdate(
        { id: giftId, reserved: false, visible: true, tier },
        {
          reserved: true,
          reservedByGuestId: guest.id,
          reservedByName: guest.name,
          reservedByGroupKey: guest.groupKey,
          reservedAt: new Date(),
        },
        { new: true },
      );

      if (!updated) {
        throw new ConflictException(
          'Ese regalo ya no está disponible o no corresponde a tu lista.',
        );
      }
    } catch (error) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'Tu grupo ya reservó un regalo. Solo pueden elegir uno.',
        );
      }
      throw error;
    }

    return this.getMe(guest);
  }

  /** Releases the gift reserved by the guest's group so they can pick a different one. */
  async releaseGift(guest: GuestDocument, giftId: string) {
    const updated = await this.giftModel.findOneAndUpdate(
      {
        id: giftId,
        reserved: true,
        preReserved: false,
        reservedByGroupKey: guest.groupKey,
      },
      {
        reserved: false,
        reservedByGuestId: null,
        reservedByName: null,
        reservedByGroupKey: null,
        reservedAt: null,
      },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException(
        'No encontramos una reserva de tu grupo para ese regalo.',
      );
    }

    return this.getMe(guest);
  }

  /** Builds the public group view: members, catalog, and current reservation. */
  private async buildGroupPayload(groupKey: string, selectedGuestId?: string) {
    const members = await this.guestModel.find({ groupKey }).sort({ name: 1 });
    if (!members.length) {
      throw new NotFoundException('No encontramos el grupo de invitados.');
    }

    const type = members[0].type;
    const tier = tierForGuestType(type);
    const gifts = await this.giftModel
      .find({ visible: true, tier })
      .sort({ order: 1 });

    const groupReservation = await this.giftModel.findOne({
      reserved: true,
      reservedByGroupKey: groupKey,
    });

    return {
      type,
      groupKey,
      groupName: members[0].groupName,
      identifyHint: EVENT_INFO.identifyHint,
      selectedGuestId: selectedGuestId || null,
      members: members.map((member) => this.toPublicMember(member)),
      groupReservation: groupReservation
        ? {
            giftId: groupReservation.id,
            giftName: groupReservation.name,
            reservedByName: groupReservation.reservedByName,
          }
        : null,
      gifts: gifts.map((gift) => ({
        id: gift.id,
        name: gift.name,
        icon: gift.icon,
        order: gift.order,
        reserved: gift.reserved,
        reservedByGroup: gift.reservedByGroupKey === groupKey,
      })),
    };
  }

  /** Maps a guest document to the fields a logged-in guest may see about themselves. */
  private toPublicGuest(guest: GuestDocument) {
    return {
      id: guest.id,
      name: guest.name,
      type: guest.type,
      groupKey: guest.groupKey,
      groupName: guest.groupName,
      attending: guest.attending,
    };
  }

  /** Maps a guest document to the fields shown when picking a name inside a group. */
  private toPublicMember(guest: GuestDocument) {
    return {
      id: guest.id,
      name: guest.name,
      attending: guest.attending,
      hasPhone: Boolean(guest.phone),
    };
  }
}
