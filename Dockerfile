FROM debian

ENV APP_HOME /usr/src/app
ENV NVM_DIR="/root/.nvm"

WORKDIR $APP_HOME

SHELL [ "/bin/bash", "-l", "-c" ]

RUN apt-get update && apt-get install -y curl git python
RUN curl --silent -o- https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
# this now works
RUN nvm install 8.11.1 \
    && nvm install 10.15.3 \
    && nvm use 10.15.3

COPY package*.json ./

# `npm ci` actually enforces the package-lock and is way faster!
# See https://docs.npmjs.com/cli/ci.html
RUN npm ci --loglevel warn --no-scripts --no-progress || \
    npm install --loglevel warn --no-scripts --no-progress

COPY . .

RUN mkdir -p ~/.ssh
RUN mv ./lib/known_hosts ~/.ssh/
RUN mv ./lib/.npmrc ~/

# Make a container that will stay up doing nothing until it is brought down.
CMD node index.js
# CMD tail -f /dev/null
