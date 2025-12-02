FROM node:18-alpine

WORKDIR /app

# copy package & install deps first
COPY . .
RUN npm install

# generate prisma client
RUN npx prisma generate

EXPOSE 3001

# run migrations then start
CMD sh -c "npx prisma migrate deploy && node src/index.js"
