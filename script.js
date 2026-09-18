// =====================================
// NEWS API
// =====================================

// We no longer call GNews directly from the browser.
// GNews's free-tier key only allows CORS requests from "localhost", so
// calling it straight from client-side JS works on Live Server but gets
// silently blocked once the site is deployed anywhere else (like Vercel).
//
// Instead we call our own serverless function at /api/news (see
// api/news.js), which fetches from GNews on the server side - no CORS
// restriction applies there - and forwards the result back to us. This
// also keeps the API key out of the public page source.
const API_URL = "/api/news";

// Fallback image shown when an article has no image or its image URL
// fails to load (broken link, 404, hotlink block, etc.)
//
// This is an inline SVG data URI rather than a file path like
// "assets/images/placeholder.jpg" on purpose: a file path depends on
// that file actually existing in the deployed project, and if it
// doesn't, the fallback itself 404s and the browser just shows the
// alt text - which is worse than doing nothing. A data URI is built
// into the string itself, so there's no network request involved and
// it can never fail to load.
const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
            <rect width="100%" height="100%" fill="#12372A"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif"
                  font-size="28" font-weight="bold" fill="#F7F4EA"
                  text-anchor="middle" dominant-baseline="middle">W.</text>
        </svg>
    `);

// =====================================
// GET HTML ELEMENTS
// =====================================

const mainImage = document.querySelector(".main-news > img");
const mainTitle = document.querySelector(".main-content h1");
const mainDescription = document.querySelector(".main-text p");
const readMoreButton = document.querySelector(".main-text button");

const newSection = document.querySelector(".new-section");

const newsCards = document.querySelectorAll(".news-card");

// =====================================
// HELPERS
// =====================================

// Sets an <img>'s src safely: falls back to a local placeholder when
// the article has no image, and also falls back if the given URL
// fails to actually load (broken link / hotlink blocked / 404).
function setImageWithFallback(imgElement, src, alt) {
  imgElement.src = src || FALLBACK_IMAGE;
  imgElement.alt = alt || "News image";

  imgElement.onerror = function () {
    imgElement.onerror = null; // prevent any possible infinite loop
    imgElement.src = FALLBACK_IMAGE;
  };
}

// =====================================
// FETCH NEWS
// =====================================

async function getNews() {
  try {
    const response = await fetch(API_URL);

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    console.log("News received:", data);

    // Make sure articles exist
    if (!data.articles || data.articles.length === 0) {
      throw new Error("No news articles found.");
    }

    displayNews(data.articles);
  } catch (error) {
    console.error("Could not fetch news:", error);
  }
}

// =====================================
// DISPLAY NEWS
// =====================================

function displayNews(articles) {
  // ---------------------------------
  // MAIN NEWS
  // ---------------------------------

  const mainArticle = articles[0];

  setImageWithFallback(mainImage, mainArticle.image, mainArticle.title);

  mainTitle.textContent = mainArticle.title;

  mainDescription.textContent =
    mainArticle.description || "Read the latest news.";

  // Open the complete article
  readMoreButton.onclick = function () {
    window.open(mainArticle.url, "_blank");
  };

  // ---------------------------------
  // NEW SECTION
  // ---------------------------------

  const newArticles = articles.slice(1, 4);

  const newTitle = newSection.querySelector("h2");

  // Remove the old dummy articles
  newSection.querySelectorAll("article").forEach((article) => {
    article.remove();
  });

  // Remove old horizontal lines
  newSection.querySelectorAll("hr").forEach((line) => {
    line.remove();
  });

  // Add the real articles
  newArticles.forEach((article, index) => {
    const articleElement = document.createElement("article");

    articleElement.innerHTML = `
            <h3>${article.title}</h3>
            <p>${article.description || "Read more about this story."}</p>
        `;

    // Make article clickable
    articleElement.addEventListener("click", function () {
      window.open(article.url, "_blank");
    });

    newSection.appendChild(articleElement);

    // Add divider except after the last article
    if (index < newArticles.length - 1) {
      const divider = document.createElement("hr");

      newSection.appendChild(divider);
    }
  });

  // ---------------------------------
  // BOTTOM NEWS CARDS
  // ---------------------------------

  const bottomArticles = articles.slice(4, 7);

  bottomArticles.forEach((article, index) => {
    if (!newsCards[index]) {
      return;
    }

    const card = newsCards[index];

    const image = card.querySelector("img");
    const title = card.querySelector("h3");
    const description = card.querySelector("p");

    setImageWithFallback(image, article.image, article.title);

    title.textContent = article.title;

    description.textContent = article.description || "Read the latest story.";

    // Make card clickable
    card.style.cursor = "pointer";

    card.addEventListener("click", function () {
      window.open(article.url, "_blank");
    });
  });
}

// =====================================
// START THE WEBSITE
// =====================================

getNews();
