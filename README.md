# Friend Management (Docker-Compose App)

A Friend Management App is being crafted using Mongoose, NodeJS, Swagger-UI, Restify. (The amount of Cluster Workers depends on your CPU cores.)
The NoSQL database powering the application is MongoDB. 

There are a total of 6 friend management web-services and is being listed @ the Swagger Documentation Page (YAML Structure)

![alt text](http://snappyimages.nextwavesrl.netdna-cdn.com/img/77099cf5bd6cf2af25fcbd234d56418e.png)

## Requirements

- [Docker & Docker-Compose CE](https://www.docker.com/)

(Before following the installation instruction, please kindly install Docker CE and Docker-Compose CE.)

## Installation

1. Clone the git repository  
2. Open up your `Terminal/Command Prompt/Bash` in Administrator mode
3. Move into the Git Directory, Type : `cd <Your Directory to Git Clone>/friend_management`
3. Build the Container App using Docker-Compose. Please run `docker-compose up --build`
4. After up and running, go to  `http://localhost:8080/swagger`
5. You will see all the API services available (Check out the documentation)
