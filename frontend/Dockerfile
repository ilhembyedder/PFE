FROM node:20-alpine

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --strict-ssl=false

COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

CMD ["npm", "run", "dev"]
