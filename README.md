# 🏪 Polymart

> **Sa Polymart, lahat ng Isko may pwesto!**

A student-powered marketplace made exclusively for PUP Main campus communities, where buyers and sellers connect with ease. Whether it's pre-loved items, student services, or one-of-a-kind finds, Polymart offers a trusted space to discover, list, and transact.

![Polymart Logo](./client/public/logo.png)

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Product Categories](#product-categories)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [FAQ](#faq)

## 🎯 About

Polymart is a campus-centric e-commerce platform designed specifically for PUP Main students. Built with students in mind, Polymart ensures convenient meet-ups, secure exchanges, and a platform that supports hustle, creativity, and connection—all in one place.

### Key Objectives

- 🎓 **Student-Friendly Marketplace** for PUPian-owned hustles
- 📍 **Campus-Centric Meet-Ups** for convenience & safety
- 🔒 **Exclusive to PUPians Only** - verified student community
- 💬 **In-App Chat System** for seamless communication
- ⭐ **Rating & Review System** for trusted transactions

## ✨ Features

### For Sellers
- 📝 **Easy Listing Creation** - Upload products with images, descriptions, and pricing
- 📊 **Dashboard Management** - Track your listings, orders, and performance
- 🗓️ **Flexible Scheduling** - Set available meetup times and locations

- 📈 **Transaction Analytics** - Monitor your sales and customer interactions

### For Buyers
- 🔍 **Advanced Search & Filtering** - Find products by category, price, location
- ❤️ **Favorites System** - Save products for later
- 📱 **Real-time Chat** - Communicate directly with sellers
- ⭐ **Review System** - Rate and review your purchases
- 🛡️ **Report System** - Flag suspicious listings or users

### Platform Features
- 🔐 **Email Verification** - Secure account creation
- 📍 **Campus Meetup Locations** - Pre-defined safe meeting spots
- 🚫 **Content Moderation** - Prohibited items enforcement (no food/drinks)
- 📊 **Performance Monitoring** - Optimized user experience
- 🎨 **Responsive Design** - Works on all devices

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern React with latest features
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Router Dom** - Client-side routing
- **Tanstack React Query** - Data fetching and caching
- **Zustand** - State management
- **Lucide React** - Beautiful icons

### Backend
- **FastAPI** - Modern Python web framework
- **Supabase** - Backend-as-a-Service platform
- **PostgreSQL** - Primary database
- **AWS S3** - File storage for images
- **DynamoDB** - NoSQL database for specific use cases
- **JWT** - Authentication tokens
- **Uvicorn** - ASGI server

### Infrastructure
- **Docker** - Containerization
- **AWS Services** - Cloud infrastructure
- **Email Templates** - HTML email verification

## 📁 Project Structure

```
Polymart/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service layer
│   │   ├── store/         # State management
│   │   ├── utils/         # Utility functions
│   │   ├── data/          # Static data and schemas
│   │   └── assets/        # Images and static assets
│   ├── public/            # Public static files
│   └── package.json       # Frontend dependencies
│
├── server/                # FastAPI backend application
│   ├── auth/              # Authentication module
│   ├── supabase_client/   # Supabase integration
│   ├── dynamodb/          # DynamoDB operations
│   ├── s3/                # S3 file upload handling
│   ├── core/              # Core utilities and config
│   ├── templates/         # Email templates
│   └── requirements.txt   # Backend dependencies
│
├── docker-compose.yml     # Docker configuration
└── README.md             # Project documentation
```

## 🛍️ Product Categories

Polymart supports the following product categories:

| Category | Description | Examples |
|----------|-------------|----------|
| **Academic Essentials** | School-related items | Textbooks, notebooks, calculators, school supplies |
| **Creative Works** | Student-made artistic items | Handmade crafts, artwork, custom designs |
| **Services** | Student services | Tutoring, thesis assistance, graphic design |
| **Tech & Gadgets** | Electronic devices | Laptops, phones, accessories, software |
| **Fashion** | Clothing and accessories | Clothes, bags, jewelry, shoes |
| **Anik-Anik** | Miscellaneous items | Collectibles, decorations, random finds |
| **Other** | Items not fitting other categories | Anything else allowed on the platform |

### Prohibited Items
- 🚫 **Food and beverages** - Due to school safety regulations
- 🚫 **Illegal or harmful items**
- 🚫 **Items violating school policies**

## 📖 API Documentation

The backend provides a comprehensive REST API. Key endpoints include:

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/verify-email` - Email verification

### Listings
- `GET /supabase/listings` - Get all public listings
- `POST /supabase/listings` - Create new listing
- `GET /supabase/listings/{id}` - Get listing details
- `PUT /supabase/listings/{id}` - Update listing
- `DELETE /supabase/listings/{id}` - Delete listing

### File Upload
- `POST /s3/upload` - Upload product images

For complete API documentation, visit `http://localhost:8000/docs` when running the backend.

## 🤝 Contributing

We welcome contributions from the PUP community! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and patterns
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed
- Ensure your code works on both frontend and backend

## ❓ FAQ

### **What is Polymart?**
Polymart is a campus-based e-commerce platform made exclusively for PUP Main students, where you can buy and sell products or services and coordinate meet-ups safely on campus.

### **What can I sell on Polymart?**
You can sell a wide range of products, including textbooks, school supplies, handmade crafts, tech gadgets, fashion items, and services like tutoring.

### **What is not allowed on Polymart?**
Consumable items such as food and drinks are not allowed due to school regulations. This helps ensure the safety and well-being of all students using the platform.

### **Is there any payment system inside the app?**
Currently, Polymart does not support in-app payments. All transactions should be coordinated directly through the in-app chat between buyer and seller.

### **What if I encounter a bogus buyer or seller?**
Polymart has a reporting feature to flag suspicious users. Once verified, these accounts will be marked and restricted from further transactions to protect the community.

### **How do meetups work?**
Sellers can specify available campus locations and time slots. Buyers can choose from these options when placing orders. All meetups happen within the PUP Main campus for safety.

### **Is my account secure?**
Yes! Polymart uses email verification, JWT authentication, and follows security best practices to protect user accounts and data.

---

## 📞 Support

For questions, issues, or suggestions:

- 🐛 **Bug Reports**: Open an issue on GitHub
- 💡 **Feature Requests**: Create a feature request issue
- 📧 **General Support**: Contact the development team

---

**Made with ❤️ by PUP Students, for PUP Students**

*Polymart - Where every Isko has a place to grow their hustle!*