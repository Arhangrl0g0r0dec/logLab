import dayjs from 'dayjs';
import { DataStep, MessageLog, Step } from '../models/models';
import { createHash } from 'crypto';
import { Admin, Kafka, Producer, RetryOptions } from 'kafkajs';
import { IProducerKafka } from '../models/interfaces/IProducer';
import fs from 'fs';

export class ProducerKafka implements IProducerKafka {
  private kafka: Kafka | undefined;
  private producer: Producer | undefined;
  private topic: string;
  private urls: string[];
  private clientId: string;
  private logLevel: number;
  private isTopic: boolean | undefined;
  private serverName: string;
  private admin: Admin | undefined;
  private isWork: boolean;
  private retryOptions: RetryOptions = {};
  private isFile: boolean;
  private pathSaveFile: string;

  constructor(urls: string[], clientId: string, topic: string, serverName: string, pathSaveFile: string, retry: RetryOptions, isTopic?: boolean, logLevel?: number) {
    this.topic = topic;
    this.urls = urls;
    this.clientId = clientId;
    this.logLevel = logLevel ? logLevel : 4;
    this.kafka = undefined;
    this.producer = undefined;
    this.isTopic = isTopic ? isTopic : false;
    this.serverName = serverName;
    this.isWork = true;
    this.admin = undefined;
    this.retryOptions = retry;
    this.isFile = false;
    this.pathSaveFile = pathSaveFile;
  }

  private createKafka() {
    return new Kafka({
      clientId: this.clientId,
      logLevel: this.logLevel,
      brokers: this.urls,
      retry: this.retryOptions
    });
  }

  private async createAdmin(): Promise<any> {
    const method: string = 'createAdmin';
    if (!this.kafka) {
        this.kafka = this.createKafka();
    }

    try {
        this.kafka.logger().info('Create AdminClient...');
        if (this.admin) {
          this.kafka.logger().info('AdminClient allready exists.');
          return;
        }
        this.kafka.logger().info('Create new AdminClient.');
        this.admin = this.kafka.admin();
        await this.admin.connect();
        return;
    } catch (err) {
        await this.disconnectAdmin();
        this.kafka.logger().info(`Error in method ${method}. Error: ${err}`);
    }
  }

  private async disconnectAdmin(): Promise<void> {
    if (!this.kafka) {
      this.kafka = this.createKafka();
    }
    this.kafka.logger().info('Disconnect Admin from kafka.');
    if (this.admin) await this.admin.disconnect();
    this.kafka.logger().info('Admin is disconnected.');
  }

  private sendFile(message: any | MessageLog): void {
    try {
      this.isFile = false;
      let messages: MessageLog[] = [];
      if(fs.existsSync(`${this.pathSaveFile}/kafkaBridgeLogs.json`)) {
        const rawdata = fs.readFileSync(`${this.pathSaveFile}/kafkaBridgeLogs.json`);
        messages = JSON.parse(String(rawdata));
        messages.push(message);
        fs.writeFileSync(`${this.pathSaveFile}/kafkaBridgeLogs.json`, `${JSON.stringify(messages)}`);
      } else {
        fs.mkdirSync(this.pathSaveFile, { recursive: true });
        messages.push(message);
        fs.writeFileSync(`${this.pathSaveFile}/kafkaBridgeLogs.json`, `${JSON.stringify(messages)}`);
      }
    } catch(error: unknown) {
      this.kafka?.logger().error(`Возникла ошибка при записи данных в файл: ${JSON.stringify(error)}`);
    }
  }

  async sendLog(dataLog: any | MessageLog): Promise<string> {
    const method: string = 'sendLog';
    if (!this.kafka) {
      this.kafka = this.createKafka();
    }
    try {
      this.isWork = await this.checkKafka();
      if (!this.isWork) {
        this.sendFile(dataLog);
        return dataLog.hash;
      } else {
        this.producer = await this.connectProducer(this.isTopic);
        
        if(this.isFile) {
          await this.sendLogFromFile(this.producer);
        }

        await this.producer.send({
          topic: this.topic,
          messages: [{ value: JSON.stringify(dataLog) }],
        });
        return dataLog.hash;
      }
    } catch (error) {
        this.sendFile(dataLog);
        this.kafka? this.kafka.logger().error(`Ошибка отправки MessageLog: ${JSON.stringify(dataLog)} в method: ${method}`) : console.log(`Ошибка отправки MessageLog: ${JSON.stringify(dataLog)} в method: ${method}`);
        return dataLog.hash;
    }
  }

  private async sendLogFromFile(producer: Producer): Promise<void> {
    let messages: MessageLog[] = [];
      if(fs.existsSync(`${this.pathSaveFile}/kafkaBridgeLogs.json`)) {
        const rawdata = fs.readFileSync(`${this.pathSaveFile}/kafkaBridgeLogs.json`);
        messages = JSON.parse(String(rawdata));
        for(let i = messages.length - 1; i >= 0; i--) {
          this.kafka?.logger().info(`Message from file was sended to kafka ${messages[i]}`);
          await producer.send({
            topic: this.topic,
            messages: [{ value: JSON.stringify(messages[i]) }],
          });
        }
        fs.unlinkSync(`${this.pathSaveFile}/kafkaBridgeLogs.json`);
      }
      return;
  }

  private async checkKafka(): Promise<boolean> {
    try {
      if (!this.admin) {
        await this.createAdmin();
      } 
      const describeCluster = await this.admin?.describeCluster();
      this.kafka?.logger().info(`Describe kafka is ${describeCluster}`);
      if(!describeCluster) return false;
      else return true; 

    } catch(err: unknown) {
      this.kafka?.logger().error(`Error of function 'checkKafka()' error: ${JSON.stringify(err)}`);
      return false;
    }
  }

  private async connectProducer(isTopic?: boolean | undefined): Promise<Producer> {
    if (!this.kafka) {
      this.kafka = this.createKafka();
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
      this.kafka = this.createKafka();
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
