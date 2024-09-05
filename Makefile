all: build up

build:
	docker compose -f ./docker-compose.yml build

up:
	docker compose -f ./docker-compose.yml up
	
down:
	docker compose -f ./docker-compose.yml down
	
logs:
	docker logs nginx

migration:
	docker exec backend python manage.py migrate --noinput 

backend :
	docker compose -f ./docker-compose.yml down
	docker rmi backend
	docker compose -f ./docker-compose.yml up

front :
	docker compose -f ./docker-compose.yml down
	docker rmi -f repo_mrabourd-frontend:latest
	docker compose -f ./docker-compose.yml up

clean: down
	docker rmi -f $$(docker images -qa);\
	docker volume rm $$(docker volume ls -q);
	docker system prune

fclean: clean

re: clean up
	docker ps -a

.Phony: all logs clean fclean