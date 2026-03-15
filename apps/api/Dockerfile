FROM node:20-alpine
WORKDIR /app
# Copy the entire monorepo
COPY . .
RUN npm install
RUN npm run build --workspace=@gallery/api
# Run migrations and then start the production server
CMD ["sh", "-c", "npm run db:push --workspace=@gallery/api && npm run start --workspace=@gallery/api"]
