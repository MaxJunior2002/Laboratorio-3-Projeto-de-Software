import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from "class-validator";

export class UpdateAdvantageDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  photoUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  costInCoins?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
