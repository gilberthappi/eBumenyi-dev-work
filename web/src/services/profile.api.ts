import { IPaged, IUser } from "@/types/common";
import api from "./api";

export const getProfile = async (): Promise<IPaged<IUser>> => {
  return (await api.get("/auth/profile")).data;
};

export const updateProfile = async (data: FormData): Promise<IUser> => {
  return (await api.put("/auth/profile", data)).data;
};

export const updateAvatar = async (data: FormData): Promise<{ photo: string }> => {
  return (await api.put("/auth/profile/avatar", data)).data;
};

export const deleteAvatar = async (): Promise<{ photo: string }> => {
  return (await api.delete("/auth/profile/avatar")).data;
};
