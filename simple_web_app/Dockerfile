# Use official NGINX image as base
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy our static website files to NGINX html folder
COPY index.html /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# Start NGINX server (default CMD from base image)
