import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import nodemailer, { Transporter } from "nodemailer";
import { PrismaService } from "../prisma/prisma.service";

export interface OutgoingEmail {
  recipient: string;
  subject: string;
  text: string;
}

@Injectable()
export class EmailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;
  private readonly sender: string | null;
  private readonly pendingInterval: NodeJS.Timeout;
  private isDelivering = false;

  constructor(private readonly prisma: PrismaService) {
    const host = process.env.SMTP_HOST;
    this.sender = process.env.SMTP_FROM ?? null;
    const username = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const smtpConfigured = [host, this.sender, username, password].some(
      Boolean,
    );
    if (
      smtpConfigured &&
      (!host ||
        !this.sender ||
        (username && !password) ||
        (!username && password) ||
        !Number.isInteger(port) ||
        port < 1 ||
        port > 65535)
    ) {
      throw new Error(
        "Configure SMTP_HOST, SMTP_FROM e credenciais SMTP válidas em conjunto.",
      );
    }

    this.transporter =
      host && this.sender
        ? nodemailer.createTransport({
            host,
            port,
            secure: process.env.SMTP_SECURE === "true",
            ...(username &&
              password && {
                auth: { user: username, pass: password },
              }),
          })
        : null;
    this.pendingInterval = setInterval(() => {
      void this.deliverPending();
    }, 60_000);
  }

  onModuleInit() {
    void this.deliverPending();
  }

  onModuleDestroy() {
    clearInterval(this.pendingInterval);
  }

  async enqueue(
    transaction: Prisma.TransactionClient,
    emails: OutgoingEmail[],
  ): Promise<string[]> {
    const records = await Promise.all(
      emails.map((email) =>
        transaction.emailOutbox.create({
          data: email,
          select: { id: true },
        }),
      ),
    );
    return records.map(({ id }) => id);
  }

  async dispatch(ids: string[]) {
    if (this.transporter) {
      await this.deliverPending(ids);
    }
    const pending = await this.prisma.emailOutbox.findMany({
      where: { id: { in: ids }, sentAt: null },
      select: { lastError: true },
    });
    return {
      status: pending.length === 0 ? "sent" : "pending",
      pendingCount: pending.length,
      lastError: pending.find(({ lastError }) => lastError)?.lastError ?? null,
    };
  }

  private async deliverPending(ids?: string[]) {
    if (!this.transporter || !this.sender || this.isDelivering) return;
    this.isDelivering = true;
    try {
      const emails = await this.prisma.emailOutbox.findMany({
        where: {
          sentAt: null,
          nextAttemptAt: { lte: new Date() },
          ...(ids && { id: { in: ids } }),
        },
        orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
        take: 50,
      });

      for (const email of emails) {
        try {
          await this.transporter.sendMail({
            from: this.sender,
            to: email.recipient,
            subject: email.subject,
            text: email.text,
          });
          await this.prisma.emailOutbox.update({
            where: { id: email.id },
            data: { sentAt: new Date(), lastError: null },
          });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Falha desconhecida no SMTP.";
          const retryDelay = Math.min(
            60_000 * 2 ** Math.min(email.attempts, 6),
            60 * 60_000,
          );
          await this.prisma.emailOutbox.update({
            where: { id: email.id },
            data: {
              attempts: { increment: 1 },
              lastError: message,
              nextAttemptAt: new Date(Date.now() + retryDelay),
            },
          });
          this.logger.error(
            `Falha ao enviar e-mail de notificação ${email.id}: ${message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        "Falha ao processar a fila de e-mails.",
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.isDelivering = false;
    }
  }
}
