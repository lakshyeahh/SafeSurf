(function() {
    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');

        @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes zoomCircles {
            0% { transform: scale(1); opacity: 0.2; }
            50% { transform: scale(1.5); opacity: 0.1; }
            100% { transform: scale(1); opacity: 0.2; }
        }
        
        #safesurf-bar {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            padding: 15px;
            z-index: 10000;
            font-family: 'Orbitron', Arial, sans-serif;
            font-size: 16px;
            text-align: center;
            background: linear-gradient(45deg, #1a1a2e, #16213e, #1a1a2e);
            background-size: 200% 200%;
            animation: gradientBG 5s ease infinite;
            color: #fff;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
        }
        
        #safesurf-content {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        #safesurf-label {
            font-weight: bold;
            font-size: 20px;
            color: #7b2cbf;
            text-shadow: 0 0 10px rgba(123, 44, 191, 0.7);
        }

        #safesurf-analyzing {
            position: relative;
            display: flex;
            align-items: center;
            font-weight: bold;
            color: #ffffff;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
        }

        #safesurf-analyzing::before {
            content: '';
            position: absolute;
            width: 100px;
            height: 100px;
            background: rgba(192, 192, 192, 0.2);
            border-radius: 50%;
            animation: zoomCircles 1.5s infinite ease-in-out;
        }

        #safesurf-result-circle {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid #fff;
            background-color: transparent;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
        }

        /* Result colors */
        .safe { background-color: #4CAF50; } /* Green */
        .caution { background-color: #FFC107; } /* Yellow */
        .danger { background-color: #F44336; } /* Red */
    `;
    document.head.appendChild(style);

    // Function to create and display the notification bar
    function displayNotification(message, score = null) {
        const existingBar = document.getElementById("safesurf-bar");
        if (existingBar) existingBar.remove();

        const bar = document.createElement("div");
        bar.id = "safesurf-bar";
        bar.innerHTML = `
            <div id="safesurf-label">SafeSurf</div>
            <div id="safesurf-analyzing">
                ${score === null ? `
                    <span>Analyzing...</span>
                ` : `
                    <span>Trust Score: ${score}/100</span>
                `}
            </div>
            <div id="safesurf-result-circle" class="${score === null ? '' : getScoreClass(score)}"></div>
        `;

        document.body.appendChild(bar);
        setTimeout(() => bar.style.animation = "fadeIn 0.5s ease-out", 0);

        setTimeout(() => {
            bar.style.animation = "fadeIn 0.5s ease-out reverse";
            setTimeout(() => bar.remove(), 500);
        }, 7000);
    }

    // Function to determine the score color class
    function getScoreClass(score) {
        if (score >= 75) return "safe";        // Green
        else if (score >= 50) return "caution"; // Yellow
        else return "danger";                   // Red
    }

    // Automatically analyze the current page
    const url = window.location.href;

    displayNotification("SafeSurf is analyzing...");

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
            const score = data.output.trust_score;
            displayNotification("SafeSurf Analysis: Trust Score", score);
        } else {
            displayNotification("SafeSurf: Analysis failed");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        displayNotification("SafeSurf: Unable to analyze the page");
    });
})();
