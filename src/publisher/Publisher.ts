import dayjs from "dayjs";
import { IPublisher } from "../models/interfaces/IPublisher";
import { DataStep, MessageLog, SettingsPublisher, Step } from "../models/models";
import { RetryOptions } from "kafkajs";
import { createHash } from "crypto";
import { TransportFile } from "../transports/TransportFile";
import { TransportKafka } from "../transports/TransportKafka";
import { ProducerKafka } from "../clientsKafka/Producer";

export class Publisher implements IPublisher {

    private topic: string;
    private urls?: string[];
    private clientId?: string;
    private logLevel: number;
    private isTopic: boolean;
    private pathSaveFile: string;
    private serverName: string;
    private retryOptions: RetryOptions;
    private typeTransport: number;

    constructor(settings: SettingsPublisher) {
        this.typeTransport = settings.typeTransport ?? 1;
        this.topic = settings.topic ?? 'log';
        this.urls = settings.urls;
        this.clientId = settings.clientId;
        this.logLevel = settings.logLevel ?? 4;
        this.pathSaveFile = settings.pathSaveFile ?? './data/';
        this.retryOptions = settings.retry ?? {} ;
        this.isTopic = settings.isTopic ?? false;
        this.serverName = settings.serverName ?? 'unknown';
    }

    createLog(req: any, res: any, steps: Step[], body?: any): MessageLog {
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
                body: body ?? "Empty",
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

    newStep(data: DataStep, steps: Step[], logLevel: string): void {
        const step: Step ={
            level: logLevel,
            dataStep: data
        }
        steps.push(step);
    }

    private async selectTransportLog(dataLog: any | MessageLog, typeTransport?: number): Promise<string> {
        switch (typeTransport) {
            case 1: {
                const transportFile: TransportFile = new TransportFile();
                transportFile.addToFile(dataLog);
            }
            case 2: {
                if(!this.urls) {
                    throw new Error('Not valid value in brokers kafka'); 
                } 
                const transportKafka: TransportKafka = new TransportKafka(this.urls , this.clientId, this.isTopic, this.logLevel);
                const producer: ProducerKafka = transportKafka.createProducer(this.retryOptions, this.pathSaveFile, this.topic, this.serverName);
                return await producer.sendLog(dataLog);
            }
            case 3: {
                const transportFile: TransportFile = new TransportFile(this.pathSaveFile);
                transportFile.addToFile(dataLog);
                if(!this.urls) {
                    throw new Error('Not valid value in brokers kafka'); 
                } 
                const transportKafka: TransportKafka = new TransportKafka(this.urls, this.clientId,this.isTopic, this.logLevel);
                const producer: ProducerKafka = transportKafka.createProducer(this.retryOptions, this.pathSaveFile, this.topic, this.serverName);
                return await producer.sendLog(dataLog);
            } 
            default: {
                const transportFile: TransportFile = new TransportFile(this.pathSaveFile);
                transportFile.addToFile(dataLog);
            }
        }
        return '';
    }

    async sendLog(dataLog: any | MessageLog, typeTransport?: number): Promise<string> {
        if (!dataLog.hash) {
            return this.selectTransportLog(typeTransport ?? this.typeTransport);
        } else {
            const hash: string = createHash('sha256')
            .update(String(dataLog) + dayjs().valueOf().toString() + Math.floor(1000 + Math.random() * 9000))
            .digest('hex');
            dataLog.hash = hash;
            return this.selectTransportLog(typeTransport ?? this.typeTransport);
        }
    }
}