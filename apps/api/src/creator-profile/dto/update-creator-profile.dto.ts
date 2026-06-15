import { PartialType } from '@nestjs/swagger';

import { CreateCreatorProfileDto } from './create-creator-profile.dto';

export class UpdateCreatorProfileDto extends PartialType(CreateCreatorProfileDto) {}
