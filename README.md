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
# Easy start:
### install
```
npm i logLab
```
## При работе с библиотекой можно создать два варианта клиента Publisher
### Создание Publisher на основе IPublisher для работы с Apatch Kafka или с файлом.
```
Publisher - это объект, который отвечает за формирование, публикацию и выбор места куда будут записаны логи
```
```ts
// Импортируем все необходимые библиотеки
import { Publisher } from 'logLab';
    const settings: SettingsPublisher = {
        urls?: ['192.168.100.11:9092'] //- массив с адресами брокеров Kafka для подключения,
        typeTransport?: 1 //- тип способа сохранения логов:
        //1: Сохранение в файл по пути: 'pathSaveFile';
        //2: Сохранение в брокер Apache Kafka по параметрам: 'urls', 'clientId', 'topic', 'serverName', 'retry', 'isTopic', 'logLevel';
        //3: Схраненени в файл и в брокер сообщений    
        clientId?: 'MyClient' //(default - 'client'), 
        topic?: 'log'//(default - 'client'),
        serverName?: 'serverName' //(default - 'unknow'),
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
#### Метод формирования шаблона лога MessageLog
```ts
async function controller(req: Request, res: Response) {
  const steps: Step[] = []; 
  publisher.newStep(steps, { data: 'Формирование ответа от сервера' }, 'debug');
  const body = {
    result: 'OK'
  }
  fs.WriteFile('.path/path1', 'Данные', ((err) => {
    publisher.newStep(steps, { data: 'Выполенение записи данных в файл' }, 'debug');
    if(err) publisher.newStep(steps, { data: 'Ошибка записи данных в файл', result: err }, 'error');
  }));
}
```
#### Метод создания лога createLog(req: any, res: any, steps: Step[], body?:any): MessageLog - создание сложного лога который требует дополнительных данных, а также может быть создан массив типа 'Step[]' см. Пример ниже
```ts
//Examle
import { MessageLog, Publisher, Step } from 'logLab';

const publisher: Publisher = new Publisher(settings);

async function controller(req: Request, res: Response) {
  const steps: Step[] = []; 
  const body: any = { result: "OK" }
  publisher.newStep(steps, { data: 'Формирование ответа от сервера' }, 'debug');
  const body = {
    result: 'OK'
  }
  fs.WriteFile('.path/path1', 'Данные', ((err) => {
    publisher.newStep(steps, { data: 'Выполенение записи данных в файл' }, 'debug');
    if(err) publisher.newStep(steps, { data: 'Ошибка записи данных в файл', result: err }, 'error');
  }));
  const message: MessageLog = publisher.createLog(req, res, steps, body); // message будет равен: 
  /*{
    server: string | undefined; // Название сервиса
    hash: string; // Уникальный hash для поиска
    pid: number; // proccess id
    request: { // Данные запроса:
      id: any; // id запроса 
      method: string; // Метод запроса
      path: string; // Маршрут запроса
      requestTime: number; // Время запроса
      headers: { // Заголовки запроса:
        Host: string | undefined; // Адрес сервера
        ContentType: string | undefined; // Тип контента
      };
      body: string; // Тело сообщения    
    };
    response: { //Данные ответа
      status: number; // Статус ответа
      body: any; // Тело ответа
      responseTime: number; // Время ответа 
    };
    time: number; // Время выполнения запроса
    steps?: [
      {
        level: 'debug',
        dataStep: {
          {
            data: 'Формирование ответа от сервера' // Данные шага выполенения
          }
        } 
      },
      {
        level: 'debug',
        dataStep: {
          {
            data: 'Выполенение записи данных в файл' // Данные шага выполенения
          }
        } 
      },
      {
        level: 'debug',
        dataStep: {
          {
            data: 'Ошибка записи данных в файл' // Данные шага выполенения,
            result: 'Error: ....'
          }
        } 
      }
    ]; // Массив шагов выполнения алгоритма (не обязателен)
  }
} 
```
#### Метод занесения лога в массив Step[] newStep(dataStep: DataStep, steps: Step[], logLevel: string): void - создание шага лога типа Step, а метод заполняет массив типа 'Step[]', после чего этот массив используется в MessageLog см. Пример ниже
```ts
const publisher: Publisher = new Publisher(settings);

async function controller(req: Request, res: Response) {
  const steps: Step[] = []; 
  const body: any = { result: "OK" }
  publisher.newStep({ data: 'Формирование ответа от сервера' }, steps, 'debug');
}
```
#### Метод отправки лога в хранилищеМетод sendLog(dataLog: any | MessageLog, typeTransport?: number) - метод отправки лога во временное хранилище, этот метод можно использовть как со структурой MessageLog или же если не нужно сохранять столько данных, то можно создать свой шаблон лога, см. Пример ниже
```ts
Параметры:
dataLog - данные лога, которые необходимо отправить сразу в хранилище
typeTransport - это способ сохранения лога, необязательный параметр (по умолчанию: будет сохранен в файл ".json" по пути указанному в параметре при создании Publisher - "pathSaveFile")
Но в основном существуют следующие значения для сохранения:
1 - Сохранение в файл
2 - Отправка в Kafka
3 - Отправка в файл и в Kafka

const message: MessageLog = publisher.createLog(req, res, steps, body);
1. publisher.sendLog(message);//Сохранится в файл как и publisher.sendLog(message, 1);
2. publisher.sendLog(message, 2);//Отправится в Kafka
3. publisher.sendLog(message, 3);//Отправится в файл и в Kafka
```
### Библиотека предоставляет
```ts
    export type MessageLog = {
    server: string | undefined; // Название сервиса
    hash: string; // Уникальный hash для поиска
    pid: number; // proccess id
    request: { // Данные запроса:
      id: any; // id запроса 
      method: string; // Метод запроса
      path: string; // Маршрут запроса
      requestTime: number; // Время запроса
      headers: { // Заголовки запроса:
        Host: string | undefined; // Адрес сервера
        ContentType: string | undefined; // Тип контента
      };
      body: string; // Тело сообщения    
    };
    response: { //Данные ответа
      status: number; // Статус ответа
      body: any; // Тело ответа
      responseTime: number; // Время ответа 
    };
    time: number; // Время выполнения запроса
    steps?: Step[]; // Массив шагов выполнения алгоритма (не обязателен)
  };

  export type DataStep = {
    data: string; // Данные шага выполенения
    result?: any; // Результат шага выполенения (не обязателен)
  };
  
  export type Step = {
    level: string; // Уровень лога (можете сами для себя настроить нужные уровни)
    dataStep: DataStep; // Подробные данные шага
  };
```
## version
### v0.4.4
## last changes:
1. Убран лишний код связанный с Reader
2. Окончена работа над первой версией README.md

