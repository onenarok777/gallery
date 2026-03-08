FROM node:20-alpine
WORKDIR /app
# Copy the entire monorepo
COPY . .
RUN npm install
# Fast execution for DEV mode
CMD ["npm", "run", "dev", "--workspace=@gallery/api"]
