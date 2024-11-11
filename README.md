# logLab
## Description
```
A simple npm library for logging and save your logs in different ways 

!!!WARNING!!!
This software product is the implementation of a long-conceived idea to create your own logging tool in various ways
Some of the solutions could have been taken from other solutions that I was the creator of
In any case, the solutions and the concept were invented by me personally and implemented using my algorithms or algorithms taken from open sources
!!!WARNING!!!
```
# Easy start 
## npm i logLab
## При работе с библиотекой можно создать два варианта клиента Publisher и Reader
### Создание Publisher на основе IPublisher для работы с Apatch Kafka или с файлом
```ts
import { Publisher } from 'logLab';
    const settings: SettingsPublisher = {
        urls?: ['192.168.100.11:9092'] //- массив с адресами брокеров Kafka для подключения,
        typeTransport?: 1 //- тип способа сохранения логов:
        //1: Сохранение в файл по пути: 'pathSaveFile';
        //2: Сохранение в брокер Apache Kafka по параметрам: 'urls', 'clientId', 'topic', 'serverName', 'retry', 'isTopic', 'logLevel';
        //3: Схраненени в файл и в брокер сообщений    
        clientId?: 'MyClient' //(default - 'client'), 
        topic?: 'log', 
        serverName?: 'serverName' //(default - 'server'),
        pathSaveFile?: '.data/logs/' //(default - '.data'),
        retry?: {
            maxRetryTime?: //время таймаута последующих попыток подключения
            initialRetryTime?: //Начальное значение, используемое для расчета повтора в миллисекундах (оно все еще рандомизировано в соответствии с фактором рандомизации)
            factor?: //фактор рандомизации default - 0.2
            multiplier?: number //Экспоненциальный фактор default - 2
            retries?: number //Максимальное количество повторных попыток на вызов default - 5
            restartOnFailure?: (e: Error) => Promise<boolean> // перезапускПриНеудачи
        },
        isTopic?: true, //Существует топик или нет и его надо создать (default - false)
        logLevel?: 5, //уровень логирования Kafka (default - 4)
    }
    const publisher: Publisher = new Publisher(settings);
```

### Создание нового лога на основе MessageLog
```ts
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
```

#### Метод создания лога createLog(req: any, res: any, steps: Step[], body?:any): MessageLog - создание сложного лога который требует дополнительных данных, требует создания массива типа 'Step[]'
```ts
//Examle
import { MessageLog, Publisher, Step } from 'logLab';

const publisher: Publisher = new Publisher(settings);

async function controller(req: Request, res: Response) {\
  const steps: Step[] = []; 
  publisher.addNewStep(steps, { data: 'Формирование ответа от сервера' }, 'debug');
  const body = {
    result: 'OK'
  }
  fs.WriteFile('.path/path1', 'Данные', ((err) => {
    publisher.addNewStep(steps, { data: 'Выполенение записи данных в файл' }, 'debug');
    if(err) publisher.addNewStep(steps, { data: 'Ошибка записи данных в файл', result: err }, 'error');
  }));
  
  const message: MessageLog = publisher.createLog(req, res, steps, body);
} 

```
## version
### v0.4.0
## last changes:
1. Начата работа над инструкцией в README.md
2. Отредактированы параметры Publisher