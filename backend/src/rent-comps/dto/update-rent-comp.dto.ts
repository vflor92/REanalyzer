import { PartialType } from '@nestjs/mapped-types';
import { CreateRentCompDto } from './create-rent-comp.dto';

export class UpdateRentCompDto extends PartialType(CreateRentCompDto) { }
