document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submit');

    submitButton.addEventListener('click', async () => {
        const bggId = document.getElementById('bgg-id').value;
        const players = document.getElementById('players').value;
        const apiKey = document.getElementById('api-key').value;
        const other = document.getElementById('other').value;

        if (!bggId || !players || !apiKey) {
            alert('Please fill in all the fields.');
            return;
        }
    showProgressSection();
    updateProgressMessage("Fetching user's board game collection...");

        let cache = localStorage.getItem(bggId);
        let collection = [];
        if (!cache) {
            collection = await fetchUserCollection(bggId);
            //TODO make this invalid at some point
            localStorage.setItem(bggId, JSON.stringify(collection));
        } else {
            let cacheParsed = JSON.parse(cache);
            collection = cacheParsed;
        }
        if (collection) {
            const recommendations = await getGameRecommendations(apiKey, collection, players, other);
            displayResults(recommendations);
        }
    });
});

async function fetchUserCollection(bggId) {
    const url = `https://www.boardgamegeek.com/xmlapi2/collection?username=${bggId}&own=1`;

    try {
        const response = await fetch(url);
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        const items = xmlDoc.getElementsByTagName("item");
        const collection = Array.from(items).map(item => {
            const image = item.getElementsByTagName("image")[0].innerHTML;
            const id = item.getAttribute("objectid");
            const imageKey = "img-" + id;
            if (image) {
                localStorage.setItem(imageKey, image);
            }
            return {
                id: id,
                name: item.getElementsByTagName("name")[0].innerHTML,
            };
        });

        return collection;
    } catch (error) {
        console.error('Error fetching user collection:', error);
        alert('Error fetching user collection. Please check the BGG ID.');
        return null;
    }
}

async function getGameRecommendations(apiKey, collection, players, other) {

    updateProgressMessage("Fetching game recommendations...");
    const apiEndpoint = "https://api.openai.com/v1/chat/completions";
    const collectionString = collection.map(game => `${game.name} (${game.id})`).join(', ');

    const messages = [
        {
            role: "system",
            content: `You are an AI that recommends board games based on the user's collection and the user's current play group. You must reply in JSON ONLY! Never return anything but the JSON, and give up to 4 suggestions for each reply. You must return JSON with the BGG ID, the game name, a single sentence summary of the game, and a single sentence of why you recommend this game for the group. Example JSON response: [{"id": "12345", "name": "Sample Game", "summary": "A fun strategy game for all ages.", "reason": "This game works well with ${players} players and offers a good balance of strategy and luck."}]`
        },
        {
            role: "user",
            content: `I have a playgroup of ${players} players and here's my board game collection: ${collectionString}.`
        }
    ];

    if (other.trim() !== "") {
        messages[1].content += " " + other;
    }

    const requestBody = {
        model: "gpt-4",
        messages
    };

    try {
        const response = await fetch(apiEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            return JSON.parse(data.choices[0].message.content.trim());
        }

        return [];
    } catch (error) {
        console.error('Error fetching game recommendations:', error);
        alert('Error fetching game recommendations. Please check the API key.');
        return [];
    }
}

function displayResults(recommendations) {
    hideProgressSection();
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    if (recommendations.length === 0) {
        resultsContainer.innerHTML = "<p>No recommendations found.</p>";
        return;
    }

    const list = document.createElement("ul");
    for (const recommendation of recommendations) {
        const listItem = document.createElement("li");

        const imageKey = "img-" + recommendation.id;
        recommendation.image = localStorage.getItem(imageKey);
        listItem.innerHTML = `
            <img src="${recommendation.image}" alt="${recommendation.name}" />
            <strong>${recommendation.name} (${recommendation.id})</strong><br>
            <em>${recommendation.summary}</em><br>
            <span>Recommended because: ${recommendation.reason}</span>
        `;
        list.appendChild(listItem);
    }
    resultsContainer.appendChild(list);
}



function showProgressSection() {
    const progressSection = document.getElementById('progress-section');
    progressSection.style.display = 'block';
}

function hideProgressSection() {
    const progressSection = document.getElementById('progress-section');
    progressSection.style.display = 'none';
}

function updateProgressMessage(message) {
    const progressMessage = document.getElementById('progress-message');
    progressMessage.innerHTML = message;
}