# Holiday Planner

Build an itinerary — quickly.

## Running with Docker

1. **Auth0 Configuration**:
   Create a `.env` file with your Auth0 credentials:
   ```env
   VITE_AUTH0_DOMAIN=your-domain.auth0.com
   VITE_AUTH0_CLIENT_ID=your-client-id
   # VITE_SOCKET_URL is optional, defaults to window.location.origin
   ```

2. **IMPORTANT: Fix "Callback URL Mismatch"**:
   Log in to your [Auth0 Dashboard](https://manage.auth0.com/), go to your Application, and update the following fields (add `https` if you're behind an SSL proxy):
   - **Allowed Callback URLs**: `https://localhost:8080` (or `http://localhost:8080` if not using SSL)
   - **Allowed Logout URLs**: `https://localhost:8080`
   - **Allowed Web Origins**: `https://localhost:8080`

3. **Run the application**:
   ```bash
   docker compose up --build
   ```

4. **Access the App**:
   - On the host machine: Open `http://localhost:8080` (or `https://localhost:8080` if using an external SSL proxy).
   - On other devices: Open `http://<YOUR_HOST_IP>:8080`.

## SSL and Architecture

The frontend container is configured as a standard HTTP server that can be placed behind an edge proxy (like Railway, Nginx Proxy Manager, or Traefik) which handles SSL.

### Backend SSL (Internal)
The backend service (internal to the Docker network) still uses self-signed certificates in `development` mode to ensure secure communication between the Nginx proxy and the Node.js server. 

If you are seeing connection issues, ensure you've generated the certificates:
```bash
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```