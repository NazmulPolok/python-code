# Social Food Ride App

A comprehensive full-stack web application that combines social media, food ordering, and ride-hailing services into a single platform.

## 🚀 Features

### 🔹 User System
- JWT-based authentication with role-based access control
- User profiles with customizable information
- Three user roles: User, Vendor, and Rider

### 🔹 Social Media Platform
- Create and share posts with text, images, and videos
- Like, comment, and share functionality
- Friend requests and follow system
- Real-time notifications for interactions
- Privacy controls (public, friends, private)

### 🔹 End-to-End Encrypted Messaging
- Private 1-on-1 chat with end-to-end encryption using TweetNaCl
- Real-time messaging with Socket.IO
- Message status tracking (sent, delivered, read)
- Message reactions and replies
- Only encrypted messages stored in database

### 🔹 Food Ordering System
- Restaurant registration and menu management
- Browse nearby restaurants
- Order placement with customization options
- Real-time order tracking
- Payment integration ready (Stripe/SSLCOMMERZ)
- Order history and reviews

### 🔹 Ride-Hailing System
- Request rides with pickup/drop-off locations
- Driver matching algorithm
- Real-time ride tracking with GPS
- Multiple vehicle types (car, bike, bicycle, scooter)
- Fare calculation and payment processing
- OTP verification for ride security

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **TweetNaCl** for end-to-end encryption
- **Bcrypt** for password hashing
- **Multer** for file uploads
- **Helmet** for security
- **Rate limiting** for API protection

### Frontend
- **React** with TypeScript
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API calls
- **Socket.IO Client** for real-time features

## 📁 Project Structure

```
social-food-ride-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── store/          # Redux store and slices
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Utility functions
│   ├── public/
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── sockets/            # Socket.IO handlers
│   ├── utils/              # Utility functions
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-food-ride-app
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   
   Create a `.env` file in the `server` directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/social-food-ride-app
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRE=7d
   
   # Optional: Add your API keys
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. **Start the application**
   ```bash
   # Development mode (runs both client and server)
   npm run dev
   
   # Or run separately
   npm run server  # Backend only
   npm run client  # Frontend only
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/api/health

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - Logout

### Social Media Endpoints
- `GET /api/posts/feed` - Get user feed
- `POST /api/posts` - Create post
- `PUT /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comment` - Add comment

### Messaging Endpoints
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/:userId` - Get messages with user
- `POST /api/messages` - Send message

### Food Ordering Endpoints
- `GET /api/restaurants/nearby` - Get nearby restaurants
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders

### Ride Hailing Endpoints
- `POST /api/rides` - Request ride
- `GET /api/rides` - Get user rides

## 🔐 Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcrypt with salt rounds
- **End-to-End Encryption** for messages using TweetNaCl
- **Rate Limiting** to prevent abuse
- **Input Validation** and sanitization
- **CORS Protection** with configurable origins
- **Helmet.js** for security headers

## 🌐 Real-time Features

- **Live Messaging** with delivery and read receipts
- **Ride Tracking** with GPS coordinates
- **Order Updates** from preparation to delivery
- **Notifications** for all user interactions
- **Online Status** indicators

## 🚧 Development Roadmap

### Phase 1 (Current)
- ✅ Basic authentication and user management
- ✅ Social media core features
- ✅ End-to-end encrypted messaging
- ✅ Ride-hailing system foundation
- ✅ Food ordering system foundation

### Phase 2 (Next Steps)
- [ ] Payment integration (Stripe/SSLCOMMERZ)
- [ ] Google Maps integration for real locations
- [ ] Push notifications
- [ ] Advanced search and filtering
- [ ] Mobile app development

### Phase 3 (Future)
- [ ] Video calling integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Advanced recommendation algorithms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@socialfoodride.com or join our Slack channel.

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- TweetNaCl for encryption
- Tailwind CSS for beautiful UI
- MongoDB for flexible data storage
- The open-source community for amazing tools and libraries

---

**Built with ❤️ by the Social Food Ride Team**
