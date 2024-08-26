FROM node:alpine AS base

WORKDIR '/app'

COPY package*.json ./

RUN yarn install

COPY . .

FROM base AS production

ENV NODE_PATH=./dist

RUN yarn run dev:build
