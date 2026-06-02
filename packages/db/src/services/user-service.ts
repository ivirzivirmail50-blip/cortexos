import { db } from '../client';
import { users } from '../schema';
import { eq } from 'drizzle-orm';

export interface CreateUserInput {
  clerkId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

export class UserService {
  static async getUserByClerkId(clerkId: string) {
    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId));
    return user || null;
  }

  static async getDefaultUser() {
    const [user] = await db.select().from(users).limit(1);
    return user || null;
  }

  static async createUser(input: CreateUserInput) {
    if (input.clerkId) {
      const existing = await this.getUserByClerkId(input.clerkId);
      if (existing) {
        const [updated] = await db
          .update(users)
          .set({
            email: input.email,
            firstName: input.firstName ?? null,
            lastName: input.lastName ?? null,
            imageUrl: input.imageUrl ?? null,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, input.clerkId))
          .returning();
        return updated;
      }
    }
    const [user] = await db.insert(users).values({
      clerkId: input.clerkId ?? 'local-user',
      email: input.email,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      imageUrl: input.imageUrl ?? null,
    }).returning();
    return user;
  }

  static async ensureLocalUser() {
    const existing = await this.getDefaultUser();
    if (existing) return existing;
    return this.createUser({
      clerkId: 'local-user',
      email: 'user@cortexos.local',
      firstName: 'CortexOS',
      lastName: 'User',
    });
  }
}
