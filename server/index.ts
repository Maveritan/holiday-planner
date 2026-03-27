import express from 'express';
import { createServer as createHttpsServer } from 'https';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as Y from 'yjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const APP_ENV = process.env.APP_ENV || 'development';
const IS_PROD = APP_ENV === 'production';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'state.json');
const YDOC_FILE = path.join(DATA_DIR, 'state.ydoc');

// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log(`Using data directory: ${DATA_DIR}`);
console.log(`JSON Data file: ${DATA_FILE}`);
console.log(`YDOC Data file: ${YDOC_FILE}`);

// SSL certificates
const certPath = path.join(__dirname, '..', 'certs', 'cert.pem');
const keyPath = path.join(__dirname, '..', 'certs', 'key.pem');
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

// In production on platforms like Railway, we usually want HTTP internally
// as the platform handles SSL at the edge.
const useHttps = !IS_PROD && hasCerts;

const options = useHttps ? {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
} : {};

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    // In production, allow the request if it's from the same domain or if origin is undefined (e.g. server-to-server)
    // For Railway, we can be a bit more permissive or use an environment variable
    if (!IS_PROD || !origin || origin.includes('railway.app') || origin.includes('localhost')) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

const httpServer = useHttps 
  ? createHttpsServer(options, app) 
  : createHttpServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!IS_PROD || !origin || origin.includes('railway.app') || origin.includes('localhost')) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  allowEIO3: !IS_PROD,
  transports: ['websocket', 'polling']
});

// Initial state
const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Transit', color: '#3B82F6', icon: 'Plane' },
  { id: '2', name: 'Shopping', color: '#EC4899', icon: 'ShoppingBag' },
  { id: '3', name: 'Museum', color: '#8B5CF6', icon: 'Building2' },
  { id: '4', name: 'Dining', color: '#F59E0B', icon: 'Utensils' },
  { id: '5', name: 'Accommodation', color: '#10B981', icon: 'Hotel' },
  { id: '6', name: 'Sightseeing', color: '#06B6D4', icon: 'Camera' },
  { id: '7', name: 'Activity', color: '#EF4444', icon: 'MapPin' },
  { id: '8', name: 'Entertainment', color: '#F97316', icon: 'Sparkles' },
];

const formatDateToISO = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultDateRange = () => {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 6);
  return {
    start: formatDateToISO(start),
    end: formatDateToISO(end),
  };
};

let state = {
  activities: [],
  categories: DEFAULT_CATEGORIES,
  dateRange: getDefaultDateRange()
};

// Initialize Yjs document
const ydoc = new Y.Doc();
const ymap = ydoc.getMap('holiday-data');

// Function to populate Yjs from JSON state
const populateYjsFromState = (s: any) => {
  ydoc.transact(() => {
    const yactivities = new Y.Array();
    s.activities.forEach((a: any) => {
      const ya = new Y.Map();
      Object.entries(a).forEach(([k, v]) => ya.set(k, v));
      yactivities.push([ya]);
    });
    ymap.set('activities', yactivities);

    const ycategories = new Y.Array();
    s.categories.forEach((c: any) => {
      const yc = new Y.Map();
      Object.entries(c).forEach(([k, v]) => yc.set(k, v));
      ycategories.push([yc]);
    });
    ymap.set('categories', ycategories);

    const ydateRange = new Y.Map();
    Object.entries(s.dateRange).forEach(([k, v]) => ydateRange.set(k, v));
    ymap.set('dateRange', ydateRange);
  });
};

// Load state from file
if (fs.existsSync(YDOC_FILE)) {
  try {
    const update = fs.readFileSync(YDOC_FILE);
    Y.applyUpdate(ydoc, update);
    console.log('State loaded from YDOC file');
  } catch (err) {
    console.error('Error loading YDOC state:', err);
  }
} else if (fs.existsSync(DATA_FILE)) {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    state = JSON.parse(data);
    populateYjsFromState(state);
    console.log('State loaded from JSON file and migrated to Yjs');
  } catch (err) {
    console.error('Error loading state:', err);
    populateYjsFromState(state);
  }
} else {
  populateYjsFromState(state);
}

const saveState = () => {
  try {
    const update = Y.encodeStateAsUpdate(ydoc);
    fs.writeFileSync(YDOC_FILE, Buffer.from(update));
    // Also save JSON for backward compatibility/readability if needed
    fs.writeFileSync(DATA_FILE, JSON.stringify(ydoc.getMap('holiday-data').toJSON(), null, 2));
  } catch (err) {
    console.error('Error saving state:', err);
  }
};

// Watch for changes in ydoc to save
ydoc.on('update', () => {
  saveState();
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send current state to newly connected client as a Yjs update
  const stateUpdate = Y.encodeStateAsUpdate(ydoc);
  socket.emit('yjs-update', stateUpdate);

  socket.on('yjs-update', (update: Uint8Array) => {
    try {
      Y.applyUpdate(ydoc, new Uint8Array(update), socket);
      // Broadcast to everyone else
      socket.broadcast.emit('yjs-update', update);
    } catch (err) {
      console.error('Error applying Yjs update:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  const protocol = useHttps ? 'https' : 'http';
  console.log(`Server running in ${APP_ENV} mode on ${protocol}://localhost:${PORT}`);
  if (IS_PROD && useHttps) {
    console.warn('WARNING: Running in production mode with self-signed certificates. Ensure these are replaced with trusted certificates for actual production use.');
  }
});
