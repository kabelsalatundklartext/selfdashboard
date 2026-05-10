FROM node:20-alpine
LABEL org.opencontainers.image.source=https://github.com/kabelsalatundklartext/selfdashboard
WORKDIR /app
COPY package.json .
RUN npm install --production && npm cache clean --force
COPY . .
RUN mkdir -p /data
EXPOSE 4000
HEALTHCHECK --interval=20s --timeout=5s --retries=3 CMD wget -qO- http://localhost:4000/api/health || exit 1
CMD ["node", "server.js"]
