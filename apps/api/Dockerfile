FROM node:20-alpine
WORKDIR /app
# Copy the entire monorepo
COPY . .
RUN npm install
# Run migrations and then start the dev server
CMD ["sh", "-c", "npm run db:push --workspace=@gallery/api && npm run dev --workspace=@gallery/api"]
