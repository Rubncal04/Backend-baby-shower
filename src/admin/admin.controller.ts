import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { LoginDto } from './dto/login.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { JwtGuard } from '../shared/jwt.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** Authenticates the event owner and returns a JWT. */
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.adminService.login(body?.email, body?.password);
  }

  /** Returns attendance and gift counters for the admin dashboard. */
  @Get('overview')
  @UseGuards(JwtGuard)
  getOverview() {
    return this.adminService.getOverview();
  }

  /** Returns the guest checklist grouped by family/friends. */
  @Get('guests')
  @UseGuards(JwtGuard)
  getGuests() {
    return this.adminService.getGuests();
  }

  /** Updates a guest attendance from the admin checklist. */
  @Patch('guests/:guestId/attendance')
  @UseGuards(JwtGuard)
  updateAttendance(
    @Param('guestId') guestId: string,
    @Body() body: UpdateAttendanceDto,
  ) {
    return this.adminService.updateAttendance(guestId, body?.attending);
  }

  /** Returns every gift, including the hidden pre-reserved crib. */
  @Get('gifts')
  @UseGuards(JwtGuard)
  getGifts() {
    return this.adminService.getGifts();
  }

  /** Releases a gift reservation unless it is the pre-reserved crib. */
  @Post('gifts/:giftId/release')
  @UseGuards(JwtGuard)
  releaseGift(@Param('giftId') giftId: string) {
    return this.adminService.releaseGift(giftId);
  }
}
