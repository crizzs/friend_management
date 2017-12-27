# Friend Management

A Friend Management App is being crafted using Docker-Compose, PM2, Mongoose, NodeJS, Swagger, Restify. 
(The total amount of NodeJS Cluster Workers depends on your CPU cores.)

The NoSQL database powering the application is MongoDB. PM2 is running the NodeJS.

There are a total of 6 friend management web-services and is being listed @ the Swagger Documentation Page

![alt text](http://snappyimages.nextwavesrl.netdna-cdn.com/img/77099cf5bd6cf2af25fcbd234d56418e.png)

## Requirements

- [Docker & Docker-Compose CE](https://www.docker.com/)

(Before following the instructions below, kindly install Docker CE and Docker-Compose CE.)

## Installation

1. Clone the git repository  
2. Open your `Terminal/Command Prompt/Bash` in Administrator mode
3. Go into your Git Clone Directory, Type : `cd <Your Git Clone Storage Directory>/friend_management`
3. Build your Container App using Docker-Compose. Please run `docker-compose up --build`
4. After the Application and MongoDB up and running, go to  `http://localhost:8080/swagger`
5. You will see all the API services available (Check out the documentation)
