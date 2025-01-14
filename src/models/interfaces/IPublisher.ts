import { DataStep, MessageLog, Step } from "../models";

export interface IPublisher {
    createLog(req: any, res: any, steps: Step[], body?:any): MessageLog,
    newStep(dataStep: DataStep, steps: Step[], logLevel: string): void,
    sendLog(dataLog: any, typeTransport?: number): Promise<string>
}