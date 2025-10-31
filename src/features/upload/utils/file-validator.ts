export class FileTypeValidator {
  static validate(file: Express.Multer.File): void {
    const allowedTypes = [
      'application/text',
      'text/plain',
      'application/json',
      'application/pdf',
      'application/msword',
      'application/excel',
      'application/vnd.ms-excel',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpg',
      'image/jpeg',
    ];
    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`Unsupported file type: ${file.mimetype}`);
    }
  }
}