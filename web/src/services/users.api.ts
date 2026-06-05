import { IPaged, IResponse } from "@/types";
import {
  IUser,
} from "../types/common";
import api from "./api";

export const getAllUsers = async (params?: string): Promise<IPaged<IUser[]>> => {
  const queryParams = params ? params : "";
  return (await api.get(`/auth/users${queryParams}`)).data;
};

export const getAllUsersNopagination = async (params?: string): Promise<IResponse<IUser[]>> => {
  const queryParams = params ? params : "";
  return (await api.get(`/auth/users/all${queryParams}`)).data;
};
export const createUser = async (
  data: FormData
): Promise<IUser> => {
  return (await api.post("/auth/create", data)).data;
};

export const updateUser = async (
  id: string,
  data: FormData,
): Promise<IUser> => {
  return (await api.put(`/auth/update/${id}`, data)).data;
};

export const deleteUser = async (id: string): Promise<number> => {
  return (await api.delete(`/auth/delete/${id}`)).data;
};

export const getProfile = async (): Promise<IResponse<IUser>> => {
  return (await api.get("/auth/profile")).data;
};