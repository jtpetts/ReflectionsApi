FROM node:14.16.0-alpine3.13

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3011

CMD [ "npm", "start" ]

# goes in devDependencies
# use "migrate-mongo": "~8.4.1",
# store it in migrations folder
# to define up and down

