import { hashPassword, verifyPassword } from "@/lib/password";
import { describe, expect, it } from "vitest";

describe("verifyPassword", () => {
  it("returns true when the password matches the hash", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
  });

  it("returns false when the password does not match", async () => {
    const hash = await hashPassword("correct horse battery staple");
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });

  it("returns false (instead of throwing) when the hash is invalid", async () => {
    await expect(verifyPassword("anything", "not-a-real-hash")).resolves.toBe(false);
  });
});
