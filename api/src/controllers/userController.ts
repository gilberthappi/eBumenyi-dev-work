/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Body,
  Get,
  Middlewares,
  Post,
  Put,
  Route,
  Security,
  Tags,
  Path,
  Delete,
  Request,
} from "tsoa";
import { UserService } from "../services/userService";
import type {
  ILoginUser,
  IPaged,
  ISignUpUser,
  IUserResponse,
  CreateUserDto,
  UpdateProfileDto,
  IPasswordLogin,
} from "../utils/interfaces/common";
import { loggerMiddleware } from "../utils/loggers/loggingMiddleware";
import { Request as ExpressRequest } from "express";
import { appendPhoto, appendSinglePhoto } from "../middlewares";
import upload from "../utils/cloudinary";
import AppError from "../utils/error";

@Tags("Authentication")
@Route("/api/auth")
export class UserController {
  @Get("/users")
  @Middlewares(loggerMiddleware)
  public getUser(
    @Request() req: ExpressRequest,
  ): Promise<IPaged<IUserResponse[]>> {
    const { searchq, limit, page } = req.query;
    const currentPage = page ? parseInt(page as string) : undefined;
    return UserService.getUsers(
      searchq as string | undefined,
      limit ? parseInt(limit as string) : undefined,
      currentPage,
    );
  }

  @Get("/users/all")
  @Middlewares(loggerMiddleware)
  public getAllUsers(@Request() req: ExpressRequest) {
    const { searchq } = req.query;
    return UserService.getAllUsers(searchq as string | undefined);
  }

  @Get("/staffs")
  @Middlewares(loggerMiddleware)
  public getStaffs(@Request() req: ExpressRequest) {
    const { searchq, limit, page, sortBy, order, role, gender } = req.query;
    const currentPage = page ? parseInt(page as string) : undefined;
    return UserService.getStaffs(
      searchq as string | undefined,
      limit ? parseInt(limit as string) : undefined,
      currentPage,
      sortBy as string | undefined,
      order as "asc" | "desc" | undefined,
      role as string | undefined,
      gender as string | undefined,
    );
  }

  @Get("/staffs/{id}")
  @Middlewares(loggerMiddleware)
  public getStaffById(@Path() id: string) {
    return UserService.getStaffById(id);
  }

  @Put("/staffs/{id}")
  @Security("jwt")
  @Middlewares(upload.any(), appendPhoto)
  public async updateStaffInfo(
    @Path() id: string,
    @Body() body: CreateUserDto & { role?: string },
  ) {
    return UserService.updateStaffInfo(id, body);
  }

  @Get("/users/{id}")
  @Middlewares(loggerMiddleware)
  public getUserById(@Path() id: string) {
    return UserService.getUserById(id);
  }

  @Get("/students")
  @Middlewares(loggerMiddleware)
  public getStudents(@Request() req: ExpressRequest) {
    const { searchq, limit, page } = req.query;
    const currentPage = page ? parseInt(page as string) : undefined;
    return UserService.getStudents(
      searchq as string | undefined,
      limit ? parseInt(limit as string) : undefined,
      currentPage,
    );
  }

  @Get("/students/{id}")
  @Middlewares(loggerMiddleware)
  public getStudentById(@Path() id: string) {
    return UserService.getStudentById(id);
  }

  //delete user
  @Delete("/delete/{id}")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public deleteUser(@Path() id: string) {
    return UserService.deleteUser(id);
  }

  @Put("/update-password")
  @Security("jwt")
  public async updatePassword(
    @Request() req: ExpressRequest,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = body;
    return UserService.updatePassword(userId, currentPassword, newPassword);
  }

  @Post("/request-password-reset")
  public async requestPasswordReset(
    @Body() body: { email: string; platform?: "web" | "mobile" },
  ) {
    const { email, platform } = body;
    return UserService.requestPasswordReset(email, platform);
  }

  @Post("/reset-password")
  public async resetPassword(
    @Body()
    body: {
      token?: string;
      email?: string;
      otp?: string;
      newPassword: string;
    },
  ) {
    if (body.token) {
      return UserService.resetPassword({
        token: body.token,
        newPassword: body.newPassword,
      });
    }

    if (body.email && body.otp) {
      return UserService.resetPassword({
        email: body.email,
        otp: body.otp,
        newPassword: body.newPassword,
      });
    }

    throw new AppError("Either token or email+otp must be provided", 400);
  }

  @Post("/verify-login")
  public verifyLogin(@Body() body: { phoneNumber: string; otp: string }) {
    const { phoneNumber, otp } = body;
    return UserService.verifyLogin(phoneNumber, otp);
  }

  @Post("/signin/student")
  public studentSignIn(@Body() user: ILoginUser) {
    return UserService.studentLogin(user);
  }

  @Post("/signin/staff")
  public staffSignIn(@Body() body: IPasswordLogin) {
    return UserService.staffLogin(body);
  }

  @Post("/signin/student/id-phone")
  public studentSignInWithIDandPhone(
    @Body() body: { phoneNumber: string; nid: string },
  ) {
    const { phoneNumber, nid } = body;
    return UserService.studentLoginWithIDandPhone(phoneNumber, nid);
  }

  //user signup
  @Post("/signup")
  @Middlewares(upload.any(), appendPhoto)
  public async signup(@Body() user: ISignUpUser) {
    return UserService.signUpUser(user);
  }

  @Post("/create")
  @Middlewares(upload.any(), appendPhoto)
  public async createUser(@Body() user: CreateUserDto) {
    return UserService.createUser(user);
  }

  @Put("/update/{id}")
  @Middlewares(upload.any(), appendPhoto)
  @Security("jwt")
  public async updateUser(@Path() id: string, @Body() user: CreateUserDto) {
    return UserService.updateUser(id, user);
  }

  @Get("/me")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public getMe(@Request() req: ExpressRequest) {
    return UserService.getMe(req);
  }

  @Get("/profile")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public getProfile(@Request() req: ExpressRequest) {
    return UserService.getProfile(req);
  }

  @Put("/profile")
  @Security("jwt")
  @Middlewares(upload.any(), appendPhoto, loggerMiddleware)
  public async updateProfile(
    @Request() req: ExpressRequest,
    @Body() profileData: UpdateProfileDto,
  ) {
    return UserService.updateProfile(req, profileData);
  }

  @Put("/profile/avatar")
  @Security("jwt")
  @Middlewares(upload.single("photo"), appendSinglePhoto, loggerMiddleware)
  public async updateAvatar(@Request() req: ExpressRequest) {
    const photo =
      req.file?.path ??
      (typeof req.body.photo === "string" ? req.body.photo : undefined);

    return UserService.updateAvatar(req, photo);
  }

  @Delete("/profile/avatar")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async deleteAvatar(@Request() req: ExpressRequest) {
    return UserService.deleteAvatar(req);
  }

  @Get("/validate-token")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public validateToken(@Request() req: ExpressRequest) {
    return UserService.validateToken(req);
  }

  @Get("/{userId}/online-status")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getUserOnlineStatus(
    @Path() userId: string,
    @Request() req: ExpressRequest,
  ) {
    const socketService = (req.app as any).get("socketService");
    if (!socketService) {
      return {
        success: false,
        message: "Socket service not available",
        data: { userId, isOnline: false, lastSeen: null },
      };
    }

    const isOnline = socketService.isUserOnline(userId);
    const lastSeen = socketService.getUserLastSeen(userId);

    return {
      success: true,
      message: "User online status retrieved",
      data: {
        userId,
        isOnline,
        lastSeen,
      },
    };
  }

  @Get("/online-users")
  @Security("jwt")
  @Middlewares(loggerMiddleware)
  public async getOnlineUsers(@Request() req: ExpressRequest) {
    const socketService = (req.app as any).get("socketService");
    if (!socketService) {
      return {
        success: false,
        message: "Socket service not available",
        data: [],
      };
    }
    const onlineUserIds = socketService.getOnlineUserIds();
    const usersData = await UserService.getUsersByIds(onlineUserIds);
    return {
      success: true,
      message: "Online users retrieved",
      data: usersData.data,
      count: usersData.data.length,
    };
  }
}
