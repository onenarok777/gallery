FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# We use tsx for dev, you'd compile to JS for proper prod
CMD ["npm", "run", "dev"]
