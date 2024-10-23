import { IMessageHandlerSync, IMessageHandler } from './handler/IHandler';

//Интерфейс для определения функционала kafka и данных из kafka
export interface IConsumerKafka {
  /**
   * Функция отключения к потребителя
   */
  disconnectConsumer(): Promise<void>;
  /**
   * Функция приемник, которая прослушивает топик и получает из него данные и передает в новый реализованный IMessageHandler
   */
  kafkaConsumer(handler: IMessageHandler): Promise<void>;
  /**
   * Функция приемник, которая прослушивает топик и получает из него данные и передает в новый реализованный IMessageHandlerSync
   */
  kafkaConsumerSync(handler: IMessageHandlerSync): Promise<void>;
}
