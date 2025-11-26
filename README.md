# AI Travel Itinerary Planner

A B.Tech Project MVP: AI-powered travel itinerary generator using Google's Generative AI (Gemini).

## Features

- **Destination-Based Planning**: Enter your destination, duration, budget level, and preferences
- **AI-Powered Itineraries**: Uses Google Gemini API for intelligent travel recommendations
- **Structured Output**: Generates day-by-day itineraries with activities, timings, and budget estimates
- **Responsive Design**: Built with Tailwind CSS for mobile-friendly experience
- **Retry Logic**: Exponential backoff for reliable API calls

## Tech Stack

- **Frontend**: HTML, CSS (Tailwind), Vanilla JavaScript
- **Build Tool**: Vite
- **AI API**: Google Generative AI (Gemini)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai-itinerary-planner.git
cd ai-itinerary-planner
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory:

```dotenv
VITE_API_KEY=your_google_api_key_here
```

**Get your API key:**

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy it to your `.env` file

### 4. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173/`

### 5. Build for Production

```bash
npm run build
```

## Project Structure

```
.
├── index.html           # Main HTML template
├── script.js            # Main application logic
├── vite.config.js       # Vite configuration
├── .env                 # Environment variables (NOT committed to Git)
├── .env.example         # Template for environment variables
└── package.json         # Project dependencies
```

## How It Works

1. User fills out the form with:

   - Destination city
   - Number of days
   - Budget level (Low/Medium/High)
   - Travel preferences

2. The AI generates a structured JSON itinerary with:

   - Trip summary
   - Day-by-day activities with timings
   - Budget estimates per activity
   - Theme for each day

3. Results are displayed in a user-friendly card layout

## API Used

- **Google Generative AI API** (Gemini 2.5 Flash)
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent`

## Security Notes

- ⚠️ **Never commit `.env` file** to GitHub (added to `.gitignore`)
- API keys are sensitive - keep them private
- Use `.env.example` to show what variables are needed

## Future Enhancements

- Database integration for saving itineraries
- User authentication
- Multiple language support
- Real-time pricing integration
- Hotel/flight booking integration

## License

MIT

## Author

Your Name - B.Tech Project
