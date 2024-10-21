export interface IPublisher {
    createLog<T>(): T,
    addInLog<T>(dataLog: T): void,
    sendLog<T>(dataLog: T): boolean
}