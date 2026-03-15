FROM node:20-alpine
WORKDIR /app
# Copy the entire monorepo
COPY . .

# ARGs for Next.js build-time variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
RUN npm install
RUN npm run build --workspace=@gallery/web
CMD ["npm", "run", "start", "--workspace=@gallery/web"]
