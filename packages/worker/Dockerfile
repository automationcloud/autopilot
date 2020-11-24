FROM automationcloud/chrome:86-node14

ARG VERSION
ARG NPM_TOKEN

ENV ROOT /home/node/worker-image
WORKDIR ${ROOT}

RUN npm config set '//registry.npmjs.org/:_authToken' ${NPM_TOKEN}
RUN npm init -y

RUN npm i @automationcloud/worker@${VERSION#refs/tags/} --no-package-lock

COPY setup/* ./

RUN ls -lia

# Configure VNC

RUN \
  cd /home/node && \
  mkdir ./.vnc && \
  cp ${ROOT}/vnc_passwd ./.vnc/passwd && \
  chown -R node:node ./.vnc && \
  chmod 600 ./.vnc/passwd && \
  rm -f /tmp/.X1-lock && \
  rm -rf /tmp/.X11-unix

# Configure Chromium policy

RUN mkdir -p /etc/chromium/policies/managed/ && \
  cp ${ROOT}/policy.json /etc/chromium/policies/managed/

# Run as non-root user

RUN chown -R node:node ${ROOT}
USER node

# Run app

ENV CHROME_USER_DIR ${ROOT}/.tmp/chrome/user
ENV CHROME_CACHE_DIR ${ROOT}/.tmp/chrome/cache
ENV DOWNLOADS_DIR ${ROOT}/.tmp/crdownloads
ENV BLOBS_DIR ${ROOT}/.tmp/crblobs
ENV NODE_ENV production
ENV LOG_PRETTY false
ENV CHROME_PORT 9222
ENV PORT 8080

CMD ["./start.sh"]
