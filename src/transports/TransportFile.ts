import { ITransportFile } from "../models/interfaces/ITransportFile";
import fs from "fs";

export class TransportFile implements ITransportFile {
    addToFile<T>(path: string, data: T): boolean {
        try {
            fs.writeFileSync(path, JSON.stringify(data), { flag: 'a'});
        } catch(error: unknown) {
            console.error(error);
            return false;
        } 
        return true;
    }
}