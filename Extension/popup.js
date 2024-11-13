    document.addEventListener("DOMContentLoaded", async () => {
        const output = document.getElementById("output");

        try {
            // Get the current tab's URL
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const url = tab.url;

            if (!url) {
                output.innerHTML = "<p>Unable to retrieve the URL.</p>";
                return;
            }

            // Display a message to the user
            output.innerHTML = "<p>Analyzing the current page...</p>";

            // Send the URL to the Flask server for analysis
            const response = await fetch("http://localhost:5000/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ url: url })
            });

            if (!response.ok) throw new Error("Failed to fetch data");

            const data = await response.json();

            if (data.status === "SUCCESS") {
                const result = data.output;
                const ssl = result.ssl;
                const whois = result.whois;

                // Displaying the entire response in structured format
                output.innerHTML = `
                    <div class="section trust-score ${result.trust_score < 50 ? "red-bg" : result.trust_score < 75 ? "yellow-bg" : "green-bg"}">
        <h2>Trust Score</h2>
        <p class="score">${result.trust_score} / 100</p>
        <p class="desc">A trust score below 50 indicates a potential risk. Higher scores suggest greater trustworthiness.</p>
    </div>

    <div class="section general-info">
        <h2>General Information</h2>
        <div class="info-item">
            <span class="label">Domain Age:</span>
            <span class="value ${parseFloat(result.age) < 1 ? "red-text" : "green-text"}">${result.age}</span>
        </div>
        <p class="desc">Older domains are generally more established and trustworthy.</p>
        
        <div class="info-item">
            <span class="label">Global Rank:</span>
            <span class="value ${result.rank < 500000 ? "green-text" : "red-text"}">${result.rank}</span>
        </div>
        <p class="desc">A higher rank suggests better popularity and trustworthiness.</p>
        
        <div class="info-item">
            <span class="label">URL Redirects:</span>
            <span class="value ${result.url_redirects ? "red-text" : "green-text"}">${result.url_redirects ? "Yes" : "No"}</span>
        </div>
        <p class="desc">Redirects may hide the true destination, potentially indicating phishing attempts.</p>

        <div class="info-item">
            <span class="label">Too Long URL:</span>
            <span class="value ${result.too_long_url ? "red-text" : "green-text"}">${result.too_long_url ? "Yes" : "No"}</span>
        </div>
        <p class="desc">Long URLs can sometimes be used to disguise malicious links.</p>
        
        <div class="info-item">
            <span class="label">Too Deep URL:</span>
            <span class="value ${result.too_deep_url ? "red-text" : "green-text"}">${result.too_deep_url ? "Yes" : "No"}</span>
        </div>
        <p class="desc">Overly complex URLs can also be a sign of phishing.</p>
    </div>

    <div class="section security-info">
        <h2>Security Details</h2>
        <div class="info-item">
            <span class="label">HTTP Status Code:</span>
            <span class="value ${result.response_status === 200 ? "green-text" : "red-text"}">${result.response_status}</span>
        </div>
        <p class="desc">A status of 200 indicates that the site is accessible.</p>

        <div class="info-item">
            <span class="label">HSTS Support:</span>
            <span class="value ${result.hsts_support ? "green-text" : "red-text"}">${result.hsts_support ? "Yes" : "No"}</span>
        </div>
        <p class="desc">HSTS ensures that only HTTPS connections are allowed, increasing security.</p>

        <div class="info-item">
            <span class="label">Use of URL Shortener:</span>
            <span class="value ${result.is_url_shortened ? "red-text" : "green-text"}">${result.is_url_shortened ? "Yes" : "No"}</span>
        </div>
        <p class="desc">Shortened URLs may obscure the true destination and can be risky.</p>
    </div>

    <div class="section tech-info">
        <h2>Technical Details</h2>
        <div class="info-item">
            <span class="label">IP of Domain:</span>
            <span class="value black-text">${result.ip}</span>
        </div>
        <p class="desc">This is the IP address associated with the domain, used for network routing.</p>

        <div class="info-item">
            <span class="label">IP Address Present in URL:</span>
            <span class="value ${result.ip_present ? "red-text" : "green-text"}">${result.ip_present ? "Yes" : "No"}</span>
        </div>
        <p class="desc">Using an IP address instead of a domain can be a phishing tactic.</p>
    </div>

    <div class="section ssl-info">
        <h2>SSL Certificate Details</h2>
        <div class="info-item">
            <span class="label">Cipher Suite:</span>
            <span class="value black-text">${ssl["Cipher Suite"]}</span>
        </div>
        <div class="info-item">
            <span class="label">Days to Expiry:</span>
            <span class="value ${ssl["Days to Expiry"] < 30 ? "red-text" : "green-text"}">${ssl["Days to Expiry"]} days</span>
        </div>
        <p class="desc">Certificates close to expiry may be a risk if not renewed.</p>

        <div class="info-item">
            <span class="label">Is Certificate Revoked:</span>
            <span class="value ${ssl["Is Certificate Revoked"] ? "red-text" : "green-text"}">${ssl["Is Certificate Revoked"] ? "Yes" : "No"}</span>
        </div>
        <p class="desc">A revoked SSL certificate may indicate a security issue.</p>

        <div class="info-item">
            <span class="label">Issued By:</span>
            <span class="value black-text">${ssl["Issued By"]}</span>
        </div>
        <div class="info-item">
            <span class="label">Issued To:</span>
            <span class="value black-text">${ssl["Issued To"]}</span>
        </div>
        <div class="info-item">
            <span class="label">Valid From:</span>
            <span class="value black-text">${ssl["Valid From"]}</span>
        </div>
        <div class="info-item">
            <span class="label">Valid Till:</span>
            <span class="value black-text">${ssl["Valid Till"]}</span>
        </div>
        <div class="info-item">
            <span class="label">TLS Version:</span>
            <span class="value black-text">${ssl["Version"]}</span>
        </div>
    </div>

    <div class="section whois-info">
        <h2>WHOIS Information</h2>
        <div class="info-item">
            <span class="label">Domain Name:</span>
            <span class="value black-text">${whois["Domain Name"]}</span>
        </div>
        <div class="info-item">
            <span class="label">Registrar:</span>
            <span class="value black-text">${whois.Registrar}</span>
        </div>
        <div class="info-item">
            <span class="label">Registrar URL:</span>
            <span class="value black-text">${whois["Registrar Url"]}</span>
        </div>
        <div class="info-item">
            <span class="label">Creation Date:</span>
            <span class="value black-text">${whois["Creation Date"]}</span>
        </div>
        <div class="info-item">
            <span class="label">Expiration Date:</span>
            <span class="value black-text">${whois["Expiration Date"]}</span>
        </div>
        <div class="info-item">
            <span class="label">Updated Date:</span>
            <span class="value black-text">${whois["Updated Date"]}</span>
        </div>
        <div class="info-item">
            <span class="label">Registrant Country:</span>
            <span class="value black-text">${whois["Registrant Country"]}</span>
        </div>
        <div class="info-item">
            <span class="label">Registrant Name:</span>
            <span class="value black-text">${whois["Registrant Name"]}</span>
        </div>
        <div class="info-item">
            <span class="label">Name Servers:</span>
            <span class="value black-text">${whois["Name Servers"]}</span>
        </div>
        <div class="info-item">
            <span class="label">Status:</span>
            <span class="value black-text">${whois.Status}</span>
        </div>
    </div>

    <div class="footer-note">(For more detailed information, visit SafeSurf)</div>
    `;
            } else {
                output.innerHTML = `<p>Error: ${data.msg}</p>`;
            }
        } catch (error) {
            output.innerHTML = "<p>Error: Unable to analyze the URL.</p>";
            console.error("Error:", error);
        }
    });
