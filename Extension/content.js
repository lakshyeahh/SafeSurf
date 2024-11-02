// content.js

// Function to create and display the notification bar
function displayNotification(message, color) {
    // Check if the notification bar already exists
    if (document.getElementById("safesurf-bar")) return;

    // Create the notification bar
    const bar = document.createElement("div");
    bar.id = "safesurf-bar";
    bar.style.position = "fixed";
    bar.style.top = "0";
    bar.style.left = "0";
    bar.style.width = "100%";
    bar.style.padding = "10px";
    bar.style.textAlign = "center";
    bar.style.zIndex = "10000";
    bar.style.color = "#fff";
    bar.style.backgroundColor = color || "#007bff";  // Default to blue for "Analyzing..."
    bar.style.fontFamily = "Arial, sans-serif";
    bar.style.fontSize = "16px";
    bar.textContent = message;

    // Add the notification bar to the body
    document.body.appendChild(bar);

    // Remove the bar after 5 seconds
    setTimeout(() => {
        bar.remove();
    }, 5000);
}

// Automatically analyze the current page
(function() {
    const url = window.location.href;

    // Show "Analyzing..." message
    displayNotification("SafeSurf is analyzing...", "#007bff");

    // Send the URL to the Flask server for analysis
    fetch("http://localhost:5000/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: url })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "SUCCESS") {
            // Display the result with a color-coded trust score
            const score = data.output.trust_score;
            let color;

            if (score >= 70) color = "green";
            else if (score >= 50) color = "yellow";
            else color = "red";

            const message = `SafeSurf Analysis: Trust Score ${score} / 100`;
            displayNotification(message, color);
        } else {
            displayNotification("SafeSurf: Analysis failed", "red");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        displayNotification("SafeSurf: Unable to analyze the page", "red");
    });
})();
