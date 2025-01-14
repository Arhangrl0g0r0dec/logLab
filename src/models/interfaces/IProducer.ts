import { DataStep, Step } from '../models';

//Интерфейс для определения функционала логирования
export interface IProducerKafka {
  /**
   * Функция передачи сообщения MessageLog в Kafka
   * @param dataLog Тип MessageLog
   * @returns Строку hash | 'Возникла ошибка запроса, повторите попытку снова'
   */
  sendLog(req: any, res: any, stepsLog: Step[], body?: any): Promise<string>;
  /**
   * Функция отключения producer от kafka
   */
  disconnectProducer(): Promise<void>;
  /**
   * Функция занесения данных о шагах выполнения программы
   * @param logs массив Step который создается в Controller
   * @param logData Данные об определенном шаге программыл, тип DataStep
   * @param logLevel Уровень лога
   */
  addLog(logs: Step[], dataStep: DataStep, logLevel: string): void;
}
