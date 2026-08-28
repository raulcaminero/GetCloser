import { IsString, IsArray, IsPhoneNumber, ArrayMinSize } from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  name: string;

  @IsString()
  agentId: string;

  @IsString()
  templateMessage: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  phoneNumbers: string[];
}
