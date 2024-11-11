import { RetryOptions } from "kafkajs";
import { ConsumerKafka } from "../clientsKafka/Consumer";
import { ProducerKafka } from "../clientsKafka/Producer";
import { ITransportKafka } from "../models/interfaces/ITransportKafka";

export class TransportKafka implements ITransportKafka {
    private urls: string[];
    private clientId: string;
    private logLevel: number;
    private isTopic: boolean;

    constructor(urls: string[], retry?: RetryOptions, clientId?: string, isTopic?: boolean, logLevel?: number) {
        this.urls = urls;
        this.clientId = clientId ?? 'client';
        this.logLevel = logLevel ? logLevel : 4;
        this.isTopic = isTopic? isTopic : false;
    }

    createConsumer(groupId: string, topics: string[]): ConsumerKafka {
        const consumer = new ConsumerKafka(this.clientId, this.logLevel, this.urls, groupId, topics);
        return consumer;
    }

    createProducer(topic: string, serverName: string): ProducerKafka {
        const producer = new ProducerKafka(this.urls, this.clientId, topic, serverName, this.isTopic, this.logLevel);
        return producer;
    }
}