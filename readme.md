# Anima
## Useful Docker Commands

    docker build -t anima-app .
    docker network create anima-net
    docker create --name anima-redis --network anima-net --publish 6379:6379 redis
    docker run --network anima-net -p 8080:80 anima-app
