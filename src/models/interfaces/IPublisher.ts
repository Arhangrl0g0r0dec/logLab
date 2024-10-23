import { Step } from "../models";

export interface IPublisher {
    createLog<T>(): T,
    addInLog<T>(dataLog: T): void,
    sendLog<T>(dataLog: T, stepsLog?: Step[], level?: string | number): boolean
}