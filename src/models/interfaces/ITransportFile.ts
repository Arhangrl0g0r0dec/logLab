export interface ITransportFile {
    addToFile<T>(path: string, data: T): void
}