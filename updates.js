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

  function renderNextBatch() {
    const nextPosts = allPosts.slice(visibleCount, visibleCount + PAGE_SIZE);
// Render Loop
nextPosts.forEach((post, index) => {
  let imageHTML = "";
  if (post.image && String(post.image).trim() !== "") {
    imageHTML = `<img class="update-image" src="${post.image}" alt="">`;
  }

  const latestClass = (visibleCount === 0 && index === 0) ? "latest" : "";

  const postHTML = `
   <div class="update-post ${latestClass}" style="animation-delay:${index * 60}ms">
      <p class="update-date">${post.date ? formatDate(post.date) : ""}</p>
      <h3 class="update-title">${post.title || ""}</h3>
      <p class="update-body">${post.body || ""}</p>
      ${imageHTML}
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
