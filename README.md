# Chess Game

A real-time multiplayer chess game built with Node.js, Express, Socket.IO, and chess.js.

## Features

- Real-time multiplayer gameplay
- Move validation
- Game state tracking
- Move history
- Captured pieces display
- Game reset functionality
- Spectator mode

## Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

## Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd chess
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Deployment

### Deploying to Render

1. Create a Render account at https://render.com

2. Create a new Web Service:
   - Connect your GitHub repository
   - Select "Node" as the runtime
   - Set the build command: `npm install`
   - Set the start command: `npm start`
   - Add environment variables if needed

3. Click "Create Web Service"

### Deploying to Heroku

1. Create a Heroku account at https://heroku.com

2. Install the Heroku CLI:
```bash
npm install -g heroku
```

3. Login to Heroku:
```bash
heroku login
```

4. Create a new Heroku app:
```bash
heroku create your-app-name
```

5. Deploy the application:
```bash
git push heroku main
```

## Environment Variables

- `PORT`: The port number the server will listen on (default: 3000)

## License

ISC 