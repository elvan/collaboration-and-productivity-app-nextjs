import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

interface CreateAttachmentOptions {
  taskId: string;
  uploaderId: string;
}

export async function createAttachment(options: CreateAttachmentOptions) {
  const { taskId, uploaderId } = options;

  const fileType = faker.helpers.arrayElement([
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/msword',
    'text/plain',
  ]);

  const fileExtension = getFileExtension(fileType);
  const fileName = `${faker.word.sample()}_${faker.string.alphanumeric(8)}${fileExtension}`;

  const attachment = await prisma.attachment.create({
    data: {
      name: fileName,
      url: faker.internet.url(),
      type: fileType,
      size: faker.number.int({ min: 1024, max: 10485760 }), // 1KB to 10MB
      taskId,
      uploaderId,
    },
  });

  return attachment;
}

function getFileExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'application/pdf':
      return '.pdf';
    case 'application/msword':
      return '.doc';
    case 'text/plain':
      return '.txt';
    default:
      return '';
  }
}

export async function seedTaskAttachments(options: CreateAttachmentOptions) {
  // Create 1-5 attachments for the task
  const count = faker.number.int({ min: 1, max: 5 });
  const attachments = [];

  for (let i = 0; i < count; i++) {
    const attachment = await createAttachment(options);
    attachments.push(attachment);
  }

  return attachments;
}

export async function seedDemoAttachments(options: CreateAttachmentOptions) {
  // Create common document types
  const documentAttachments = await Promise.all([
    createAttachment({
      ...options,
      type: 'application/pdf',
      name: 'Project_Requirements.pdf',
    }),
    createAttachment({
      ...options,
      type: 'application/msword',
      name: 'Technical_Specification.doc',
    }),
    createAttachment({
      ...options,
      type: 'text/plain',
      name: 'Release_Notes.txt',
    }),
  ]);

  // Create image attachments
  const imageAttachments = await Promise.all([
    createAttachment({
      ...options,
      type: 'image/png',
      name: 'Screenshot_1.png',
    }),
    createAttachment({
      ...options,
      type: 'image/jpeg',
      name: 'Design_Mockup.jpg',
    }),
  ]);

  return {
    documentAttachments,
    imageAttachments,
  };
}
