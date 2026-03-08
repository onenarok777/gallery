FROM node:20-alpine
WORKDIR /app
# Copy the entire monorepo
COPY . .
RUN npm install
CMD ["npm", "run", "dev", "--workspace=@gallery/web"]
