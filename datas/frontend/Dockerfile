FROM node:10-alpine

# Create app directory
RUN mkdir -p /home/node/app
WORKDIR /home/node/app

# Install app dependencies
COPY package.json /home/node/app
RUN npm install

# Bundle app source
COPY . .

#RUN chown -R node:node /home/node/app/public/
EXPOSE 3000

CMD [ "node", "app.js" ]