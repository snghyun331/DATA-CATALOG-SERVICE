import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, SwaggerCustomOptions, OpenAPIObject } from '@nestjs/swagger';
import expressBasicAuth from 'express-basic-auth';

const swaggerCustomOptions: SwaggerCustomOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    defaultModelsExpandDepth: -1,
  },
};

export const setupSwagger = (app: INestApplication): void => {
  const options: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
    .setTitle('ACG 카탈로그 서비스 API Docs')
    .setDescription('ACG Catalog API Swagger 문서')
    .setVersion('2025')
    .build();

  const document = SwaggerModule.createDocument(app, options);

  app.use(
    ['/docs'],
    expressBasicAuth({ challenge: true, users: { [process.env.SWAGGER_USERNAME]: process.env.SWAGGER_PASSWORD } }),
  );

  SwaggerModule.setup('docs', app, document, swaggerCustomOptions);
};
