document.addEventListener("DOMContentLoaded", async () => {
  const feed = document.getElementById("updates-feed");
  const loadMoreBtn = document.getElementById("load-more-updates");

  const PAGE_SIZE = 5;
  let allPosts = [];
  let visibleCount = 0;

  function formatDate(isoDate) {
  const d = new Date(isoDate);
  if (isNaN(d)) return isoDate; // fallback if date is weird
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildVideoEmbed(video) {
  if (!video || !video.type || !video.id) return "";

  const type = String(video.type).toLowerCase().trim();
  const id = String(video.id).trim();

  // Basic allowlist: only safe characters for IDs
  // YouTube IDs are usually [A-Za-z0-9_-], Vimeo IDs are digits
  if (type === "youtube") {
  if (!/^[a-zA-Z0-9_-]{6,}$/.test(id)) return "";
  const src = `https://www.youtube-nocookie.com/embed/${id}`;
  return `
    <div class="update-video">
      <iframe
        src="${src}"
        title="YouTube video embed"
        loading="lazy"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
      </iframe>
    </div>
  `;
}


  if (type === "vimeo") {
  if (!/^\d+$/.test(id)) return "";
  const src = `https://player.vimeo.com/video/${id}`;
  return `
    <div class="update-video">
      <iframe
        src="${src}"
        title="Vimeo video embed"
        loading="lazy"
        frameborder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen>
      </iframe>
    </div>
  `;
}


  return "";
}

  function renderNextBatch() {
    const nextPosts = allPosts.slice(visibleCount, visibleCount + PAGE_SIZE);
// ===============================
// UPDATE RENDER LOOP (STABLE)
// Supports: text, image, youtube, vimeo
// Do NOT rename post.body / post.title
// ===============================

nextPosts.forEach((post, index) => {
  const latestClass = (visibleCount === 0 && index === 0) ? "latest" : "";

  let mediaHTML = "";

  // Prefer video if present, otherwise use image
  const videoHTML = buildVideoEmbed(post.video);
 if (videoHTML) {
  mediaHTML = videoHTML;
} else if (post.image && String(post.image).trim() !== "") {
  mediaHTML = `
    <img
      class="update-image"
      src="${post.image}"
      alt="${post.title || "Update image"}"
      title="${post.title || "Update image"}"
      loading="lazy"
    >
  `;
}


 const postHTML = `
  <div class="update-post ${latestClass}" style="animation-delay:${index * 60}ms">
    <p class="update-date">${post.date ? formatDate(post.date) : ""}</p>
    <h3 class="update-title">${post.title || ""}</h3>
    <p class="update-body">${post.body || ""}</p>
    ${mediaHTML}
  </div>
`;


  feed.insertAdjacentHTML("beforeend", postHTML);
});

    visibleCount += nextPosts.length;

    // Show/hide button
    if (visibleCount >= allPosts.length) {
      loadMoreBtn.style.display = "none";
    } else {
      loadMoreBtn.style.display = "inline-block";
    }
  }

  feed.innerHTML = `<p>Loading updates…</p>`;

  try {
    const res = await fetch("./updates.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not load updates.json (HTTP ${res.status})`);

    allPosts = await res.json();
    if (!Array.isArray(allPosts) || allPosts.length === 0) {
      throw new Error("updates.json loaded, but it has no posts (or it isn't an array).");
    }

    // Sort newest first (YYYY-MM-DD)
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Reset feed and render first batch
    feed.innerHTML = "";
    visibleCount = 0;
    renderNextBatch();

    loadMoreBtn.addEventListener("click", renderNextBatch);

  } catch (err) {
    console.error("updates feed error:", err);
    feed.innerHTML = `
      <p><strong>Updates failed to load.</strong></p>
      <p>${err.message}</p>
    `;
    loadMoreBtn.style.display = "none";
  }
});
