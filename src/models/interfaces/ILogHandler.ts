export interface IMessageHandler {
    /**
     * Функция обработки данных из брокера Kafka
     * @returns void
     */
    messageHandler<T>(log: T): void;
  }
  
  export interface IMessageHandlerSync {
    /**
     * Функция обработки данных из брокера Kafka async
     * @returns Promise<void>
     */
    messageHandler<T>(log: T): Promise<void>;
  }