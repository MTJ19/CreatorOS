import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() name!: string;
  @ApiProperty() role!: string;
  @ApiProperty({ required: false }) avatarUrl?: string | null;
  @ApiProperty() createdAt!: Date;
}

export class AuthTokensDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty() refreshToken!: string;
  @ApiProperty() expiresIn!: number;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserDto }) user!: AuthUserDto;
  @ApiProperty({ type: AuthTokensDto }) tokens!: AuthTokensDto;
}
