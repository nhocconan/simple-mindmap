import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123!', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mindmap.app' },
    update: {},
    create: {
      email: 'admin@mindmap.app',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      isVerified: true,
      isActive: true,
    },
  });

  console.log('Created admin user:', admin.email);

  // Create default settings
  const defaultSettings = [
    {
      key: 'recaptcha_enabled',
      value: { enabled: false },
      description: 'Enable reCAPTCHA for registration and login',
    },
    {
      key: 'smtp_settings',
      value: {
        host: '',
        port: 587,
        secure: false,
        user: '',
        password: '',
        from: 'noreply@mindmap.app',
      },
      description: 'SMTP configuration for sending emails',
    },
    {
      key: 'cache_settings',
      value: {
        enabled: true,
        ttl: 3600,
      },
      description: 'Cache configuration',
    },
    {
      key: 'general_settings',
      value: {
        appName: 'MindMap Pro',
        allowRegistration: true,
        requireEmailVerification: false,
        maxMindmapsPerUser: 100,
      },
      description: 'General application settings',
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('Created default settings');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
