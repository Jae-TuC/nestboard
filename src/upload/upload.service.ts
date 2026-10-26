import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { UploadApiResponse } from 'cloudinary';

@Injectable()
export class UploadService {
    private readonly logger = new Logger(UploadService.name);

    constructor(
        @Inject('Cloudinary') private cloudinary: typeof import('cloudinary').v2
    ) { }

    async uploadImage(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('Only image files are allowed');
        }
        if (file.size > 10 * 1024 * 1024) { // 10 MB
            throw new BadRequestException('File size exceeds 10 MB');
        }

        try {
            const result = await this.uploadToCloudinary(file);
            return {
                url: result.secure_url,
                publicId: result.public_id,
            };
        } catch (error) {
            this.logger.error('Cloudinary upload failed', error);
            throw new BadRequestException('Image upload failed');
        }
    }

    async uploadDocument(file: Express.Multer.File): Promise<{ url: string; publicId: string; format: string }> {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Only PDF, DOCX, DOC, XLSX, and XLS files are allowed');
        }

        if (file.size > 20 * 1024 * 1024) { // 20 MB limit for documents
            throw new BadRequestException('File size exceeds 20 MB');
        }

        try {
            const result = await this.uploadDocumentToCloudinary(file);
            return {
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format || file.originalname.split('.').pop() || '',
            };
        } catch (error) {
            this.logger.error('Cloudinary document upload failed', error);
            throw new BadRequestException('Document upload failed');
        }
    }

    private async uploadToCloudinary(file: Express.Multer.File): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = this.cloudinary.uploader.upload_stream(
                {
                    folder: 'nestboard',
                    use_filename: true,
                    unique_filename: false,
                    overwrite: true,
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else if (result) {
                        resolve(result);
                    } else {
                        reject(new Error('Empty upload result from Cloudinary'));
                    }
                },
            );
            uploadStream.end(file.buffer);
        });
    }

    private async uploadDocumentToCloudinary(file: Express.Multer.File): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = this.cloudinary.uploader.upload_stream(
                {
                    folder: 'nestboard/documents',
                    resource_type: 'raw', // Mandatory for non-image formats like DOCX/XLSX
                    use_filename: true,
                    unique_filename: true,
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else if (result) {
                        resolve(result);
                    } else {
                        reject(new Error('Empty upload result from Cloudinary'));
                    }
                },
            );
            uploadStream.end(file.buffer);
        });
    }

    async deleteFile(publicId: string, resourceType: string = 'image'): Promise<any> {
        try {
            const result = await this.cloudinary.uploader.destroy(publicId, {
                resource_type: resourceType
            });
            return result;
        } catch (error) {
            this.logger.error(`Failed to delete file from Cloudinary: ${publicId}`, error);
            throw new BadRequestException('Failed to delete file');
        }
    }
}