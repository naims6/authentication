import ApiResponse from "../../utils/ApiResponse";
import catchAsync from "../../utils/catchAsync";
import { AuthService } from "./auth.service";

const register = catchAsync(async (req, res) => {
  const result = AuthService.registerUser(req.body);
  ApiResponse.success(res, result, "User registered successfully");
});

const login = catchAsync(async (req, res) => {
  const result = AuthService.loginUser(req.body);
  ApiResponse.success(res, result, "User logged in successfully");
});

export const AuthController = {
  register,
  login,
};
