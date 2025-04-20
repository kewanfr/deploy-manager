FROM node:18

WORKDIR /app

COPY ./src/package*.json ./

RUN npm install

COPY ./src .

EXPOSE 3000
EXPOSE 60534

CMD ["npm", "run", "start"]


# FROM node
# WORKDIR /app
# COPY package.json /app
# RUN npm install
# COPY . /app
# CMD ["node","."]