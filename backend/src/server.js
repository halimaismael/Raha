require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

const prisma = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const { registerTrackingSocket } = require('./sockets/tracking.socket');

const authRoutes = require('./routes/auth.routes');
const agencyRoutes = require('./routes/agency.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const tripRoutes = require('./routes/trip.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const trackingRoutes = require('./routes/tracking.routes');
const driverRoutes = require('./routes/driver.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }, // à restreindre en production
});

app.set('io', io);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'comoro-move-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(errorHandler);

registerTrackingSocket(io, prisma);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚐 Comoro Move API en écoute sur le port ${PORT}`);
});
