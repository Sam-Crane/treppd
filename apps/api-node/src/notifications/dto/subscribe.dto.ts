import {
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Matches the shape returned by `PushSubscription.toJSON()` in the browser.
 * The keys object comes from `getKey('p256dh')` / `getKey('auth')` which
 * we base64url-encode on the client before posting.
 */
export class SubscriptionKeysDto {
  @IsString()
  @MaxLength(200)
  p256dh: string;

  @IsString()
  @MaxLength(200)
  auth: string;
}

export class SubscribeDto {
  @IsString()
  @MaxLength(500)
  endpoint: string;

  @ValidateNested()
  @Type(() => SubscriptionKeysDto)
  keys: SubscriptionKeysDto;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  user_agent?: string;
}
