# 🦺 SafetySnap - PPE Analysis Tool

SafetySnap is an advanced Personal Protective Equipment (PPE) analysis application that uses computer vision to detect and analyze safety compliance in workplace images.

## ✨ Features

- **Advanced PPE Detection**: Detects helmets, safety vests, gloves, boots, safety glasses, and more
- **Compliance Scoring**: Provides detailed compliance scores and recommendations
- **Multiple Work Environments**: Supports construction, manufacturing, laboratory, healthcare, and general workplace settings
- **Real-time Analysis**: Fast image processing with visual feedback
- **Modern UI**: Beautiful, responsive interface with drag-and-drop functionality
- **Comprehensive Reports**: Detailed analysis with actionable recommendations

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd safetysnap
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

1. **Start the server** (Terminal 1)
   ```bash
   cd server
   npm start
   ```
   Server will run on `http://localhost:5000`

2. **Start the client** (Terminal 2)
   ```bash
   cd client
   npm start
   ```
   Client will run on `http://localhost:3000`

3. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
safetysnap/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   └── ...
│   └── package.json
├── server/                 # Node.js backend
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── uploads/           # Uploaded images
│   └── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Client Configuration

Create a `.env` file in the client directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Image Upload & Analysis
- `POST /api/upload` - Upload and analyze image
- `POST /api/upload/analyze` - Analyze existing image
- `GET /api/upload/files` - List uploaded files
- `DELETE /api/upload/:filename` - Delete uploaded file

## 🛡️ PPE Detection

The system detects the following PPE items:

### Required Categories
- **Head Protection**: Hard hats, safety helmets
- **Visibility**: Safety vests, reflective vests
- **Eye Protection**: Safety glasses, goggles
- **Hand Protection**: Safety gloves, work gloves
- **Foot Protection**: Safety boots, work boots

### Work Environments
- **Construction**: Full PPE requirements
- **Manufacturing**: Basic safety equipment
- **Laboratory**: Eye and hand protection
- **Healthcare**: Gloves and eye protection
- **General**: Standard workplace requirements

## 🎨 UI Features

- **Drag & Drop**: Easy image upload
- **Real-time Preview**: Instant image preview with detection overlays
- **Compliance Dashboard**: Visual compliance scoring
- **Recommendations**: Actionable safety recommendations
- **Responsive Design**: Works on desktop and mobile devices

## 🔒 Security Features

- File type validation
- File size limits (10MB max)
- Rate limiting
- CORS protection
- Input validation
- Error handling

## 🧪 Development

### Server Development
```bash
cd server
npm run dev  # Auto-restart on changes
```

### Client Development
```bash
cd client
npm start    # Hot reload enabled
```

## 📦 Production Build

### Build Client
```bash
cd client
npm run build
```

### Run Production Server
```bash
cd server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

## 🔮 Future Enhancements

- [ ] Real-time video analysis
- [ ] Machine learning model improvements
- [ ] Database integration
- [ ] User authentication
- [ ] Report generation
- [ ] Mobile app
- [ ] Integration with safety management systems

---

**SafetySnap** - Making workplace safety smarter, faster, and more reliable. 🦺✨
