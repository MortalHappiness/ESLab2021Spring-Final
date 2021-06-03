# ESLab2021Spring-Final

Final project for the course "Embedded System Lab", 2021 spring.

Mbed Fruit Ninja (搖桿切西瓜遊戲)

## Team Member

+ B07901069 劉奇聖
+ B07901052 劉展碩

## Preliminary Lab Presentation

+ [Google slide](https://docs.google.com/presentation/d/1tytz8w-z3w_URjpiuiBZuMd1dZaJkwI-nLDMTPTNriM/edit?usp=sharing)
+ [pdf slide](/demo/preliminary.pdf)

## Build frontend

```shell
cd frontend
npm install
npm run build
```

## Start Server

```shell
cd server
npm install

# development
npm start

# production
npm run production
```

### Environment variables (And their default value)

```
SERVER_PORT=8000
SOCKET_PORT=8001
```

## References

The frontend code is modified from the following repo

https://github.com/Arnarkari93/FruitNinja
