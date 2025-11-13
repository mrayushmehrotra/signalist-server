import { Resend } from "resend";
import {
  WELCOME_EMAIL_TEMPLATE,
  NEWS_SUMMARY_EMAIL_TEMPLATE,
} from "@/lib/nodemailer/templates";

const resend = new Resend(process.env.RESEND_API_KEY!);

// Send Welcome Email
export const sendWelcomeEmail = async ({
  email,
  name,
  intro,
}: {
  email: string;
  name: string;
  intro: string;
}) => {
  const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replace("{{name}}", name).replace(
    "{{intro}}",
    intro,
  );

  await resend.emails.send({
    from: "Signalist <signalist@yourdomain.com>", // Must be a verified sender/domain in Resend
    to: email,
    subject: "Welcome to Signalist - your stock market toolkit is ready!",
    html: htmlTemplate,
    text: "Thanks for joining Signalist",
  });
};

// Send News Summary Email
export const sendNewsSummaryEmail = async ({
  email,
  date,
  newsContent,
}: {
  email: string;
  date: string;
  newsContent: string;
}): Promise<void> => {
  const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE.replace(
    "{{date}}",
    date,
  ).replace("{{newsContent}}", newsContent);

  await resend.emails.send({
    from: "Signalist News <signalist@yourdomain.com>",
    to: email,
    subject: `📈 Market News Summary Today - ${date}`,
    html: htmlTemplate,
    text: `Today's market news summary from Signalist`,
  });
};
