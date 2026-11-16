import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { AuthService } from "./auth.service";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const RETRY_DELAY_MILLISECONDS = 5 * 60 * 1000;

@Injectable()
export class SemesterCreditScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SemesterCreditScheduler.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly authService: AuthService) {}

  async onModuleInit() {
    await this.grantAndSchedule();
  }

  onModuleDestroy() {
    if (this.timer) clearTimeout(this.timer);
  }

  private async grantAndSchedule() {
    try {
      await this.authService.grantCurrentSemesterCredits();
      this.scheduleNextCheck();
    } catch (error) {
      this.logger.error(
        "Falha ao conceder créditos semestrais; nova tentativa em cinco minutos.",
        error instanceof Error ? error.stack : String(error),
      );
      this.timer = setTimeout(
        () => void this.grantAndSchedule(),
        RETRY_DELAY_MILLISECONDS,
      );
    }
  }

  private scheduleNextCheck() {
    const now = new Date();
    const nextSemester =
      now.getMonth() < 6
        ? new Date(now.getFullYear(), 6, 1)
        : new Date(now.getFullYear() + 1, 0, 1);
    const delay = Math.max(
      1000,
      Math.min(nextSemester.getTime() - now.getTime(), DAY_IN_MILLISECONDS),
    );

    this.timer = setTimeout(() => {
      if (new Date() >= nextSemester) {
        void this.grantAndSchedule();
      } else {
        this.scheduleNextCheck();
      }
    }, delay);
  }
}
