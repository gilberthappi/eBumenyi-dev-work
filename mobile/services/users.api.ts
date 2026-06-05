import { IPaged, IResponse, IUser } from "@/types";
import httpClient from "./httpClient";

export const getAllUsers = async (params?: string): Promise<IPaged<IUser[]>> => {
  const queryParams = params ? params : "";
  return (await httpClient.get<IPaged<IUser[]>>(`/auth/users${queryParams}`)).data;
};

export const getAllUsersNopagination = async (params?: string): Promise<IResponse<IUser[]>> => {
  const queryParams = params ? params : "";
  return (await httpClient.get<IResponse<IUser[]>>(`/auth/users/all${queryParams}`)).data;
};

export const getUserById = async (userId: string): Promise<IUser> => {
  const response = await httpClient.get<IResponse<IUser>>(`/auth/users/${userId}`);
  return response.data.data || {} as IUser;
};
