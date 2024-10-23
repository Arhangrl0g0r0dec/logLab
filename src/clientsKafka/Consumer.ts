import { IConsumerKafka } from '../models/interfaces/IConsumer';
import { IMessageHandler, IMessageHandlerSync } from '../models/interfaces/handler/IHandler';
import { MessageLog, Topic } from '../models/models';
import { Admin, Consumer, Kafka } from 'kafkajs';

export class ConsumerKafka implements IConsumerKafka {
  private kafka: Kafka | undefined;
  private consumer: Consumer | undefined;
  private admin: Admin | undefined;
  private topics: string[];
  private groupId: string;
  private clientId: string;
  private urls: string[];
  private logLevel: number;

  constructor(clientId: string, logLevel: number, urls: string[], groupId: string, topics: string[]) {
    this.topics = topics;
    this.groupId = groupId;
    this.clientId = clientId;
    this.urls = urls;
    this.logLevel = logLevel;
    this.kafka = undefined;
    this.admin = undefined;
    this.consumer = undefined;
  }

  private createKafka(clientId: string, logLevel: number, urls: string[]): Kafka {
    return new Kafka({
      clientId,
      logLevel,
      brokers: urls,
    });
  }

  private async createAdmin(): Promise<any> {
    const method: string = 'createAdmin';
    if (!this.kafka) {
      this.kafka = this.createKafka(this.clientId, this.logLevel, this.urls);
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
      await this.createTopics();
      return;
    } catch (err) {
      await this.disconnectAdmin();
      this.kafka.logger().info(`Error in method ${method}. Error: ${err}`);
    }
  }

  private async createTopics(): Promise<void> {
    const method: string = 'createTopics';

    if (!this.kafka) {
      this.kafka = this.createKafka(this.clientId, this.logLevel, this.urls);
    }

    try {
      if (typeof this.admin == 'undefined') {
        await this.createAdmin();
      } else {
        const resultTopics = await this.admin.fetchTopicMetadata({
          topics: this.topics,
        });
        for (let t = this.topics.length - 1; t >= 0; t--) {
          if (!resultTopics.topics[t]) {
            const topicArr: Topic[] = [];
            let newTopic: Topic;
            newTopic = {
              topic: this.topics[t],
            };
            topicArr.push(newTopic);

            const result = await this.admin.createTopics({
              validateOnly: false,
              timeout: 5000,
              topics: topicArr,
            });

            if (result) this.kafka.logger().info(`Topic ${this.topics[t]} was created`);
            else this.kafka.logger().info(`Topic ${this.topics[t]} allready exists.`);
          }
        }
        return;
      }
    } catch (error) {
      this.kafka.logger().error(`Error in method ${method}. Error: ${error}`);
    }
  }

  private async disconnectAdmin(): Promise<void> {
    if (!this.kafka) {
      this.kafka = this.createKafka(this.clientId, this.logLevel, this.urls);
    }
    this.kafka.logger().info('Disconnect Admin from kafka.');
    if (this.admin) await this.admin.disconnect();
    this.kafka.logger().info('Admin is disconnected.');
  }

  private async subscribeTopic(): Promise<void> {
    const method: string = 'subscribeTopic';
    if (!this.kafka) {
      this.kafka = this.createKafka(this.clientId, this.logLevel, this.urls);
    }
    try {
      if (!this.consumer) {
        await this.connectConsumer();
        return;
      }
      await this.consumer.subscribe({ topics: this.topics, fromBeginning: true });
      return;
    } catch (error) {
      this.kafka.logger().error(`Error in method ${method}. Error: ${error}`);
      await this.disconnectConsumer();
      return;
    }
  }

  private async connectConsumer(): Promise<void> {
    const method: string = 'connectConsumer';
    if (!this.kafka) {
      this.kafka = this.createKafka(this.clientId, this.logLevel, this.urls);
    }
    try {
      await this.createAdmin();
      this.kafka.logger().info('Create new Consumer...');

      if (this.consumer) {
        this.kafka.logger().info('Consumer allready exists.');
        return;
      }
      this.consumer = this.kafka.consumer({ groupId: this.groupId });
      await this.consumer.connect();
      this.kafka.logger().info('Consumer is created and connected to kafka');
      this.subscribeTopic();
      return;
    } catch (err) {
      this.kafka.logger().info(`Error in method ${method}. Error: ${err}`);
      await this.disconnectConsumer();
      return;
    }
  }

  async disconnectConsumer(): Promise<void> {
    if (!this.kafka) {
      this.kafka = this.createKafka(this.clientId, this.logLevel, this.urls);
    }
    this.kafka.logger().info('Disconnect Consumer from kafka.');
    if (this.consumer) this.consumer.disconnect();
    await this.disconnectAdmin();
  }

  async kafkaConsumer(Handler: IMessageHandler) {
    const method: string = 'kafkaConsumer';
    await this.connectConsumer();
    if (!this.consumer) {
      await this.connectConsumer();
      return;
    }
    await this.consumer.run({
      eachMessage: async (ctx: any) => {
        if (!this.kafka) {
          this.kafka = this.createKafka(this.clientId, this.logLevel, this.urls);
        }

        try {
          this.kafka
            .logger()
            .info(`Kafka get message ${JSON.stringify(ctx.message)} from ${ctx.topic}, partition ${ctx.partition}`);
          const logData: MessageLog = JSON.parse(ctx.message.value?.toString() || 'null');
          if (!this.consumer) {
            await this.connectConsumer();
            return;
          }
          Handler.messageHandler(logData);
          await this.consumer.commitOffsets([
            { topic: ctx.topic, partition: ctx.partition, offset: (Number(ctx.message.offset) + 1).toString() },
          ]);
        } catch (error) {
          this.kafka.logger().error(`Kafka error in method ${method}. Error ${error}`);
          await this.connectConsumer();
        }
      },
    });
  }

  async kafkaConsumerSync(Handler: IMessageHandlerSync) {
    const method: string = 'kafkaConsumer';
    await this.connectConsumer();
    if (!this.consumer) {
      await this.connectConsumer();
      return;
    }
    await this.consumer.run({
      eachMessage: async (ctx: any) => {
        if (!this.kafka) {
          this.kafka = this.createKafka(this.clientId, this.logLevel, this.urls);
        }

        try {
          this.kafka
            .logger()
            .info(`Kafka get message ${JSON.stringify(ctx.message)} from ${ctx.topic}, partition ${ctx.partition}`);
          const logData: MessageLog = JSON.parse(ctx.message.value?.toString() || 'null');
          if (!this.consumer) {
            await this.connectConsumer();
            return;
          }
          await Handler.messageHandler(logData);
          await this.consumer.commitOffsets([
            { topic: ctx.topic, partition: ctx.partition, offset: (Number(ctx.message.offset) + 1).toString() },
          ]);
        } catch (error) {
          this.kafka.logger().error(`Kafka error in method ${method}. Error ${error}`);
          await this.connectConsumer();
        }
      },
    });
  }
}
