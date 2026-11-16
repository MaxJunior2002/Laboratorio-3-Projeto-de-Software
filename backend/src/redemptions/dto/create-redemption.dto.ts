import { IsUUID } from "class-validator";

export class CreateRedemptionDto {
  @IsUUID()
  advantageId!: string;
}
