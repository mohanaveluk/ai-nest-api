import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty() fileName: string;
  @ApiProperty() status: string;
  @ApiProperty() progress: number;
}