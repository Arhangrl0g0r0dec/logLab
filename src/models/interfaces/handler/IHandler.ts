import { MessageLog } from '../../models';

export interface IMessageHandler {
  /**
   * Функция обработки данных из брокера Kafka
   * @returns void
   */
  messageHandler(log: MessageLog): void;
}

export interface IMessageHandlerSync {
  /**
   * Функция обработки данных из брокера Kafka async
   * @returns Promise<void>
   */
  messageHandler(log: MessageLog): Promise<void>;
}
