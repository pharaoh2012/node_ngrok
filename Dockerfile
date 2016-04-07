FROM node:4.4.2-slim

ENV VCAP_APP_PORT 80

RUN mkdir /etc/ngrok/
COPY . /etc/ngrok/

WORKDIR /etc/ngrok/

EXPOSE 80
CMD node /etc/ngrok/server.js