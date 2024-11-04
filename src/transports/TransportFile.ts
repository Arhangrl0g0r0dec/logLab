import { ITransportFile } from "../models/interfaces/ITransportFile";
import fs from "fs";

export class TransportFile implements ITransportFile {
    private pathFile: string;
    constructor(path?: string) {
        this.pathFile = path ?? '.data' 
    }
    addToFile<T>(data: T): void {
        try {
            let messages: T[] = [];
            if(fs.existsSync(`${this.pathFile}/kafkaBridgeLogs.json`)) {
              const rawdata = fs.readFileSync(`${this.pathFile}/kafkaBridgeLogs.json`);
              messages = JSON.parse(String(rawdata));
              messages.push(data);
              fs.writeFileSync(`${this.pathFile}/kafkaBridgeLogs.json`, `${JSON.stringify(messages)}`);
            } else {
              fs.mkdirSync(this.pathFile, { recursive: true });
              messages.push(data);
              fs.writeFileSync(`${this.pathFile}/kafkaBridgeLogs.json`, `${JSON.stringify(messages)}`);
            }
          } catch(error: unknown) {
            console.error(`Возникла ошибка при записи данных в файл: ${JSON.stringify(error)}`);
          }
    }
}