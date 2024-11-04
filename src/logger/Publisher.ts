import dayjs from "dayjs";
import { IPublisher } from "../models/interfaces/IPublisher";
import { DataStep, MessageLog, SettingsPublisher, Step } from "../models/models";
import { Kafka, Producer, RetryOptions } from "kafkajs";
import { createHash } from "crypto";
import { TransportFile } from "../transports/TransportFile";
import { TransportKafka } from "../transports/TransportKafka";
import { ProducerKafka } from "../clientsKafka/Producer";

export class Publisher implements IPublisher {

    private topic?: string;
    private urls?: string[];
    private clientId?: string;
    private logLevel?: number;
    private isTopic?: boolean;
    private pathSaveFile?: string;
    private serverName?: string;
    private retryOptions: RetryOptions = {};

    constructor(settings: SettingsPublisher) {
        this.topic = settings.topic;
        this.urls = settings.urls;
        this.clientId = settings.clientId;
        this.logLevel = settings.logLevel ? settings.logLevel : 4;
        this.pathSaveFile = settings.pathSaveFile;
        this.retryOptions = settings.retry;
        this.isTopic = settings.isTopic ? settings.isTopic : false;
        this.serverName = settings.serverName;
    }

    createLog(req: any, res: any, steps: Step[], body?:any): MessageLog {
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
            steps: steps,
          };
      
          message.hash = createHash('sha256')
            .update(String(message) + dayjs().valueOf().toString() + Math.floor(1000 + Math.random() * 9000))
            .digest('hex');
          return message;
    }

    addNewStep(data: DataStep, steps: Step[], logLevel: string): void {
        const step: Step ={
            level: logLevel,
            dataStep: data
        }
        steps.push(step);
    }

    async sendLog(req: any, res: any, dataLog: any, typeTransport: number, stepsLog?: Step[], level?: string | number): Promise<string> {
        switch (typeTransport) {
            case 1: {
                const transportFile: TransportFile = new TransportFile();
                transportFile.addToFile(dataLog);
            }
            case 2: {
                if(!this.urls) {
                    throw new Error('Not valid value in brokers kafka'); 
                } 
                const transportKafka: TransportKafka = new TransportKafka(this.urls , this.retryOptions, this.clientId,this.isTopic, this.logLevel);
                transportKafka.createProducer(this.topic ?? 'log', this.serverName ?? 'unknown');
                const producer: ProducerKafka = transportKafka.createProducer(this.topic ?? 'log', this.serverName ?? 'unknown');
                return await producer.sendLog(req, res, dataLog, stepsLog);
            }
            case 3: {
                const transportFile: TransportFile = new TransportFile(this.pathSaveFile);
                transportFile.addToFile(dataLog);
                if(!this.urls) {
                    throw new Error('Not valid value in brokers kafka'); 
                } 
                const transportKafka: TransportKafka = new TransportKafka(this.urls, this.retryOptions, this.clientId,this.isTopic, this.logLevel);
                const producer: ProducerKafka = transportKafka.createProducer(this.topic ?? 'log', this.serverName ?? 'unknown');
                return await producer.sendLog(req, res, dataLog, stepsLog);
            } 
            default: {
                const transportFile: TransportFile = new TransportFile(this.pathSaveFile);
                transportFile.addToFile(dataLog);
            }
        }
        return '';
    }
}