/* eslint-disable @typescript-eslint/no-explicit-any */
import { ICreateUser } from "./users.schema";

export interface IUser extends ICreateUser {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileAvatarProps {
  name: string;
  size: "w-24 h-24" | "w-10 h-10" | "w-7 h-7" | "w-6 h-6" | "w-8 h-8" | "w-10 h-6" | any;
  rounded?: boolean;
  color?: string;
  photo?: string;
  className?: string;
}

export interface IUserStatus {
  id?: string;
  isActive: boolean;
}

export interface IUpdateUserProfile extends Partial<IUser> {
  id: string;
}
