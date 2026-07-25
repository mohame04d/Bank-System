FROM node:20-alpine

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Generate Prisma Client and Build the NestJS application
RUN npx prisma generate
RUN npm run build

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
