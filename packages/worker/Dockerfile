FROM automationcloud/chrome:node16-chrome-stable

ARG VERSION

ENV ROOT /home/node/worker-image
WORKDIR ${ROOT}

RUN npm init -y

RUN npm i @automationcloud/worker@${VERSION#refs/tags/} --no-package-lock

COPY setup/* ./

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
