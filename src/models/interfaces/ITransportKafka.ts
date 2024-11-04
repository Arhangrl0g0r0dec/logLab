import { ConsumerKafka } from '../../clientsKafka/Consumer';
import { ProducerKafka } from '../../clientsKafka/Producer';

//Интерфейс для определения функционала логирования
export interface ITransportKafka {
  /**
   * Функция создания concumer
   * @returns Consumer из kafkajs package
   */
  createConsumer(groupId: string, topics: string[]): ConsumerKafka;
  /**
   * Функция создания producer
   * @returns Producer из kafkajs package
   */
  createProducer(topic?: string, serverName?: string): ProducerKafka;
}