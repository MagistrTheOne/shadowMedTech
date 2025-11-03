import { db } from '../lib/db';
import { scenarios, doctors, companies, users } from '../lib/db/schema';
import { hashPassword } from '../lib/auth/password';
import { eq } from 'drizzle-orm';

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Create test company
    const [company] = await db.insert(companies).values({
      name: 'Test Pharma Corp',
      subscriptionPlan: 'professional',
    }).returning();

    console.log('✅ Company created:', company.name);

    // Create test admin user
    const adminPassword = await hashPassword('admin123');
    const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@test.com')).limit(1);
    let admin;
    if (existingAdmin.length === 0) {
      [admin] = await db.insert(users).values({
        email: 'admin@test.com',
        passwordHash: adminPassword,
        name: 'Admin User',
        role: 'admin',
        companyId: company.id,
      }).returning();
    } else {
      admin = existingAdmin[0];
    }

    console.log('✅ Admin user created:', admin.email);

    // Create test scenarios
    const testScenarios = [
      {
        title: 'Кардиология: Гипертония',
        description: 'Сценарий визита к кардиологу по поводу лечения гипертонии. Пациент - мужчина 55 лет с давлением 160/100.',
        difficultyLevel: 'intermediate' as const,
        promptTemplate: 'Вы - опытный кардиолог. Пациент пришел с жалобами на высокое давление. Будьте профессиональны и требовательны к деталям.',
        category: 'cardiology',
        estimatedDuration: 15,
        learningObjectives: ['Обсуждение антигипертензивных препаратов', 'Объяснение побочных эффектов', 'Рекомендации по образу жизни'],
        isActive: true,
        createdBy: admin.id,
      },
      {
        title: 'Неврология: Мигрень',
        description: 'Визит к неврологу с жалобами на хроническую мигрень. Пациентка - женщина 35 лет.',
        difficultyLevel: 'advanced' as const,
        promptTemplate: 'Вы - опытный невролог. Пациентка жалуется на хроническую мигрень. Будьте логичны и методичны в подходе.',
        category: 'neurology',
        estimatedDuration: 20,
        learningObjectives: ['Диагностика мигрени', 'Выбор триптанов', 'Профилактическое лечение'],
        isActive: true,
        createdBy: admin.id,
      },
      {
        title: 'Эндокринология: Диабет',
        description: 'Консультация эндокринолога по сахарному диабету 2 типа. Пациент - мужчина 45 лет.',
        difficultyLevel: 'beginner' as const,
        promptTemplate: 'Вы - внимательный эндокринолог. Пациент пришел по поводу диабета 2 типа. Будьте терпеливы и поддерживающи.',
        category: 'endocrinology',
        estimatedDuration: 12,
        learningObjectives: ['Объяснение инсулинотерапии', 'Самоконтроль глюкозы', 'Диета и физическая активность'],
        isActive: true,
        createdBy: admin.id,
      },
    ];

    for (const scenario of testScenarios) {
      await db.insert(scenarios).values(scenario);
    }

    console.log('✅ Scenarios created');

    // Create test doctors
    const testDoctors = [
      {
        name: 'Доктор Анна Сергеевна',
        personalityType: 'demanding' as const,
        promptTemplate: 'Вы - опытный кардиолог с 15-летним стажем. Требовательны к деталям, но справедливы. Говорите прямо и профессионально, иногда строго.',
        avatarUrl: null,
        isActive: true,
        createdBy: admin.id,
      },
      {
        name: 'Доктор Михаил Иванович',
        personalityType: 'rational' as const,
        promptTemplate: 'Вы - ведущий невролог клиники, кандидат медицинских наук. Логичны и методичны. Говорите спокойно, детально, ориентируясь на факты.',
        avatarUrl: null,
        isActive: true,
        createdBy: admin.id,
      },
      {
        name: 'Доктор Елена Петровна',
        personalityType: 'empathetic' as const,
        promptTemplate: 'Вы - эндокринолог с 8-летним опытом. Всегда готовы выслушать пациента. Говорите дружелюбно, поддерживающе, терпеливо.',
        avatarUrl: null,
        isActive: true,
        createdBy: admin.id,
      },
    ];

    for (const doctor of testDoctors) {
      await db.insert(doctors).values(doctor);
    }

    console.log('✅ Doctors created');

    // Create test rep user
    const repPassword = await hashPassword('rep123');
    const [rep] = await db.insert(users).values({
      email: 'rep@test.com',
      passwordHash: repPassword,
      name: 'John Rep',
      role: 'rep',
      companyId: company.id,
    }).returning();

    console.log('✅ Rep user created:', rep.email);
    console.log('');
    console.log('📝 Test accounts:');
    console.log('Admin: admin@test.com / admin123');
    console.log('Rep: rep@test.com / rep123');
    console.log('');
    console.log('🎉 Seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
