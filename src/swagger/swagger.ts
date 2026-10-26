import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule, OpenAPIObject } from "@nestjs/swagger";
import { SWAGGER_CONFIG } from "./swagger.config";
import { config } from "node_modules/zod/v4/core/core";


export function createDocument(app: INestApplication): OpenAPIObject {
    const builder = new DocumentBuilder()
        .setTitle(SWAGGER_CONFIG.title)
        .setDescription(SWAGGER_CONFIG.description)
        .setVersion(SWAGGER_CONFIG.version)
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'token')

    for (const tag of SWAGGER_CONFIG.tags ?? []) {
        builder.addTag(tag);
    }
    const option = builder.build();
    return SwaggerModule.createDocument(app, option);
}