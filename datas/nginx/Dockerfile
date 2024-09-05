FROM nginx:latest

# Installation d'openssl
RUN apt-get update && apt-get install -y openssl

# Génération d'un certificat auto-signé
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -subj "/C=FR/ST=Paris/L=Paris/O=42 School/OU=sethomas/CN=localhost"

# Copie de la configuration Nginx
COPY ./conf/nginx.conf /etc/nginx/nginx.conf

# Exposition des ports 8080 et 8443
EXPOSE 8080
EXPOSE 8443

# Commande de démarrage de Nginx
CMD ["nginx", "-g", "daemon off;"]
