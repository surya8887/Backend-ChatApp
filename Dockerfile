        # Use a Node.js base image
        FROM node:20

        # Set the working directory inside the container
        WORKDIR /app

        # Copy package.json and package-lock.json (if present)
        COPY package*.json ./

        # Install Node.js dependencies
        RUN npm install

        # Copy the rest of your application code
        COPY . .

        # Expose the port your app listens on
        EXPOSE 3000

        # Define the command to run your application
        CMD [ "npm", "start", "dev" ]