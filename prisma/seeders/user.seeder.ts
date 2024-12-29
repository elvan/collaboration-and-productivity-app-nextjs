import { PrismaClient, UserStatus, AuthProvider } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface CreateUserOptions {
  role?: string;
  status?: UserStatus;
}

export async function createUser(options: CreateUserOptions = {}) {
  const { role = 'user', status = 'ACTIVE' } = options;

  // Create the main user
  const user = await prisma.user.create({
    data: {
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      emailVerified: faker.date.past(),
      password: await bcrypt.hash('password123', 10),
      image: faker.image.avatar(),
      bio: faker.person.bio(),
      location: `${faker.location.city()}, ${faker.location.country()}`,
      website: faker.internet.url(),
      status,
      lastSeen: faker.date.recent(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    },
  });

  // Create user preferences
  await prisma.userPreference.create({
    data: {
      userId: user.id,
      theme: faker.helpers.arrayElement(['light', 'dark', 'system']),
      language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de']),
      timezone: faker.location.timeZone(),
      notifications: {
        email: true,
        push: true,
        desktop: true,
      },
      weekStart: faker.helpers.arrayElement(['monday', 'sunday']),
      dateFormat: faker.helpers.arrayElement(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
      timeFormat: faker.helpers.arrayElement(['12h', '24h']),
    },
  });

  // Create user security settings
  await prisma.userSecurity.create({
    data: {
      userId: user.id,
      twoFactorEnabled: faker.datatype.boolean(),
      lastPasswordChange: faker.date.past(),
      passwordHistory: [],
      loginAttempts: faker.number.int({ min: 0, max: 5 }),
      lastFailedLogin: faker.date.past(),
      securityQuestions: [
        { question: 'What was your first pet's name?', answer: faker.animal.dog() },
        { question: 'What city were you born in?', answer: faker.location.city() },
      ],
    },
  });

  // Create user profile
  await prisma.userProfile.create({
    data: {
      userId: user.id,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      displayName: faker.internet.userName(),
      headline: faker.person.jobTitle(),
      about: faker.person.bio(),
      company: faker.company.name(),
      jobTitle: faker.person.jobTitle(),
      department: faker.commerce.department(),
      skills: faker.helpers.arrayElements([
        'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS',
        'Docker', 'Kubernetes', 'GraphQL', 'SQL', 'MongoDB', 'Redis'
      ], { min: 3, max: 6 }),
      languages: faker.helpers.arrayElements([
        'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'
      ], { min: 1, max: 3 }),
      socialLinks: {
        linkedin: faker.internet.url(),
        twitter: faker.internet.url(),
        github: faker.internet.url(),
      },
    },
  });

  // Create user devices
  const deviceCount = faker.number.int({ min: 1, max: 3 });
  for (let i = 0; i < deviceCount; i++) {
    await prisma.userDevice.create({
      data: {
        userId: user.id,
        deviceId: faker.string.uuid(),
        deviceType: faker.helpers.arrayElement(['mobile', 'tablet', 'desktop']),
        deviceName: faker.helpers.arrayElement([
          'iPhone 13 Pro', 'Samsung Galaxy S21', 'MacBook Pro', 'iPad Air',
          'Windows Desktop', 'Android Tablet'
        ]),
        browser: faker.helpers.arrayElement([
          'Chrome', 'Firefox', 'Safari', 'Edge'
        ]),
        operatingSystem: faker.helpers.arrayElement([
          'iOS 15', 'Android 12', 'Windows 11', 'macOS Monterey'
        ]),
        lastActive: faker.date.recent(),
        ipAddress: faker.internet.ip(),
        location: {
          city: faker.location.city(),
          country: faker.location.country(),
          latitude: faker.location.latitude(),
          longitude: faker.location.longitude(),
        },
      },
    });
  }

  // Create auth accounts
  const providers = faker.helpers.arrayElements([
    AuthProvider.GOOGLE,
    AuthProvider.GITHUB,
    AuthProvider.MICROSOFT,
  ], { min: 1, max: 2 });

  for (const provider of providers) {
    await prisma.account.create({
      data: {
        userId: user.id,
        type: 'oauth',
        provider,
        providerAccountId: faker.string.uuid(),
        access_token: faker.string.alphanumeric(64),
        refresh_token: faker.string.alphanumeric(64),
        expires_at: faker.date.future().getTime(),
        token_type: 'Bearer',
        scope: 'read write',
        id_token: faker.string.alphanumeric(128),
        session_state: faker.string.uuid(),
      },
    });
  }

  return user;
}

export async function createDemoUsers() {
  // Create admin user
  const admin = await createUser({
    role: 'admin',
    status: 'ACTIVE',
  });

  // Create regular users
  const users = await Promise.all(
    Array(5).fill(null).map(() =>
      createUser({
        role: 'user',
        status: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE']),
      })
    )
  );

  return {
    admin,
    users,
  };
}

export async function seedUserActivity(userId: string) {
  const activityCount = faker.number.int({ min: 5, max: 10 });
  const activities = [];

  for (let i = 0; i < activityCount; i++) {
    const activity = await prisma.userActivity.create({
      data: {
        userId,
        type: faker.helpers.arrayElement([
          'LOGIN', 'LOGOUT', 'PROFILE_UPDATE', 'PASSWORD_CHANGE',
          'SETTINGS_UPDATE', 'FILE_UPLOAD', 'COMMENT_CREATED'
        ]),
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
          location: {
            city: faker.location.city(),
            country: faker.location.country(),
          },
        },
        createdAt: faker.date.past(),
      },
    });
    activities.push(activity);
  }

  return activities;
}

export async function seedUserEndorsements(userId: string) {
  // Create skill endorsements
  const skillCount = faker.number.int({ min: 3, max: 6 });
  const skills = [];

  for (let i = 0; i < skillCount; i++) {
    const skill = await prisma.skillEndorsement.create({
      data: {
        userId,
        skill: faker.helpers.arrayElement([
          'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python',
          'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'SQL'
        ]),
        endorsedBy: (await createUser()).id,
        level: faker.number.int({ min: 1, max: 5 }),
        createdAt: faker.date.past(),
      },
    });
    skills.push(skill);
  }

  // Create expertise endorsements
  const expertiseCount = faker.number.int({ min: 2, max: 4 });
  const expertise = [];

  for (let i = 0; i < expertiseCount; i++) {
    const exp = await prisma.expertiseEndorsement.create({
      data: {
        userId,
        area: faker.helpers.arrayElement([
          'Frontend Development', 'Backend Development', 'DevOps',
          'System Architecture', 'Database Design', 'UI/UX Design'
        ]),
        endorsedBy: (await createUser()).id,
        details: faker.lorem.paragraph(),
        createdAt: faker.date.past(),
      },
    });
    expertise.push(exp);
  }

  return {
    skills,
    expertise,
  };
}
