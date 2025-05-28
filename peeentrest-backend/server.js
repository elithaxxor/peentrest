const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 1958;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/peeentrest', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// User schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  passwordHash: String,
});
const User = mongoose.model('User', userSchema);

// Image metadata schema and model
const imageSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  imageUrl: String,
  description: String,
  dateCreated: Date,
  cameraModel: String,
  price: Number,
});
const Image = mongoose.model('Image', imageSchema);

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Google Cloud Storage setup
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  keyFilename: process.env.GCLOUD_KEY_FILE,
});
const bucketName = process.env.GCLOUD_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// User signup
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, passwordHash });
    await user.save();
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Upload image endpoint
app.post('/api/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { description, dateCreated, cameraModel, price } = req.body;
  const userId = req.user.userId;

  try {
    // Upload file to Google Cloud Storage
    const gcsFileName = `${userId}/${Date.now()}_${req.file.originalname}`;
    await bucket.upload(req.file.path, {
      destination: gcsFileName,
      metadata: { contentType: req.file.mimetype },
    });

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;

    // Save metadata to MongoDB
    const image = new Image({
      userId,
      imageUrl: publicUrl,
      description,
      dateCreated: dateCreated ? new Date(dateCreated) : new Date(),
      cameraModel,
      price: price ? Number(price) : 1000,
    });
    await image.save();

    // Delete local file
    fs.unlinkSync(req.file.path);

    res.status(201).json({ message: 'Image uploaded', imageUrl: publicUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Stripe create payment intent endpoint
app.post('/api/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Stripe create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// PayPal create order endpoint
app.post('/api/create-paypal-order', authenticateToken, async (req, res) => {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  const { amount, currency } = req.body;
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: currency,
        value: (amount / 100).toFixed(2),
      },
    }],
  });

  try {
    const client = getPaypalClient();
    const order = await client.execute(request);
    res.json({ id: order.result.id });
  } catch (error) {
    console.error('PayPal create order error:', error);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
});

// PayPal capture order endpoint
app.post('/api/capture-paypal-order', authenticateToken, async (req, res) => {
  const { orderID } = req.body;
  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const client = getPaypalClient();
    const capture = await client.execute(request);
    res.json(capture.result);
  } catch (error) {
    console.error('PayPal capture order error:', error);
    res.status(500).json({ error: 'Failed to capture PayPal order' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend server is running' });
});

app.listen(port, () => {
  console.log(`Peeentrest backend server listening on port ${port}`);
});
