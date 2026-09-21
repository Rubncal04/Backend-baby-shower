import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { LoginDto } from './dto/login.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateGiftDto } from './dto/create-gift.dto';
import { UpdateGiftDto } from './dto/update-gift.dto';
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

  /** Returns every group, including empty ones, for assigning guests. */
  @Get('groups')
  @UseGuards(JwtGuard)
  getGroups() {
    return this.adminService.getGroups();
  }

  /** Creates a group that guests can join later. */
  @Post('groups')
  @UseGuards(JwtGuard)
  createGroup(@Body() body: CreateGroupDto) {
    return this.adminService.createGroup(body);
  }

  /** Updates a group's name or type. */
  @Patch('groups/:groupKey')
  @UseGuards(JwtGuard)
  updateGroup(@Param('groupKey') groupKey: string, @Body() body: UpdateGroupDto) {
    return this.adminService.updateGroup(groupKey, body);
  }

  /** Deletes an empty group. */
  @Delete('groups/:groupKey')
  @UseGuards(JwtGuard)
  deleteGroup(@Param('groupKey') groupKey: string) {
    return this.adminService.deleteGroup(groupKey);
  }

  /** Returns the guest checklist grouped by family/friends. */
  @Get('guests')
  @UseGuards(JwtGuard)
  getGuests() {
    return this.adminService.getGuests();
  }

  /** Adds a guest, optionally joining an existing group. */
  @Post('guests')
  @UseGuards(JwtGuard)
  createGuest(@Body() body: CreateGuestDto) {
    return this.adminService.createGuest(body);
  }

  /** Updates a guest's name, phone, type, or group. */
  @Patch('guests/:guestId')
  @UseGuards(JwtGuard)
  updateGuest(@Param('guestId') guestId: string, @Body() body: UpdateGuestDto) {
    return this.adminService.updateGuest(guestId, body);
  }

  /** Removes a guest from the event. */
  @Delete('guests/:guestId')
  @UseGuards(JwtGuard)
  deleteGuest(@Param('guestId') guestId: string) {
    return this.adminService.deleteGuest(guestId);
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

  /** Adds a gift to the catalog for guests to reserve. */
  @Post('gifts')
  @UseGuards(JwtGuard)
  createGift(@Body() body: CreateGiftDto) {
    return this.adminService.createGift(body);
  }

  /** Updates a gift's name, tier, icon, order, or visibility. */
  @Patch('gifts/:giftId')
  @UseGuards(JwtGuard)
  updateGift(@Param('giftId') giftId: string, @Body() body: UpdateGiftDto) {
    return this.adminService.updateGift(giftId, body);
  }

  /** Removes a gift from the catalog. */
  @Delete('gifts/:giftId')
  @UseGuards(JwtGuard)
  deleteGift(@Param('giftId') giftId: string) {
    return this.adminService.deleteGift(giftId);
  }

  /** Releases a gift reservation unless it is the pre-reserved crib. */
  @Post('gifts/:giftId/release')
  @UseGuards(JwtGuard)
  releaseGift(@Param('giftId') giftId: string) {
    return this.adminService.releaseGift(giftId);
  }
}
