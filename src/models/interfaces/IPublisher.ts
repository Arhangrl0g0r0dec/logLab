import { DataStep, MessageLog, Step } from "../models";

export interface IPublisher {
    createLog(req: any, res: any, steps: Step[], body?:any): MessageLog,
    addNewStep(dataLog: DataStep, steps: Step[], logLevel: string): void,
}