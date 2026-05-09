import z from "zod";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import AppError from "../utils/AppError";

const validateRequest = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: result.error.issues[0]?.message || "Invalid request data",
          errors: result.error.issues,
        });
      }
      req.body = result.data;
      next();
    } catch (error) {
      next(
        new AppError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Internal server error",
        ),
      );
    }
  };
};

export default validateRequest;
