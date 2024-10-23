import dayjs from 'dayjs';
import { DataStep, MessageLog, Step } from '../models/models';
import { createHash } from 'crypto';
import { Kafka, Producer } from 'kafkajs';
import { IProducerKafka } from '../models/interfaces/IProducer';

export class ProducerKafka implements IProducerKafka {
  private kafka: Kafka | undefined;
  private producer: Producer | undefined;
  private topic: string;
  private urls: string[];
  private clientId: string;
  private logLevel: number;
  private isTopic: boolean | undefined;
  private serverName: string;

  constructor(urls: string[], clientId: string, topic: string, serverName: string, isTopic?: boolean, logLevel?: number) {
    this.topic = topic;
    this.urls = urls;
    this.clientId = clientId;
    this.logLevel = logLevel ? logLevel : 4;
    this.kafka = undefined;
    this.producer = undefined;
    this.isTopic = isTopic ? isTopic : false;
    this.serverName = serverName;
  }

  private createKafka(urls: string[], clientId: string, logLevel?: number) {
    return new Kafka({
      clientId,
      logLevel,
      brokers: urls,
    });
  }

  private createMessageLog(req: any, res: any, body: any | string, stepsLog: Step[]): MessageLog {
    const message: MessageLog = {
      server: this.serverName,
      hash: dayjs().valueOf().toString(),
      pid: process.pid,
      request: {
        id: req.id,
        method: req.method,
        path: req.url,
        requestTime: req.time,
        headers: {
          Host: req.header('Host')?.toString(),
          ContentType: req.header('Content-Type')?.toString(),
        },
        body: req.body,
      },
      response: {
        status: res.statusCode,
        body: body,
        responseTime: dayjs().valueOf(),
      },
      time: dayjs().valueOf() - req.time,
      steps: stepsLog,
    };

    message.hash = createHash('sha256')
      .update(String(message) + dayjs().valueOf().toString() + Math.floor(1000 + Math.random() * 9000))
      .digest('hex');
    return message;
  }

  async sendLog(
    req: any,
    res: any,
    body: any | string,
    stepsLog: Step[]
  ): Promise<string> {
    const method: string = 'sendLog';
    const dataLog: MessageLog = this.createMessageLog(req, res, body, stepsLog);
    if (!this.kafka) {
      this.kafka = this.createKafka(this.urls, this.clientId, this.logLevel);
    }
    try {
      this.producer = await this.connectProducer(this.isTopic);
      await this.producer.send({
        topic: this.topic,
        messages: [{ key: 'dealersKey', value: JSON.stringify(dataLog) }],
      });
      return dataLog.hash;
    } catch (error) {
      this.kafka.logger().error(`Ошибка отправки MessageLog: ${JSON.stringify(dataLog)} в method: ${method}`);
      return 'Возникла ошибка запроса, повторите попытку снова';
    }
  }

  private async connectProducer(isTopic?: boolean | undefined): Promise<Producer> {
    if (!this.kafka) {
      this.kafka = this.createKafka(this.urls, this.clientId, this.logLevel);
    }
    if (this.producer) {
      this.kafka.logger().info(`Producer allready exists.`);
      return this.producer;
    }
    this.kafka.logger().info(`Connect new producer.`);
    this.producer = this.kafka.producer({ allowAutoTopicCreation: isTopic ? isTopic : false });
    await this.producer.connect();
    this.kafka.logger().info(`Producer is connected`);
    return this.producer;
  }

  async disconnectProducer(): Promise<void> {
    if (!this.kafka) {
      this.kafka = this.createKafka(this.urls, this.clientId, this.logLevel);
    }
    this.kafka.logger().info(`Disconnect producer.`);
    if (this.producer) await this.producer.disconnect();
    this.kafka.logger().info(`Producer is disconnected.`);
  }

  addLog(logs: Step[], logData: DataStep, logLevel: string): void {
    const step: Step = {
      level: logLevel,
      dataStep: logData,
    };
    logs.push(step);
  }
}
