import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Guest, GuestDocument } from './schemas/guest.schema';

@Injectable()
export class GuestTokenGuard implements CanActivate {
  constructor(
    @InjectModel(Guest.name) private readonly guestModel: Model<GuestDocument>,
  ) {}

  /** Loads the guest associated with the x-guest-token header. */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token: string = request.headers['x-guest-token'];

    if (!token) {
      throw new UnauthorizedException('Token de invitado no proporcionado');
    }

    const guest = await this.guestModel.findOne({ accessToken: token });
    if (!guest) {
      throw new UnauthorizedException('Token de invitado inválido');
    }

    request.guest = guest;
    return true;
  }
}
