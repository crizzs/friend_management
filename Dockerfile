FROM node:6.2.1

WORKDIR /usr/src/app

COPY package.json /usr/src/app

RUN echo '{ "allow_root": true }' > /root/.bowerrc

RUN npm install --global bower

RUN npm install --allow-root

RUN npm install pm2 -g

COPY . /usr/src/app

EXPOSE 8080

CMD ["pm2-docker", "start", "process.json"]