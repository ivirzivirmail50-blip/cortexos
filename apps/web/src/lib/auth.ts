import { UserService } from '@cortexos/db';

export async function getLocalUser() {
  return UserService.ensureLocalUser();
}

export async function getLocalUserId(): Promise<string> {
  const user = await getLocalUser();
  return user.id;
}
