import { MessageLog } from '../../models';

export interface ILogHandler {
  /**
   * Функция обработки данных из брокера Kafka
   * @returns void
   */
  logHandler(log: MessageLog): void;
}

export interface IMessageHandlerSync {
  /**
   * Функция обработки данных из брокера Kafka async
   * @returns Promise<void>
   */
  logHandler(log: MessageLog): Promise<void>;
}
