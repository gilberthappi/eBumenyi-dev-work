import httpClient from './httpClient';
import { WELTEL_WEB_URL } from '@/config/constants';

export type WeltelLoginUrlData = {
  loginUrl: string;
  jwtKey: string;
  name: string;
  phone: string;
};

export type WeltelLoginUrlResponse = {
  message: string;
  statusCode: number;
  data: WeltelLoginUrlData;
};

export function buildWeltelLoginUrl(jwtKey: string): string {
  const base = WELTEL_WEB_URL.replace(/\/$/, '');
  const loginBase = base.endsWith('/login') ? base : `${base}/login`;
  return `${loginBase}?jwtKey=${encodeURIComponent(jwtKey)}`;
}

export async function getWeltelLoginUrl(): Promise<WeltelLoginUrlData> {
  const response = await httpClient.get<WeltelLoginUrlResponse>('/weltel/login-url');
  const body = response.data;

  if (!body?.data?.jwtKey && !body?.data?.loginUrl) {
    throw new Error('WelTel login URL was not returned by the API');
  }

  const jwtKey = body.data.jwtKey;
  const loginUrl =
    body.data.loginUrl ||
    (jwtKey ? buildWeltelLoginUrl(jwtKey) : '');

  return {
    ...body.data,
    loginUrl,
    jwtKey,
  };
}
