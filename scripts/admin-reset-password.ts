import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { Prisma } from "@prisma/client";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";

const ETX = "\u0003";
const BACKSPACE_KEYS = new Set(["\u007f", "\b"]);

async function readHidden(prompt: string): Promise<string> {
  if (!stdin.isTTY) {
    stdout.write(`${prompt}(aviso: stdin não é TTY, a senha será lida em texto visível)\n`);
    const rl = createInterface({ input: stdin, output: stdout });
    try {
      return await rl.question("");
    } finally {
      rl.close();
    }
  }

  return new Promise<string>((resolve, reject) => {
    stdout.write(prompt);
    let buffer = "";
    const onData = (chunk: Buffer) => {
      const str = chunk.toString("utf8");
      for (const ch of str) {
        if (ch === "\r" || ch === "\n") {
          stdin.removeListener("data", onData);
          stdin.setRawMode(false);
          stdin.pause();
          stdout.write("\n");
          resolve(buffer);
          return;
        }
        if (ch === ETX) {
          stdin.removeListener("data", onData);
          stdin.setRawMode(false);
          stdin.pause();
          reject(new Error("Cancelado pelo usuário (Ctrl+C)."));
          return;
        }
        if (BACKSPACE_KEYS.has(ch)) {
          if (buffer.length > 0) {
            buffer = buffer.slice(0, -1);
            stdout.write("\b \b");
          }
          continue;
        }
        buffer += ch;
        stdout.write("*");
      }
    };
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    stdin.on("data", onData);
  });
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });
  const defaultEmail = process.env.ADMIN_SEED_EMAIL ?? "";
  const emailPrompt = defaultEmail ? `Email do admin [${defaultEmail}]: ` : "Email do admin: ";
  const emailAnswer = (await rl.question(emailPrompt)).trim();
  const email = emailAnswer || defaultEmail;
  rl.close();

  if (!email) {
    console.error("Erro: nenhum email fornecido.");
    process.exitCode = 1;
    return;
  }

  const password = await readHidden("Nova senha: ");
  if (password.length < 8) {
    console.error("Erro: a senha precisa ter pelo menos 8 caracteres.");
    process.exitCode = 1;
    return;
  }
  const confirm = await readHidden("Confirme a nova senha: ");
  if (password !== confirm) {
    console.error("Erro: as senhas não conferem.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(password);

  try {
    const updated = await db.adminUser.update({
      where: { email },
      data: { passwordHash },
      select: { email: true },
    });
    console.log(`Senha atualizada com sucesso para ${updated.email}.`);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      console.error(`Erro: nenhum admin encontrado com o email "${email}".`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
