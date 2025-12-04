import { PartialType } from '@nestjs/mapped-types';
import { CreateSiteDto, CreateSiteConstraintsDto, CreateSiteUtilitiesDto } from './create-site.dto';

export class UpdateSiteConstraintsDto extends PartialType(CreateSiteConstraintsDto) { }

export class UpdateSiteUtilitiesDto extends PartialType(CreateSiteUtilitiesDto) { }

export class UpdateSiteDto extends PartialType(CreateSiteDto) { }
