import { describe, expect, test } from "bun:test";
import { AppError, NotFoundError, UnauthorizedError, ValidationError } from "./errors";

describe("AppError", () => {
  test("serializes code and message", () => {
    const error = new AppError("boom", 418, "TEAPOT");

    expect(error.toJSON()).toEqual({
      error: {
        code: "TEAPOT",
        message: "boom",
      },
    });
  });

  test("preserves specialized error defaults", () => {
    expect(new NotFoundError("user", "42")).toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });

    expect(new ValidationError("invalid", { field: ["required"] })).toMatchObject({
      statusCode: 422,
      code: "VALIDATION_ERROR",
      details: { field: ["required"] },
    });

    expect(new UnauthorizedError()).toMatchObject({
      statusCode: 401,
      code: "UNAUTHORIZED",
    });
  });
});
