import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from "class-validator";

export class CreateAdvantageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;

  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  photoUrl!: string;

  @IsInt()
  @Min(1)
  costInCoins!: number;
}
