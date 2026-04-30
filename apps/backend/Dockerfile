FROM node:20-alpine
WORKDIR /app
# Kita buat package.json kosong dulu supaya build tidak error
RUN npm init -y && npm install fastify
COPY . .
EXPOSE 4000
CMD ["node", "index.js"]