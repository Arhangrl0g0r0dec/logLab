import { RetryOptions } from "kafkajs";

//default data
export type MessageLog = {
    server: string | undefined;
    hash: string;
    pid: number;
    request: {
      id: any;
      method: string;
      path: string;
      requestTime: number;
      headers: {
        Host: string | undefined;
        ContentType: string | undefined;
      };
      body: string;
    };
    response: {
      status: number;
      body: any;
      responseTime: number;
    };
    time: number;
    steps?: Step[];
  };
  
  export type Step = {
    level: string;
    dataStep: DataStep;
  };
  
  export type DataStep = {
    data: string;
    result?: any;
  };

  export type ConfigKafka = {
    urls: string[];
    clientId: string;
    groupId?: string;
    levelLog: number;
  };
  
  export type Topic = {
    topic: string;
  };

  export type SettingsPublisher = {
    urls?: string[],
    typeTransport?: number,
    clientId?: string, 
    topic?: string, 
    serverName?: string,
    pathSaveFile?: string,
    retry?: RetryOptions,
    isTopic?: boolean,
    logLevel?: number
  }