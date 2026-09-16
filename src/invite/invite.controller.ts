import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InviteService } from './invite.service';
import { IdentifyDto } from './dto/identify.dto';
import { SelectGuestDto } from './dto/select-guest.dto';
import { AttendanceDto } from './dto/attendance.dto';
import { GuestTokenGuard } from '../shared/guest-token.guard';
import { GuestDocument } from '../shared/schemas/guest.schema';

@Controller()
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  /** Returns public invitation copy, date, and address. */
  @Get('event')
  getEvent() {
    return this.inviteService.getEvent();
  }

  /** Looks up a guest group by phone number. */
  @Post('invite/identify')
  identify(@Body() body: IdentifyDto) {
    return this.inviteService.identify(body?.phone);
  }

  /** Opens a guest session after choosing a name inside the matched group. */
  @Post('invite/session')
  openSession(@Body() body: SelectGuestDto) {
    return this.inviteService.openSession(body?.phone, body?.guestId);
  }

  /** Restores the current guest session. */
  @Get('invite/me')
  @UseGuards(GuestTokenGuard)
  getMe(@Req() req: { guest: GuestDocument }) {
    return this.inviteService.getMe(req.guest);
  }

  /** Saves whether the identified guest will attend. */
  @Patch('invite/attendance')
  @UseGuards(GuestTokenGuard)
  updateAttendance(
    @Req() req: { guest: GuestDocument },
    @Body() body: AttendanceDto,
  ) {
    return this.inviteService.updateAttendance(req.guest, body?.attending);
  }

  /** Reserves a gift for the guest's group. */
  @Post('invite/gifts/:giftId/reserve')
  @UseGuards(GuestTokenGuard)
  reserveGift(
    @Req() req: { guest: GuestDocument },
    @Param('giftId') giftId: string,
  ) {
    return this.inviteService.reserveGift(req.guest, giftId);
  }

  /** Releases the gift currently reserved by the guest's group. */
  @Post('invite/gifts/:giftId/release')
  @UseGuards(GuestTokenGuard)
  releaseGift(
    @Req() req: { guest: GuestDocument },
    @Param('giftId') giftId: string,
  ) {
    return this.inviteService.releaseGift(req.guest, giftId);
  }
}
