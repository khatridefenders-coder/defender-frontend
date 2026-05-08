import { client } from './client';

export interface LoginResult {
  accessToken: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    role: 'ADMIN' | 'COORDINATOR';
    mustChangePassword: boolean;
  };
}

export const authApi = {
  login: (username: string, password: string) =>
    client.post<LoginResult>('/auth/login', { username, password }).then((r) => r.data),

  changePassword: (newPassword: string, confirmPassword: string) =>
    client.patch('/auth/change-password', { newPassword, confirmPassword }).then((r) => r.data),
};
