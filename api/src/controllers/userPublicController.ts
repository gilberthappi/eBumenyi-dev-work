import { Get, Middlewares, Path, Route, Tags } from "tsoa";
import { UserService } from "../services/userService";
import { loggerMiddleware } from "../utils/loggers/loggingMiddleware";

@Route("/api/user")
@Tags("Users")
export class UserPublicController {
  @Get("/by-phone/{phoneNumber}")
  @Middlewares(loggerMiddleware)
  public getUserByPhone(@Path() phoneNumber: string) {
    return UserService.getUserByPhone(phoneNumber);
  }
}
