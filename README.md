# chainreaction

An online multiplayer chain reaction game in javascript.

Available at https://the-chain-reaction.herokuapp.com/

## Development

### Prerequisites

Use [nvm](https://github.com/nvm-sh/nvm) to manage node versions.
MongoDB server needed for storing data.

```bash
  # install required node version
  nvm install

  # ensure right node version
  nvm use

  # install dependencies
  yarn install
```

Create a `.env` file in the root directory of the project for environment variables.

Example:

```dosini
DB=mongodb://localhost:27017/chainreaction
SESSION_SECRET=secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
```

### Setup

To start development, run (in different terminals):

```bash
# Bundle front-end assets
yarn watch

# Start dev server
yarn dev
```

For production build, run:

```bash
# Bundle front end assets
yarn build

# Start server
yarn start
```
