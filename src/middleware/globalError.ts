import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { ErrorResponse } from "../types";
import config from "../config/env";

const globalError: ErrorRequestHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";

  // Handle known Prisma client errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.log(err);
    switch (err.code) {
      case "P1000":
        message = "Authentication failed against the database server.";
        statusCode = StatusCodes.BAD_GATEWAY;
        break;

      case "P1001":
        message = "Cannot reach the database server. Please check connection.";
        statusCode = StatusCodes.BAD_GATEWAY;
        break;

      case "P1002":
        message = "The database operation timed out.";
        statusCode = StatusCodes.REQUEST_TIMEOUT;
        break;

      case "P2000":
        message = "Value too long for a database column.";
        statusCode = StatusCodes.BAD_REQUEST;
        break;

      case "P2001":
        message = "Record not found.";
        statusCode = StatusCodes.NOT_FOUND;
        break;

      case "P2002":
        message = "Duplicate key error — unique constraint failed.";
        statusCode = StatusCodes.CONFLICT;
        break;

      case "P2003":
        message = "Foreign key constraint failed.";
        statusCode = StatusCodes.BAD_REQUEST;
        break;

      case "P2004":
        message = "Database constraint failed.";
        statusCode = StatusCodes.BAD_REQUEST;
        break;

      case "P2005":
        message = "Invalid value stored in the database.";
        statusCode = StatusCodes.BAD_REQUEST;
        break;

      case "P2006":
        message = "Invalid value type provided for the field.";
        statusCode = StatusCodes.BAD_REQUEST;
        break;

      case "P2007":
        message = "Data validation error.";
        statusCode = StatusCodes.BAD_REQUEST;
        break;

      case "P2008":
        message = "Query parsing failed.";
        statusCode = StatusCodes.BAD_REQUEST;
        break;

      case "P2009":
        message = "Query validation failed.";
        statusCode = StatusCodes.BAD_REQUEST;
        break;

      case "P2010":
        message = "Raw query failed. Check your query syntax.";
        statusCode = StatusCodes.BAD_REQUEST;
        break;

      case "P2011":
        message = "Null constraint violation — missing required field.";
        statusCode = StatusCodes.BAD_REQUEST;
        break;

      case "P2012":
        message = "Missing required value for a field.";
        statusCode = StatusCodes.BAD_REQUEST;
        break;

      case "P2013":
        message = "Missing required argument for a field.";
        statusCode = StatusCodes.BAD_REQUEST;
        break;

      case "P2014":
        message = "Relation violation between records.";
        statusCode = StatusCodes.BAD_REQUEST;
        break;

      case "P2015":
        message = "Related record not found.";
        statusCode = StatusCodes.NOT_FOUND;
        break;

      case "P2016":
        message = "Query interpretation error.";
        statusCode = StatusCodes.BAD_REQUEST;
        break;

      case "P2017":
        message = "Record relation inconsistency.";
        statusCode = StatusCodes.BAD_REQUEST;
        break;

      case "P2018":
        message = "Required connected record not found.";
        statusCode = StatusCodes.NOT_FOUND;
        break;

      case "P2019":
        message = "Input error — invalid data.";
        statusCode = StatusCodes.BAD_REQUEST;
        break;

      case "P2020":
        message = "Value out of range for the column type.";
        statusCode = StatusCodes.BAD_REQUEST;
        break;

      case "P2021":
        message = "Table not found in the database.";
        statusCode = StatusCodes.NOT_FOUND;
        break;
    }
  }

  const response: ErrorResponse = {
    success: false,
    message,
  };

  //   only for development environment, include stack and error details
  if (config.node_env === "development") {
    response.stack = err.stack;
    response.error = err;
  }
  res.status(statusCode).json(response);
};

export default globalError;
