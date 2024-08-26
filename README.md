# eUniversity Africa API
This is the API for eUniversity Africa

## Requirements
- [Node v18+](https://nodejs.org/)
- [Docker](https://www.docker.com/)

## Running the app
set up the development environment with the following steps

1. clone the repository
2. Run `yarn install` command
3. create a `.env` file in the root directory and copy the contents of `.env.example` into it
4. Run `yarn run docker:build` command, to build the docker container
5. Run `yarn run docker:run` command, to run the docker container

## Commit message format
Commit messages must meet [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) format.

## Migrations
Set `syncDatabase` to `false` in [data-source.ts](src/data-source.ts) to enable migrations. Then run the following commands
- Run `yarn run migration:generate -- ./src/migrations/<migration-name>` to generate a migration file. For example `yarn run migration:generate -- ./src/migrations/create-users-table`
- Run `yarn run migration:run` to run migrations
- Run `yarn run migration:revert` to revert migrations
