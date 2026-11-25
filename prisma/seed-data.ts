import * as argon2 from 'argon2';

export interface SeedUser {
  email: string;
  name: string;
  role: 'admin' | 'customer';
  passwordRaw: string;
}

export interface SeedResourceSchedule {
  weekday: number;
  opensAt: string;
  closesAt: string;
}

export interface SeedResourceBlackout {
  startsAt: Date;
  endsAt: Date;
  reason: string;
}

export interface SeedResource {
  id: string;
  name: string;
  description: string;
  type: string;
  capacity: number;
  city: string;
  timezone: string;
  pricePerHour: number;
  archivedAt: Date | null;
  schedules: SeedResourceSchedule[];
  blackouts: SeedResourceBlackout[];
}

export const SEED_USERS: SeedUser[] = [
  {
    email: 'admin@reserva.com',
    name: 'System Admin',
    role: 'admin',
    passwordRaw: 'Admin123!',
  },
  {
    email: 'customer1@reserva.com',
    name: 'John Doe',
    role: 'customer',
    passwordRaw: 'User123!',
  },
  {
    email: 'customer2@reserva.com',
    name: 'Jane Smith',
    role: 'customer',
    passwordRaw: 'User123!',
  },
];

export const SEED_RESOURCES: SeedResource[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Kyiv Main Conference Room',
    description:
      'Spacious conference room equipped with 4K projector, whiteboard, and video conferencing.',
    type: 'room',
    capacity: 12,
    city: 'Kyiv',
    timezone: 'Europe/Kyiv',
    pricePerHour: 50000,
    archivedAt: null,
    schedules: [1, 2, 3, 4, 5].map((weekday) => ({
      weekday,
      opensAt: '09:00',
      closesAt: '18:00',
    })),
    blackouts: [
      {
        startsAt: new Date(Date.now() + 14 * 24 * 3600 * 1000),
        endsAt: new Date(Date.now() + 14 * 24 * 3600 * 1000 + 9 * 3600 * 1000),
        reason: 'Scheduled HVAC Maintenance',
      },
    ],
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Podil Focus Desk 1',
    description:
      'Quiet dedicated desk with ergonomic chair, dual monitors, and high-speed fiber internet.',
    type: 'desk',
    capacity: 1,
    city: 'Kyiv',
    timezone: 'Europe/Kyiv',
    pricePerHour: 10000,
    archivedAt: null,
    schedules: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      opensAt: '08:00',
      closesAt: '22:00',
    })),
    blackouts: [],
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Pechersk Tennis Court 1',
    description: 'Outdoor clay court with night illumination and changing rooms.',
    type: 'court',
    capacity: 4,
    city: 'Kyiv',
    timezone: 'Europe/Kyiv',
    pricePerHour: 80000,
    archivedAt: null,
    schedules: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      opensAt: '07:00',
      closesAt: '23:00',
    })),
    blackouts: [],
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'Lviv Meeting Room Glass',
    description:
      'Modern glass meeting room in central Lviv, ideal for team syncs and client presentations.',
    type: 'room',
    capacity: 6,
    city: 'Lviv',
    timezone: 'Europe/Kyiv',
    pricePerHour: 35000,
    archivedAt: null,
    schedules: [1, 2, 3, 4, 5].map((weekday) => ({
      weekday,
      opensAt: '09:00',
      closesAt: '19:00',
    })),
    blackouts: [],
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    name: 'Kyiv Night Lounge',
    description: 'Atmospheric evening lounge open overnight for late-night work or events.',
    type: 'room',
    capacity: 8,
    city: 'Kyiv',
    timezone: 'Europe/Kyiv',
    pricePerHour: 60000,
    archivedAt: null,
    schedules: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      opensAt: '20:00',
      closesAt: '04:00',
    })),
    blackouts: [],
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    name: 'Archived Workshop Room',
    description: 'Old workshop space no longer available for booking.',
    type: 'room',
    capacity: 20,
    city: 'Kyiv',
    timezone: 'Europe/Kyiv',
    pricePerHour: 60000,
    archivedAt: new Date('2025-01-01T00:00:00.000Z'),
    schedules: [],
    blackouts: [],
  },
];

export async function seed(prisma: any): Promise<void> {
  for (const user of SEED_USERS) {
    const passwordHash = await argon2.hash(user.passwordRaw, { type: argon2.argon2id });
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
      },
    });
  }

  for (const res of SEED_RESOURCES) {
    await prisma.resource.upsert({
      where: { id: res.id },
      update: {
        name: res.name,
        description: res.description,
        type: res.type,
        capacity: res.capacity,
        city: res.city,
        timezone: res.timezone,
        pricePerHour: res.pricePerHour,
        archivedAt: res.archivedAt,
      },
      create: {
        id: res.id,
        name: res.name,
        description: res.description,
        type: res.type,
        capacity: res.capacity,
        city: res.city,
        timezone: res.timezone,
        pricePerHour: res.pricePerHour,
        archivedAt: res.archivedAt,
      },
    });

    await prisma.resourceSchedule.deleteMany({
      where: { resourceId: res.id },
    });

    if (res.schedules.length > 0) {
      await prisma.resourceSchedule.createMany({
        data: res.schedules.map((s) => ({
          resourceId: res.id,
          weekday: s.weekday,
          opensAt: s.opensAt,
          closesAt: s.closesAt,
        })),
      });
    }

    await prisma.resourceBlackout.deleteMany({
      where: { resourceId: res.id },
    });

    if (res.blackouts.length > 0) {
      await prisma.resourceBlackout.createMany({
        data: res.blackouts.map((b) => ({
          resourceId: res.id,
          startsAt: b.startsAt,
          endsAt: b.endsAt,
          reason: b.reason,
        })),
      });
    }
  }
}
