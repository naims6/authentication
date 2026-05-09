import { Response } from "express";
import { StatusCodes } from "http-status-codes";

class ApiResponse {
  static success(
    res: Response,
    data: any,
    message: string = "Success",
    statusCode: number = StatusCodes.OK,
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }
}

export default ApiResponse;
