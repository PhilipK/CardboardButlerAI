document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submit');

    submitButton.addEventListener('click', async () => {
        const bggId = document.getElementById('bgg-id').value;
        const apiKey = document.getElementById('api-key').value;
        const model = document.getElementById('model').value;
        const other = document.getElementById('other').value;

        if (!bggId || !apiKey) {
            alert('Please fill in all the fields.');
            return;
        }
        showProgressSection();
        updateProgressMessage("Fetching user's board game collection...");

        let collection = await fetchUserCollection(bggId);
        const recommendations = await getGameRecommendations(apiKey, collection, other, model);
        displayResults(recommendations);
    });
});

async function fetchUserCollection(bggId) {
    const url = `https://www.boardgamegeek.com/xmlapi2/collection?username=${bggId}&own=1&excludesubtype=boardgameexpansion&stats=1`;

    const maxAttempts = 5;
    const initialRetryDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Error fetching user collection');
            }

            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");

            const message = xmlDoc.getElementsByTagName("message")[0];
            if (message) {
                const text = message.getAttribute("text");
                if (text === "Please try again later.") {
                    if (attempt < maxAttempts) {
                        const retryDelay = initialRetryDelay * Math.pow(2, attempt - 1);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        continue;
                    } else {
                        alert("The BoardGameGeek API is busy. We've tried multiple times but couldn't fetch your collection. Please try again later.");
                        hideProgressSection();
                        return [];
                    }
                }
            }

            const items = xmlDoc.getElementsByTagName("item");
            const collection = [];

            for (const item of items) {
                const objectId = item.getAttribute("objectid");
                const nameNode = item.getElementsByTagName("name")[0];
                const name = nameNode.textContent;
                const imageNode = item.getElementsByTagName("image")[0];
                const image = imageNode.textContent;
                const ratingNode = item.getElementsByTagName("rating")[0];
                const rating = ratingNode.getAttribute("value");

                if (image) {
                    const imageKey = "img-" + objectId;
                    localStorage.setItem(imageKey, image);
                }
                collection.push({
                    id: objectId,
                    image: image,
                    name: name,
                    rating: rating
                });
            }

            updateProgressMessage("Fetching game recommendations...");
            return collection;
        } catch (error) {
            console.error('Error fetching user collection:', error);
            return [];
        }
    }
}

async function getGameRecommendations(apiKey, collection, other, model) {

    updateProgressMessage("Fetching game recommendations...");
    const apiEndpoint = "https://api.openai.com/v1/chat/completions";
    const collectionString = collection.map(game => `Name: ${game.name} ID: ${game.id} Rating: ${game.rating}`).join(' ; ');
    const recommendationType = document.querySelector('input[name="recommendationType"]:checked').value;

    const messages = [
        {
            role: "system",
            content: `You are an AI that recommends board games based on the user's collection (including their personal ratings), only recommend games ${recommendationType === 'owned' ? 'they already own' : 'they dont own but could buy'} and take their rating into concideration (10.0 is max, 0.0 is minimum, N/A means they have not rated yet). You must reply in JSON ONLY! Never return anything but the JSON, and give 1 to 8 suggestions for each reply. You must return JSON with the BGG ID, the game name, a single sentence summary of the game, a sentence about what makes this game unique, and a single sentence of why you recommend this game for the group. Example JSON response: [{"id": "12345", "name": "Sample Game", "summary": "A quick summary", "unique": "What makes this game unique", "reason": "Your reason for recommending it, why does it fit what the user asks for, make each recommendation unique and try not to repeat yourself, don't mention the users rating, they already know it."}]`
        },
        {
            role: "user",
            content: `Here's my board game collection:\n ${collectionString}.`
        }
    ];

    if (other.trim() !== "") {
        messages[1].content += " Focus on: " + other;
    }

    const requestBody = {
        model: model || "GPT-4",
        messages
    };
    console.log(requestBody);

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

        const owned = document.querySelector('input[name="recommendationType"]:checked').value == "owned";
        if (owned) {

            recommendation.image = localStorage.getItem(imageKey);
        }
        listItem.innerHTML = `
            <img src="${recommendation.image}" />
            <strong>${recommendation.name} (${recommendation.id})</strong><br>
            <em>${recommendation.summary}</em><br>
            <div>${recommendation.unique}</div>
            <div>${recommendation.reason}</div>
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