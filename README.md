# Holiday Planner

Build an itinerary — quickly.

## Running with Docker (HTTPS Enabled)

1. **Prerequisite**: Ensure you have generated SSL certificates in the `certs/` directory (see [SSL Setup](#ssl-setup)).

2. **Auth0 Configuration**:
   Create a `.env` file with your Auth0 credentials:
   ```env
   VITE_AUTH0_DOMAIN=your-domain.auth0.com
   VITE_AUTH0_CLIENT_ID=your-client-id
   # VITE_SOCKET_URL is optional, defaults to window.location.origin
   ```

3. **IMPORTANT: Fix "Callback URL Mismatch"**:
   Log in to your [Auth0 Dashboard](https://manage.auth0.com/), go to your Application, and update the following fields to use `https`:
   - **Allowed Callback URLs**: https://localhost:8080`
   - **Allowed Logout URLs**: https://localhost:8080`
   - **Allowed Web Origins**: https://localhost:8080`

4. **Run the application**:
   ```bash
   docker compose up --build
   ```

5. **Access the App**:
   - On the host machine: Open `https://localhost:8080`.
   - On other devices: Open `https://<YOUR_HOST_IP>:8080` (Replace `<YOUR_HOST_IP>` with your computer's local IP address).

## SSL Setup

The application uses self-signed certificates for local development.

1. **Generate Certificates**:
   ```bash
   mkdir -p certs
   openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
   ```

2. **Accept Certificate in Browser**:
   Since these are self-signed, you will see a security warning.
   - For the main app: Click "Advanced" -> "Proceed to localhost (unsafe)" or "Proceed to <IP> (unsafe)".
   - For the backend (Socket.IO): Visit `https://<DOMAIN_OR_IP>:8080/socket.io/` directly once, and click "Proceed anyway". Then refresh the main app page.

**Note for Other Devices**: When connecting from another device, your browser might be even stricter about self-signed certificates. You **must** visit the `/socket.io/` path on that device first to allow the connection.