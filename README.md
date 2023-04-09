# Cardboard Butler AI

Cardboard Butler AI is an early prototype/proof of concept web application that helps users decide which board game to play next. The app uses the user's BoardGameGeek (BGG) collection and the Chat GPT API to provide personalized game recommendations.

## Features

- Retrieve the user's board game collection from BoardGameGeek using their BGG username.
- Provide recommendations based on the user's collection and the number of players in their group.
- Display up to 3 game recommendations with the game's name, BGG ID, a brief summary, and a reason for the recommendation.
- Show an image of each recommended game.

## Usage

1. Clone the repository or download the source code.
2. Open `index.html` in your browser.
3. Enter your BoardGameGeek username, the number of players in your group, and your Chat GPT API key.
4. Click the "Submit" button to fetch your game collection and receive personalized game recommendations.

## Technologies

- HTML, CSS, and vanilla JavaScript for the frontend.
- BoardGameGeek API for fetching the user's game collection.
- OpenAI's Chat GPT API for generating personalized game recommendations.

## Disclaimer

This project is an early prototype/proof of concept, and as such, it may not be fully optimized or production-ready. The user experience and the quality of recommendations may not be ideal and can be improved upon. The project is meant to serve as a starting point for a more robust and feature-rich application.

## License

MIT License

## Contributing

This project is open to contributions. Feel free to submit issues or pull requests for improvements, bug fixes, or new features.
