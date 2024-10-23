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

## version
### 0.2.0
## last changes:
1. Добавлен transportKafka - способ передачи логов через брокер Kafka
2. Прописсан алгоритм поведения Consumer и Produser брокера сообщений
3. Добавлены новые структуры для работы новым функционалом
4. Также создан IMessageHandler, который позволяет реализовать необходимую обработку сообщений при получении их из Kafka