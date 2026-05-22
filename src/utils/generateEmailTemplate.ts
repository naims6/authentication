import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import ejs from "ejs";

export const generateEmailTemplate = async (
  templateName: string,
  data: any,
) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // const templatePath = `${__dirname}/../templates/${templateName}.ejs`;

  const allowedTemplates = new Set(["otpVerification"]);
  if (!allowedTemplates.has(templateName)) {
    throw new Error("Invalid email template");
  }

  const templatePath = resolve(
    __dirname,
    "../templates",
    `${templateName}.ejs`,
  );

  return ejs.renderFile(templatePath, data);
};
