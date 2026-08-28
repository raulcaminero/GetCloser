import {
  IsString,
  IsBoolean,
  IsInt,
  IsArray,
  ValidateNested,
  IsOptional,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductDto {
  @IsString()
  name: string;

  @IsString()
  price: string;

  @IsString()
  features: string;

  @IsString()
  @IsOptional()
  zone?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class CreateAgentDto {
  @IsString()
  name: string;

  @IsString()
  businessName: string;

  @IsString()
  sector: string;

  @IsString()
  tone: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  qualificationQuestions: string[];

  @IsInt()
  @Min(1)
  maxMessages: number;

  @IsString()
  handoffMessage: string;

  @IsBoolean()
  isActive: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductDto)
  products: ProductDto[];
}
