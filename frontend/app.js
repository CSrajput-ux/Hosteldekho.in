import { signInWithPopup } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { auth, googleProvider } from "./firebase.js";

let currentSearchQuery = "";
let selectedType = "All";
let isLocationVerified = false;
let isPropertyImagesUploaded = false;
let selectedPropertyTypes = {
  flat: { selected: false, price: "" },
  boys: { selected: false, price: "" },
  girls: { selected: false, price: "" },
  night: { selected: false, price: "" }
};
let currentGeocodedResults = [];
let onboardingStep = 1; // 1: Aadhaar, 2: Selfie, 3: Property, 4: Proof
let isAadhaarVerified = false;
let verifiedAadhaarData = null;
let isSelfieCaptured = false;
let currentCaptchaStr = "";
let localStream = null;
let adminSubRoute = "overview";
let adminData = { stats: null, pending: [], verified: [], users: [], kyc: [], settings: [] };
let userDashboardData = { bookings: [], properties: [], loading: false, fetched: false };
let activeProfileTab = "overview"; // "overview", "history", "security", "bookings"
let isAuthInProgress = false; // Guard for Firebase Auth
let onboardingData = {
  propertyTitle: "",
  streetAddress: "",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  amenities: "",
  description: ""
};
let onboardingFiles = [];


window.handleOnboardingInput = (id, val) => {
  onboardingData[id] = val;
};

// --- Real Data State ---
const API_URL = "http://localhost:5000/api";
let properties = [];
let categories = [];
let featuredProperties = [];
let currentProperty = null;
let viewDataLoading = false;
let viewDataError = null;
let homeFetched = false;
let searchFetched = false;
let homeFetching = false;
let searchFetching = false;
let lastSearchQuery = null;
let lastSelectedType = null;

/** API Helper */
async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await response.json();
  if (!data.success) {
    const errorMsg = data.errors && data.errors.length > 0 
      ? data.errors.map(e => e.message).join("\n") 
      : data.message;
    throw new Error(errorMsg || "API Error");
  }
  return data;
}

// Data Loaders
async function loadHomeData() {
  if (homeFetched || homeFetching) return;
  homeFetching = true;
  viewDataLoading = true;
  viewDataError = null;
  render(); 
  try {
    const [featRes, catRes] = await Promise.all([
      fetchAPI("/properties/featured"),
      fetchAPI("/properties/categories")
    ]);
    featuredProperties = featRes.data;
    categories = catRes.data;
    homeFetched = true;
  } catch (err) {
    console.error("Home load error:", err);
    viewDataError = "Unable to load home data. Please try again later.";
  } finally {
    homeFetching = false;
    viewDataLoading = false;
    render();
  }
}

async function loadSearchData() {
  if (searchFetching) return;
  searchFetching = true;
  viewDataLoading = true;
  render();
  try {
    const typeQuery = selectedType !== "All" ? `&type=${selectedType.toUpperCase().replace(" ", "_")}` : "";
    const res = await fetchAPI(`/properties?city=${currentSearchQuery}${typeQuery}`);
    properties = res.data;
    searchFetched = true;
  } catch (err) {
    console.error("Search load error:", err);
  } finally {
    searchFetching = false;
    viewDataLoading = false;
    render();
  }
}

async function loadPropertyDetail(idOrSlug) {
  viewDataLoading = true;
  render();
  try {
    const res = await fetchAPI(`/properties/${idOrSlug}`);
    currentProperty = res.data;
  } catch (err) {
    console.error("Detail load error:", err);
  } finally {
    viewDataLoading = false;
    render();
  }
}

// Removed dummy lists - now fetched from API

const routes = {
  home: renderHome,
  search: renderSearch,
  detail: renderDetail,
  owner: renderOwner,
  user: renderUser,
  booking: renderBooking,
  admin: renderAdmin
};

const categoryMapping = {
  "PG": { name: "PG", img: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=900&q=80" },
  "BOYS_HOSTEL": { name: "Boys Hostel", img: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80" },
  "GIRLS_HOSTEL": { name: "Girls Hostel", img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80" },
  "FLAT": { name: "Flats", img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80" }
};

function propertyCard(property, index) {
  const image = property.images && property.images.length > 0 ? property.images[0].url : "";
  const tag = property.featured ? "Featured" : property.verified ? "Verified" : "";
  const badgeClass = tag === "Featured" ? "blue" : tag === "Verified" ? "green" : "yellow";
  const typeLabel = categoryMapping[property.type]?.name || property.type;

  return `
    <article class="property-card" onclick="location.hash='#detail/${property.slug}'">
      <div class="card-media">
        <img src="${image}" alt="${property.title}">
        <div class="badge-row">
          ${tag ? `<span class="badge ${badgeClass}">${tag}</span>` : ""}
          <button class="heart" type="button" aria-label="Save ${property.title}">♡</button>
        </div>
      </div>
      <div class="card-body">
        <div class="meta-row">
          <h3>${property.title}</h3>
          <span class="rating">★ ${property.totalRating || property.rating || "N/A"}</span>
        </div>
        <p class="muted">${property.city}</p>
        <div class="price-row">
          <span><strong class="price">Rs ${property.priceStartingFrom || property.price}</strong> / month</span>
          <span class="tag blue">${typeLabel}</span>
        </div>
      </div>
    </article>
  `;
}

function listingHistory(p) {
  const image = p.images && p.images.length ? p.images[0].url : "";
  const statusClass = p.status.toLowerCase();
  
  return `
    <div class="managed-row">
      <img src="${image}" alt="${p.title}">
      <div class="property-info">
        <strong>${p.title}</strong>
        <p class="muted">${p.city} · ${p.type}</p>
        <div class="status-badge-inline ${statusClass}">${p.status}</div>
      </div>
      <div class="utility-row">
        <button class="outline-button small" onclick="location.hash='#detail/${p.id}'">View</button>
        <button class="ghost-button small" type="button">Edit</button>
      </div>
    </div>
  `;
}

function renderHome() {
  if (viewDataLoading) {
    return `
      <section class="page">
        <div class="loading-state">
           <div class="loader"></div>
           <p>Searching for the best stays...</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="page">
      <section class="hero">
        <div class="hero-inner">
          <div class="hero-copy">
            <p class="eyebrow">Verified stays across India</p>
            <h1>Find Your Perfect Stay</h1>
            <p>Search hostels, PGs, and rooms near college, office, metro, and the places that make daily life easier.</p>
          </div>
          ${searchPanel()}
        </div>
      </section>

      <section class="band">
        <div class="section-inner">
          <div class="section-head">
            <div>
              <p class="eyebrow">Featured homes</p>
              <h2>Ready-to-move stays</h2>
              <p>Shortlisted for commute, food, safety, and honest reviews.</p>
            </div>
            <a class="outline-button small" href="#search">View all</a>
          </div>
          <div class="property-grid">${(featuredProperties.length ? featuredProperties : properties).slice(0, 3).map(propertyCard).join("")}</div>
        </div>
      </section>

      <section class="band alt">
        <div class="section-inner">
          <div class="section-head">
            <div>
              <p class="eyebrow">Browse by need</p>
              <h2>Pick your stay style</h2>
            </div>
          </div>
          <div class="category-grid">
            ${categories.map((cat) => {
              const meta = categoryMapping[cat.type] || { name: cat.type, img: "" };
              return `<a class="category-card" href="#search" style="background-image:url('${meta.img}')"><span>${meta.name}</span></a>`;
            }).join("")}
          </div>
        </div>
      </section>
      
      <section class="band">
        <div class="section-inner">
          <div class="ai-strip">
            <div>
              <p class="eyebrow">Best for you</p>
              <h2>AI picks that match your routine</h2>
              <p>Get stays ranked by commute time, food preferences, budget, gender comfort, and move-in urgency.</p>
              <a class="gradient-button" href="#search">See recommendations</a>
            </div>
            <div class="ai-list">
              <div><span>Under 20 min to metro</span><strong>12 homes</strong></div>
              <div><span>Meals plus WiFi</span><strong>28 homes</strong></div>
              <div><span>Female verified owners</span><strong>9 homes</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section class="band tint">
        <div class="section-inner">
          <div class="trust-grid">
            ${trustItem("✓", "Verified properties", "KYC-approved listings, recent photos, and check-in ready rooms.")}
            ${trustItem("₹", "Secure booking", "Pay only on HostelDekho with transparent deposits and receipts.")}
            ${trustItem("★", "Real reviews", "Ratings from students and professionals who stayed there.")}
            ${trustItem("☎", "Owner chat", "Ask food, curfew, laundry, and move-in questions before booking.")}
          </div>
        </div>
      </section>

      ${footer()}
    </section>
  `;
}

function searchPanel() {
  return `
    <form class="search-panel">
      <div class="search-field">
        <label for="location">Location</label>
        <input id="location" value="Bengaluru" aria-label="Location">
      </div>
      <div class="search-field">
        <label for="price">Price</label>
        <select id="price" aria-label="Price">
          <option>Under Rs 10k</option>
          <option>Rs 10k - 15k</option>
          <option>Rs 15k+</option>
        </select>
      </div>
      <div class="search-field">
        <label for="gender">Gender</label>
        <select id="gender" aria-label="Gender">
          <option>Any</option>
          <option>Boys</option>
          <option>Girls</option>
          <option>Unisex</option>
        </select>
      </div>
      <div class="search-field">
        <label for="amenity">Amenities</label>
        <select id="amenity" aria-label="Amenities">
          <option>WiFi, Food, AC</option>
          <option>Food included</option>
          <option>Private room</option>
        </select>
      </div>
      <a class="gradient-button" href="#search">Search</a>
    </form>
  `;
}

function trustItem(icon, title, text) {
  return `
    <article class="trust-item">
      <span class="trust-icon">${icon}</span>
      <h3>${title}</h3>
      <p class="muted">${text}</p>
    </article>
  `;
}

function renderSearch() {
  if (viewDataLoading && !properties.length) {
    return `
      <section class="page search-page">
        <div style="grid-column: 1/-1; padding: 100px; text-align: center;">
          <div class="loader"></div>
          <p class="mt-3">Fetching verified stays...</p>
        </div>
      </section>
    `;
  }

  const typeFilters = [
    { label: "All", icon: "✦" },
    { label: "Girls Hostel", icon: "👩" },
    { label: "Boys Hostel", icon: "👨" },
    { label: "Flat", icon: "🏠" },
    { label: "Night Stay", icon: "🌙" }
  ];

  const staysText = currentSearchQuery 
    ? `${properties.length} stays for "${currentSearchQuery}"` 
    : `${properties.length} stays in ${properties.length > 0 ? properties[0].city : 'selected area'}`;

  return `
    <section class="page search-page">
      <aside class="filters">
        <p class="eyebrow">Filters</p>
        <h1 class="panel-title">${staysText}</h1>
        ${filterGroup("Price", `<input type="range" id="priceSlider" min="5000" max="25000" value="12000"><div class="range-label"><span>Rs 5k</span><span id="priceVal">Rs 12,000</span><span>Rs 25k</span></div>`)}
        ${filterGroup("Distance", `<input type="range" id="distanceSlider" min="1" max="20" value="6"><div class="range-label"><span>1 km</span><span id="distanceVal">6 km</span><span>20 km</span></div>`)}
        ${filterGroup("Amenities", checks(["Food", "AC", "WiFi", "Laundry", "Power backup"]))}
        ${filterGroup("Rating", checks(["4.5+", "4.0+", "Newly listed"]))}
        <button class="gradient-button" type="button">Apply filters</button>
      </aside>
      <section class="results-list">
        <div class="section-head">
          <div>
            <p class="eyebrow">Search results</p>
            <h2>Map-ready homes ${viewDataLoading ? '<span class="loader-inline"></span>' : ''}</h2>
            <p>Verified stays near your searched location.</p>
          </div>
        </div>

        <div class="type-filter-bar" role="radiogroup" aria-label="Filter by property type">
          ${typeFilters.map(f => `
            <button class="type-chip ${selectedType === f.label ? 'active' : ''}" 
                    onclick="handleTypeFilter('${f.label}')"
                    role="radio" 
                    aria-checked="${selectedType === f.label}" 
                    aria-label="Filter: ${f.label}">
              <span class="chip-icon">${f.icon}</span>
              <span class="chip-label">${f.label}</span>
            </button>
          `).join("")}
        </div>

        <div class="results-grid-vertical">
          ${properties.length ? properties.map(resultCard).join("") : `<div class="empty-state">No hostels found${selectedType !== 'All' ? ` for type "${selectedType}"` : ''} ${currentSearchQuery ? `matching "${currentSearchQuery}"` : ''}</div>`}
        </div>
      </section>
      <aside class="map-panel" aria-label="Map with prices">
        <div class="map-search-wrap">
          <div class="map-search-input">
            <span class="search-icon">🔍</span>
            <input id="mapSearchInput" type="text" placeholder="Search area or hostel..." value="${currentSearchQuery}">
            ${currentSearchQuery ? `<button id="clearMapSearch" class="clear-btn">✕</button>` : ""}
          </div>
        </div>
        ${properties.map((p, i) => `
          <span class="map-pin pin-${(i % 4) + 1}">Rs ${p.priceStartingFrom || p.price}</span>
        `).join("")}
      </aside>
      <button class="gradient-button mobile-filter" type="button">Filters</button>
    </section>
  `;
}

window.handleTypeFilter = (type) => {
  selectedType = type;
  loadSearchData();
};

function filterGroup(title, content) {
  return `<div class="filter-group"><strong>${title}</strong>${content}</div>`;
}

function checks(items) {
  return `<div class="check-list">${items.map((item, index) => `<label><input type="checkbox" ${index < 2 ? "checked" : ""}> ${item}</label>`).join("")}</div>`;
}

function resultCard(property, index) {
  const image = property.images && property.images.length > 0 ? property.images[0].url : "";
  const tag = property.featured ? "Featured" : property.verified ? "Verified" : "";
  const badgeClass = tag === "Featured" ? "blue" : tag === "Verified" ? "green" : "yellow";
  const typeLabel = categoryMapping[property.type]?.name || property.type;

  return `
    <article class="result-card" onclick="location.hash='#detail/${property.slug || property.id}'">
      <div class="card-media">
        <img src="${image}" alt="${property.title}">
        <div class="badge-row">
          ${tag ? `<span class="badge ${badgeClass}">${tag}</span>` : ""}
          <button class="heart" type="button" aria-label="Save ${property.title}">♡</button>
        </div>
      </div>
      <div class="result-body">
        <div class="meta-row">
          <h3>${property.title}</h3>
          <span class="rating">★ ${property.totalRating || property.rating || "N/A"}</span>
        </div>
        <p class="muted">${property.city}</p>
        <div class="result-tags">
          <span class="tag blue">${typeLabel}</span>
          ${property.foodIncluded ? '<span class="tag green">Meals included</span>' : ''}
          ${property.wifiIncluded ? '<span class="tag">WiFi</span>' : ''}
          ${property.acAvailable ? '<span class="tag">AC</span>' : ''}
        </div>
        <div class="price-row">
          <span><strong class="price">Rs ${property.priceStartingFrom || property.price}</strong> / month</span>
          <a class="outline-button small" href="#detail/${property.slug || property.id}">View details</a>
        </div>
      </div>
    </article>
  `;
}

function renderDetail(idOrSlug) {
  if (viewDataLoading || !currentProperty) {
    return `
      <section class="page">
        <div class="loading-state">
           <div class="loader"></div>
           <p>Opening property details...</p>
        </div>
      </section>
    `;
  }

  const p = currentProperty;
  const gallery = p.images && p.images.length ? p.images : [{ url: "https://via.placeholder.com/1200x800?text=No+Images" }];

  return `
    <section class="page">
      <div class="detail-hero">
        <div class="detail-title">
          <p class="eyebrow">${p.verified ? 'KYC verified' : 'Pending Verification'}</p>
          <h1>${p.title}</h1>
          <p>${p.address}, ${p.city} · ${p.totalRating} rating · ${p._count.reviews} reviews</p>
        </div>
        <div class="gallery">
          ${gallery.map((img, i) => `<img src="${img.url}" alt="${p.title} image ${i+1}">`).join("")}
        </div>
      </div>

      <div class="detail-layout">
        <div class="detail-main">
          <section>
            <h2 class="panel-title">Room types</h2>
            <div class="room-list">
              ${(p.rooms || []).map(r => room(r.name, `Rs ${r.pricePerMonth}`, `${r.sharingType.replace("_", " ")} · ${r.availableBeds} beds available`)).join("")}
            </div>
          </section>
          <section>
            <h2 class="panel-title">Amenities</h2>
            <div class="amenity-grid">
              ${p.wifiIncluded ? amenity("WiFi") : ""}
              ${p.foodIncluded ? amenity("Meals") : ""}
              ${p.acAvailable ? amenity("AC") : ""}
              ${p.laundryAvailable ? amenity("Laundry") : ""}
              ${p.cctvAvailable ? amenity("CCTV") : ""}
              ${p.powerBackup ? amenity("Power") : ""}
              ${p.parkingAvailable ? amenity("Parking") : ""}
            </div>
          </section>
          <section>
            <h2 class="panel-title">Reviews</h2>
            <div class="review-grid">
              ${(p.reviews || []).map(rev => review(rev.user.name, rev.comment)).join("")}
              ${!(p.reviews && p.reviews.length) ? '<p class="muted">No reviews yet for this property.</p>' : ''}
            </div>
          </section>
        </div>
        <div class="detail-side">
          <div class="booking-card">
            <h2 class="panel-title">Book a visit</h2>
            <p class="muted">Schedule a tour with the owner before booking.</p>
            <div class="price-row mt-3">
              <span>Starts from</span>
              <strong class="price">Rs ${p.priceStartingFrom}</strong>
            </div>
            <button class="gradient-button wide mt-3" onclick="location.hash='#booking/${p.id}'">Book Now</button>
            <button class="outline-button wide mt-2">Chat with Owner</button>
          </div>
        </div>
      </div>

      ${footer()}
    </section>
  `;
}

function room(title, price, text) {
  return `
    <article class="room-row">
      <div>
        <h3>${title}</h3>
        <p class="muted">${text}</p>
      </div>
      <div>
        <strong class="price">${price}</strong>
        <button class="outline-button small" type="button">Select</button>
      </div>
    </article>
  `;
}

function amenity(name) {
  return `<div class="amenity-chip"><span class="amenity-icon">✓</span>${name}</div>`;
}

function review(name, text) {
  return `<article class="review-card"><strong>★ ★ ★ ★ ★ ${name}</strong><p class="muted">${text}</p></article>`;
}

function renderOwner() {
  return `
    <section class="page">
      ${dashboardHero("Owner onboarding", onboardingStepTitle(onboardingStep))}
      <div class="dashboard-shell">
        <div class="stepper-wrap">
          <div class="stepper">
            <div class="step ${onboardingStep >= 1 ? "active" : ""}">1. Aadhaar</div>
            <div class="step ${onboardingStep >= 2 ? "active" : ""}">2. Selfie</div>
            <div class="step ${onboardingStep >= 3 ? "active" : ""}">3. Property</div>
            <div class="step ${onboardingStep >= 4 ? "active" : ""}">4. Proof</div>
          </div>
          <div class="stepper-line"><div class="stepper-fill" style="width: ${(onboardingStep - 1) * 33.33}%"></div></div>
        </div>

        <div class="dashboard-grid">
          <section class="dashboard-card main-onboarding">
            ${renderCurrentStep()}
          </section>
          
          <aside class="dashboard-card status-aside">
            <h2>Current Status</h2>
            <p class="muted">Complete all steps to list your property live.</p>
            <div class="step-status">
              <div class="${onboardingStep > 1 ? "done" : "active"}">Aadhaar Verification</div>
              <div class="${onboardingStep > 2 ? "done" : onboardingStep === 2 ? "active" : ""}">Owner Selfie</div>
              <div class="${onboardingStep > 3 ? "done" : onboardingStep === 3 ? "active" : ""}">Property Details</div>
              <div class="${onboardingStep > 4 ? "done" : onboardingStep === 4 ? "active" : ""}">Property Proof</div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  `;
}

function onboardingStepTitle(step) {
  switch (step) {
    case 1: return "Identity Verification: Let's verify your Aadhaar to build trust.";
    case 2: return "Security Check: Take a quick selfie for account safety.";
    case 3: return "Property Details: Tell us about your hostel and verify its location.";
    case 4: return "Final Documents: Upload proof of ownership or rental agreement.";
    default: return "Onboarding process in progress.";
  }
}

function renderCurrentStep() {
  switch (onboardingStep) {
    case 1:
      if (isAadhaarVerified) {
        return `
          <h2>Step 1: Identity Verified ✅</h2>
          <div class="verified-identity-card">
            <div class="vid-badge">VERIFIED VIA DIGILOCKER</div>
            <div class="vid-content">
              <div class="vid-photo">👤</div>
              <div class="vid-details">
                <div class="vid-name">${verifiedAadhaarData?.name || "Chhotu"}</div>
                <div class="vid-number">Aadhaar: XXXX XXXX 2615</div>
                <div class="vid-status">✅ KYC Digitally Signed</div>
              </div>
            </div>
            <p class="vid-footer">Automatically redirected from DigiLocker portal.</p>
          </div>
          <div class="step-nav wide">
            <button type="button" class="gradient-button" onclick="handleNextStep(2)">Proceed to Step 2</button>
          </div>
        `;
      }
      return `
      <h2>Step 1: Aadhaar Verification</h2>
      <p class="muted">Upload your Aadhaar card photos to verify your identity.</p>
      <div class="form-grid">
        <label class="form-control wide disabled-soon">
          Aadhaar Number <span class="badge-soon">Coming Soon</span>
          <input type="text" placeholder="1234 5678 9012" disabled>
        </label>
        
        <div class="kyc-actions wide">
          <button type="button" class="outline-button disabled-soon" id="verifyAadhaarOtpBtn">
            Verify via OTP <span class="badge-soon">Coming Soon</span>
          </button>
          <button type="button" class="outline-button disabled-soon" id="verifyDigiLockerBtn">
            Verify via DigiLocker <span class="badge-soon">Coming Soon</span>
          </button>
        </div>

        <div class="upload-section wide">
          <label class="form-control wide">
            <strong>Aadhaar Card Photo (Front & Back)</strong>
            <p class="small muted">Upload clear photos of both sides.</p>
            <input type="file" id="aadhaarFileUpload" multiple accept="image/*">
          </label>
        </div>

        <div class="step-nav wide">
          <button type="button" class="gradient-button disabled" id="aadhaarSaveNext" onclick="handleNextStep(2)">Save & Next</button>
        </div>
      </div>
    `;
    case 2:
      if (!currentCaptchaStr) generateCaptcha();
      return `
      <h2>Step 2: Owner Selfie</h2>
      <p class="muted">Smile! Provide a clear selfie for verification.</p>
      <div class="selfie-wrap">
        <div class="camera-placeholder" id="cameraWrapper">
          <video id="selfieVideo" autoplay playsinline class="hidden"></video>
          <canvas id="selfieCanvas" class="hidden"></canvas>
          <div id="selfiePlaceholder" class="camera-placeholder-inner">
            <div class="camera-overlay"></div>
            <span class="icon">📸</span>
          </div>
        </div>
        <div class="selfie-actions">
          <button type="button" class="gradient-button" id="startCameraBtn">Capture Live</button>
          <button type="button" class="gradient-button hidden" id="takeSnapshotBtn">Take Snapshot</button>
          <label class="outline-button" id="selfieUploadLabel">
            Upload Photo
            <input type="file" id="selfieFileInput" class="hidden" accept="image/*">
          </label>
          <button type="button" class="outline-button hidden" id="retakeBtn">Retake</button>
        </div>
      </div>
      <div class="captcha-stack">
        <div class="captcha-box">
          <span class="captcha-text">${currentCaptchaStr}</span>
          <button type="button" class="refresh-captcha" onclick="generateCaptcha(); render();">🔄</button>
        </div>
        ${input("Enter Security Code Above", "e.g. H7K2P", "wide", "captchaInput")}
      </div>
      <div class="step-nav wide">
        <button type="button" class="outline-button" onclick="handlePrevStep(1)">Back</button>
        <button type="button" class="gradient-button disabled" id="selfieSaveNext" onclick="handleNextStep(3)">Save & Next</button>
      </div>
    `;
    case 3: return `
      <h2>Step 3: Add Property Details</h2>
      <div id="propertyForm" class="form-grid">
        ${input("Property name", "Sunrise PG", "", "propertyTitle")}
        ${input("Street Address", "e.g. 123 Main St, Near Metro", "wide", "streetAddress")}
        ${input("City", "Bengaluru", "", "city")}
        ${input("State", "Karnataka", "", "state")}
        ${input("Pincode", "560001", "", "pincode")}
        
        <div class="verification-row wide">
          <div class="verify-controls">
            <button type="button" class="outline-button" id="verifyMapBtn">
              <span class="btn-text">Verify on Maps</span>
              <span class="btn-loader hidden">⏳</span>
            </button>
            <div id="verifyStatus" class="verify-status ${isLocationVerified ? "verified" : "pending"}">
              ${isLocationVerified ? "✅ Location Verified" : "🛑 Pending Verification"}
            </div>
          </div>
          <div id="locationResults" class="location-results-box hidden"></div>
        </div>

        ${renderPricingOptions()}
        ${input("Amenities", "WiFi, food, AC, laundry", "wide", "amenities")}
        <label class="form-control wide">Description<textarea oninput="handleOnboardingInput('description', this.value)">${onboardingData.description || "Peaceful stay near metro with daily meals."}</textarea></label>
        <label class="form-control wide">Images<input type="file" id="propertyImagesFileUpload" multiple accept="image/*"></label>
        <div id="imagePreviewContainer" class="image-preview-grid wide"></div>
        <div class="step-nav wide">
          <button type="button" class="outline-button" onclick="handlePrevStep(2)">Back</button>
          <button type="button" id="propertySaveNext" class="gradient-button ${!isLocationVerified || !isPropertyImagesUploaded ? "disabled" : ""}" onclick="handleNextStep(4)">Save & Next</button>
        </div>
      </div>
    `;
    case 4: return `
      <h2>Step 4: Property Proof</h2>
      <p class="muted">Almost there! Upload documents to verify your property.</p>
      <div class="form-grid">
        <label class="form-control wide">Hostel/Rent Receipt (Current Month)<input type="file"></label>
        <label class="form-control wide">Ownership Proof / Rental Agreement<input type="file"></label>
        <label class="form-control wide">Hostel Poster or 2-4 Interior/Exterior Photos<input type="file" multiple></label>
        <div class="step-nav wide">
          <button type="button" class="outline-button" onclick="handlePrevStep(3)">Back</button>
          <button type="button" class="gradient-button" onclick="handleFinishOnboarding()">Finish & List Property</button>
        </div>
      </div>
    `;
    default: return "";
  }
}

function dashboardHero(title, text) {
  return `
    <div class="dashboard-hero">
      <div class="dashboard-hero-inner">
        <p class="eyebrow">HostelDekho</p>
        <h1>${title}</h1>
        <p>${text}</p>
      </div>
    </div>
  `;
}

function input(label, placeholder, className = "", id = "") {
  const val = onboardingData[id] || "";
  return `
    <label class="form-control ${className}">
      ${label}
      <input type="text" placeholder="${placeholder}" ${id ? `id="${id}"` : ""} value="${val}" oninput="handleOnboardingInput('${id}', this.value)">
    </label>
  `;
}

function kycStep(number, title, text) {
  return `<div class="kyc-step"><span class="step-dot">${number}</span><div><strong>${title}</strong><p class="muted">${text}</p></div></div>`;
}

function managed(title, text, image) {
  return `
    <div class="managed-row">
      <img src="${image}" alt="${title}">
      <div><strong>${title}</strong><p class="muted">${text}</p></div>
      <div class="utility-row"><button class="outline-button small" type="button">Edit</button><button class="ghost-button small" type="button">Delete</button></div>
    </div>
  `;
}

function renderUser() {
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : { name: "Guest User", email: "guest@example.com", mobile: "+91 00000 00000", address: "Not provided" };
  const avatar = user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1769ff&color=fff`;

  if (userDashboardData.loading) {
    return `<section class="page profile-page"><div class="loading-state"><div class="loader"></div><p>Syncing your activity...</p></div></section>`;
  }

  const isOwner = user.role === 'OWNER' || user.role === 'ADMIN';
  
  // Initial load of dashboard data if properties is empty and we're on the history tab
  if (isOwner && activeProfileTab === 'history' && !userDashboardData.fetched && !userDashboardData.loading) {
    setTimeout(loadUserDashboardData, 100);
  }

  return `
    <section class="page profile-page">
      <div class="profile-hero">
        <div class="profile-hero-inner">
          <div class="profile-header-main">
            <div class="profile-avatar-large" id="profileAvatarBig" title="Click to change photo">
              <img src="${avatar}" alt="${user.name}">
              <div class="avatar-edit-overlay"><span>Edit Photo</span></div>
              <input type="file" id="profilePhotoInput" class="hidden" accept="image/*">
            </div>
            <div class="profile-title-area">
              <h1>${user.name}</h1>
              <div class="verification-pill"><span class="pill-icon">✓</span> ${isOwner ? 'Verified Partner' : 'Verified Resident'}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="dashboard-shell">
        <div class="dashboard-grid no-gap">
          <aside class="dashboard-card profile-sidebar">
            <div class="sidebar-item ${activeProfileTab === 'overview' ? 'active' : ''}" data-tab="overview">Account Overview</div>
            <div class="sidebar-item ${activeProfileTab === 'bookings' ? 'active' : ''}" data-tab="bookings">My Bookings</div>
            <div class="sidebar-item ${activeProfileTab === 'status' ? 'active' : ''}" data-tab="status">Verification Status</div>
            <div class="sidebar-item danger ${activeProfileTab === 'security' ? 'active' : ''}" data-tab="security">Privacy & Security</div>
            ${isOwner ? `<div class="sidebar-item ${activeProfileTab === 'history' ? 'active' : ''}" data-tab="history">Property History</div>` : ''}
          </aside>

          <section class="profile-content-area">
            ${renderActiveProfileTab(user)}
          </section>
        </div>
      </div>
    </section>
  `;
}

function renderActiveProfileTab(user) {
  switch (activeProfileTab) {
    case "history":
      return `
        <div class="dashboard-card flat-card wide-card">
          <div class="card-header-flex">
            <h2>Property History</h2>
            <p class="muted">History of properties you've listed on HostelDekho.</p>
          </div>
          <div class="activity-stack">
            ${userDashboardData.properties.length ? 
              userDashboardData.properties.map(p => listingHistory(p)).join("") : 
              '<p class="empty-small">No properties listed yet.</p>'
            }
          </div>
        </div>
      `;
    case "bookings":
       return `
        <div class="dashboard-card flat-card wide-card">
          <div class="card-header-flex">
            <h2>My Bookings</h2>
            <p class="muted">Detailed history of your stay bookings.</p>
          </div>
          <div class="activity-stack">
            ${userDashboardData.bookings.length ? 
              userDashboardData.bookings.map(b => history(b)).join("") : 
              '<p class="empty-small">No bookings found.</p>'
            }
          </div>
        </div>
      `;
    default: // overview
      return `
        <div class="dashboard-card flat-card">
          <div class="card-header-flex">
            <h2>Profile Settings</h2>
            <span class="last-updated">Last updated: Today</span>
          </div>
          <form class="profile-form-enhanced" id="userProfileForm">
            <div class="form-row">
              ${input("Full Name", user.name, "", "edit_name")}
              ${input("Email Address", user.email, "", "edit_email")}
            </div>
            <div class="form-row">
              ${input("Mobile Number", user.mobile, "", "edit_mobile")}
              ${input("Street Address", user.address || "123 Main St, Bengaluru", "wide", "edit_address")}
            </div>
            <div class="form-actions">
              <button class="gradient-button" type="submit" id="saveProfileBtn">Save Profile Changes</button>
            </div>
          </form>
        </div>

        <div class="dashboard-card flat-card wide-card">
          <div class="card-header-flex">
            <h2>Recent Activity</h2>
            <a href="#search" class="blue-link">Search Stays</a>
          </div>
          <div class="activity-stack">
            ${userDashboardData.bookings.length ? 
              userDashboardData.bookings.map(b => history(b)).join("") : 
              '<p class="empty-small">No recent bookings found.</p>'
            }
          </div>
        </div>

        ${user.role === 'OWNER' || user.role === 'ADMIN' ? `
        <div class="dashboard-card flat-card wide-card">
          <div class="card-header-flex">
            <h2>Your Properties</h2>
            <a href="#owner" class="blue-link">List New</a>
          </div>
          <div class="activity-stack">
            ${userDashboardData.properties.length ? 
              userDashboardData.properties.map(p => listingHistory(p)).join("") : 
              '<p class="empty-small">No properties found. <a href="#owner">Add one now!</a></p>'
            }
          </div>
        </div>
        ` : ''}
      `;
  }
}

async function fetchUserDashboardData() {
  if (userDashboardData.loading || userDashboardData.fetched) return;
  const token = localStorage.getItem("token");
  if (!token) return;

  userDashboardData.loading = true;
  render();

  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isOwnerOrAdmin = user.role === 'OWNER' || user.role === 'ADMIN';

    const [bookingsRes, propertiesRes] = await Promise.all([
      fetchAPI("/users/me/bookings").catch(() => ({ data: [] })),
      isOwnerOrAdmin ? fetchAPI("/owner/properties").catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    ]);

    userDashboardData.bookings = bookingsRes.data || [];
    userDashboardData.properties = propertiesRes.data || [];
    userDashboardData.fetched = true;
  } catch (err) {
    console.error("Failed to fetch dashboard data:", err);
    userDashboardData.fetched = true;
  } finally {
    userDashboardData.loading = false;
    render();
  }
}


function history(booking) {
  const property = booking.property || {};
  const imageUrl = property.images && property.images.length > 0 ? property.images[0].url : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80';
  return `
    <div class="history-row">
      <div class="row-media">
        <img src="${imageUrl}" alt="${property.title}">
      </div>
      <div class="row-info">
        <div class="info-top">
          <strong>${property.title}</strong>
          <span class="status-badge ${booking.status.toLowerCase()}">${booking.status}</span>
        </div>
        <p class="microcopy">${booking.room?.name || 'Standard Room'} · ${new Date(booking.createdAt).toLocaleDateString()}</p>
        <div class="row-actions">
          <button class="ghost-button small">Receipt</button>
          <button class="outline-button small">Chat</button>
        </div>
      </div>
    </div>
  `;
}

function renderBooking() {
  return `
    <section class="page">
      <div class="booking-hero">
        <div class="booking-hero-inner">
          <p class="eyebrow">Secure booking</p>
          <h1>Confirm your new stay</h1>
          <p>Select room, choose dates, pay securely, and receive instant confirmation.</p>
        </div>
      </div>
      <div class="booking-shell">
        <div class="booking-grid">
          <section class="booking-card">
            <div class="booking-step"><span class="step-dot">1</span><h2>Select room</h2></div>
            ${room("Triple sharing", "Rs 9,500", "1 bed available")}
            ${room("Double sharing", "Rs 12,500", "2 beds available")}
          </section>
          <section class="booking-card">
            <div class="booking-step"><span class="step-dot">2</span><h2>Dates and payment</h2></div>
            <form class="form-grid">
              ${input("Move-in date", "24 Apr 2026")}
              ${input("Stay duration", "6 months")}
            </form>
            <div class="payment-card">
              <span>HostelDekho Secure Pay</span>
              <strong>Rs 19,000 due today</strong>
              <span>First month plus refundable deposit</span>
            </div>
            <button class="gradient-button" type="button">Pay and confirm</button>
          </section>
          <section class="success-card">
            <span class="success-mark">✓</span>
            <h2>Booking confirmed</h2>
            <p class="muted">Your receipt and owner chat are ready.</p>
            <a class="outline-button" href="#user">Go to dashboard</a>
          </section>
        </div>
      </div>
    </section>
  `;
}

function footer() {
  return `
    <footer class="footer">
      <div class="footer-inner">
        <div>
          <div class="brand"><span class="brand-mark">HD</span><span>HostelDekho</span></div>
          <p>Verified hostels, PGs, and rental rooms for students and professionals.</p>
        </div>
        <div><strong>Explore</strong><a href="#search">Search stays</a><a href="#detail">Verified homes</a><a href="#booking">Bookings</a></div>
        <div><strong>Owners</strong><a href="#owner">List property</a><a href="#owner">KYC</a><a href="#owner">Bookings</a></div>
        <div><strong>Support</strong><a href="#">Help center</a><a href="#">Safety</a><a href="#">Terms</a></div>
      </div>
    </footer>
  `;
}

function render() {
  const hash = location.hash || "#home";
  
  // Handle Admin Sub-routes
  if (hash.startsWith("#admin")) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role !== 'ADMIN') {
      alert("🛑 Access Denied: Exclusive Admin privileges required.");
      location.hash = "#home";
      return;
    }
    const parts = hash.split("/");
    adminSubRoute = parts[1] || "overview";
    document.getElementById("app").innerHTML = renderAdmin();
    loadAdminData();
    bindPageEvents();
    return;
  }

  const parts = hash.split("/");
  const route = parts[0].replace("#", "");
  const routeParam = parts[1];

  // Specific Data Loading per route
  if (route === "home" && !homeFetched && !homeFetching) {
    loadHomeData();
  } else if (route === "search") {
    const hasSearchChanged = lastSearchQuery !== currentSearchQuery || lastSelectedType !== selectedType;
    if ((!searchFetched || hasSearchChanged) && !searchFetching) {
      lastSearchQuery = currentSearchQuery;
      lastSelectedType = selectedType;
      searchFetched = false;
      loadSearchData();
    }
  } else if (route === "detail" && routeParam) {
    if (!currentProperty || (currentProperty.id !== routeParam && currentProperty.slug !== routeParam)) {
       if (!viewDataLoading) loadPropertyDetail(routeParam);
    }
  }

  const renderer = routes[route] || routes.home;

  // Trigger User dashboard data fetch if on profile page
  if (route === "user" && !userDashboardData.loading && !userDashboardData.fetched) {
    fetchUserDashboardData();
  }

  document.getElementById("app").innerHTML = renderer(routeParam);
  bindPageEvents();
  window.scrollTo({ top: 0, behavior: "auto" });
}

async function loadAdminData() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const headers = { 'Authorization': `Bearer ${token}` };
  
  try {
    if (adminSubRoute === "overview") {
      const res = await fetchAPI('/admin/stats');
      adminData.stats = res.data;
    } else if (adminSubRoute === "pending") {
      const res = await fetchAPI('/admin/properties/pending');
      adminData.pending = res.data;
    } else if (adminSubRoute === "verified") {
      const res = await fetchAPI('/admin/properties?status=ACTIVE');
      adminData.verified = res.data;
    } else if (adminSubRoute === "users") {
      const res = await fetchAPI('/admin/users');
      adminData.users = res.data;
    } else if (adminSubRoute === "kyc") {
      const res = await fetchAPI('/admin/kyc/pending');
      adminData.kyc = res.data;
    } else if (adminSubRoute === "settings") {
      const res = await fetchAPI('/admin/settings');
      adminData.settings = res.data;
    }
    updateAdminContent();
  } catch (err) {
    console.error("Admin Load Error:", err);
  }
}

function renderAdmin() {
  return `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="sidebar-brand">
          <span class="brand-mark">HD</span>
          <span class="brand-name">HostelDekho</span>
        </div>
        <nav class="sidebar-nav">
          ${adminNavLink("Overview", "overview", "📊")}
          ${adminNavLink("Pending Properties", "pending", "🔥")}
          ${adminNavLink("Verified Stays", "verified", "✅")}
          ${adminNavLink("User Management", "users", "👥")}
          ${adminNavLink("KYC Queue", "kyc", "🛡️")}
          ${adminNavLink("Settings", "settings", "⚙️")}
        </nav>
        <div class="sidebar-footer">
          <button class="logout-link" onclick="handleLogout()">Logout</button>
        </div>
      </aside>
      <main class="admin-main">
        <header class="admin-navbar">
          <div class="search-bar">
            <input type="text" placeholder="Search properties, owners, users...">
          </div>
          <div class="navbar-actions">
            <span class="notif-bell">🔔</span>
            <div class="admin-profile">
              <img src="https://ui-avatars.com/api/?name=Admin&background=1769ff&color=fff" alt="Admin">
              <span>Admin Panel</span>
            </div>
          </div>
        </header>
        <div id="admin-content" class="admin-view-body">
          ${adminSkeleton()}
        </div>
      </main>
    </div>
  `;
}

function adminNavLink(label, id, emoji) {
  const isActive = adminSubRoute === id;
  return `
    <a href="#admin/${id}" class="nav-item ${isActive ? "active" : ""}">
      <span class="icon">${emoji}</span>
      <span class="label">${label}</span>
    </a>
  `;
}

function adminSkeleton() {
  return `
    <div class="skeleton-grid">
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card wide"></div>
    </div>
  `;
}

function updateAdminContent() {
  const container = document.getElementById("admin-content");
  if (!container) return;

  switch (adminSubRoute) {
    case "overview": container.innerHTML = renderAdminOverview(); break;
    case "pending": container.innerHTML = renderAdminPending(); break;
    case "verified": container.innerHTML = renderAdminVerified(); break;
    case "users": container.innerHTML = renderAdminUsers(); break;
    case "kyc": container.innerHTML = renderAdminKyc(); break;
    case "settings": container.innerHTML = renderAdminSettings(); break;
    default: container.innerHTML = "<h2>Module under construction...</h2>";
  }
  bindAdminActions();
}

function renderAdminOverview() {
  const s = adminData.stats || { totalUsers: 0, activeProperties: 0, confirmedBookings: 0, totalRevenue: 0 };
  const totalRevenue = Number(s.totalRevenue || 0);
  return `
    <h1 class="view-title">Dashboard Overview</h1>
    <div class="stat-grid">
      ${statCard("Total Users", s.totalUsers || 0, "👥")}
      ${statCard("Active Stays", s.activeProperties || 0, "🏠")}
      ${statCard("Confirmed Bookings", s.confirmedBookings || 0, "📅")}
      ${statCard("Gross Revenue", `₹${totalRevenue.toLocaleString()}`, "💰")}
    </div>
    <div class="overview-row mt-4">
      <div class="revenue-chart-placeholder">
        <h3>Booking Activity</h3>
        <p class="muted">No booking activity yet.</p>
      </div>
      <div class="activity-feed">
        <h3>Recent Audit Log</h3>
        <ul class="activity-list">
          ${s.recentActivity?.length ? s.recentActivity.map(a => `
            <li>
              <strong>${a.admin?.name || 'Admin'}:</strong> ${a.details} 
              <span class="microcopy">${new Date(a.createdAt).toLocaleTimeString()}</span>
            </li>
          `).join("") : '<li>No recent activity logged.</li>'}
        </ul>
      </div>
    </div>
  `;
}

function statCard(label, val, icon, trend) {
  return `
    <div class="admin-stat-card">
      <div class="card-head">
        <span class="card-icon">${icon}</span>
        ${trend ? `<span class="trend positive">${trend}</span>` : ""}
      </div>
      <div class="card-body">
        <span class="stat-val">${val}</span>
        <span class="stat-label">${label}</span>
      </div>
    </div>
  `;
}

function renderAdminPending() {
  const list = adminData.pending || [];
  return `
    <div class="view-header">
      <h1 class="view-title">Pending Moderation (${list.length})</h1>
      <button class="gradient-button small" id="bulkApprove">Bulk Approve</button>
    </div>
    <div class="admin-data-table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Owner</th>
            <th>Type</th>
            <th>Price</th>
            <th>Submission Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.length ? list.map(p => `
            <tr>
              <td>
                <div class="property-cell">
                  <img src="${p.images[0]?.url || 'https://via.placeholder.com/40'}" class="thumb">
                  <span>${p.title}</span>
                </div>
              </td>
              <td>${p.owner?.name || 'N/A'}</td>
              <td><span class="badge blue">${p.type}</span></td>
              <td>₹${p.priceStartingFrom}</td>
              <td>${new Date(p.createdAt).toLocaleDateString()}</td>
              <td class="action-cell">
                <button class="action-btn approve" onclick="handlePropertyReview('${p.id}', 'approve')">✅</button>
                <button class="action-btn reject" onclick="handlePropertyReview('${p.id}', 'reject')">❌</button>
                <button class="action-btn view" onclick="viewAdminProperty('${p.id}')">👁</button>
              </td>
            </tr>
          `).join("") : '<tr><td colspan="6" class="empty">No pending listings found.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}

function renderAdminUsers() {
  const users = adminData.users || [];
  return `
    <h1 class="view-title">User Management</h1>
    <div class="admin-data-table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Mobile</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Admin Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td>
                <div class="user-cell">
                  <span>${u.name}</span>
                  <span class="muted-small">${u.email || ''}</span>
                </div>
              </td>
              <td>${u.mobile}</td>
              <td><span class="badge ${u.role === 'ADMIN' ? 'gold' : 'blue'}">${u.role}</span></td>
              <td><span class="status-dot ${u.isActive ? 'active' : 'inactive'}"></span> ${u.isActive ? 'Active' : 'Blocked'}</td>
              <td>${new Date(u.createdAt).toLocaleDateString()}</td>
              <td>
                <button class="outline-button small" onclick="handleToggleUser('${u.id}')">
                  ${u.isActive ? 'Block' : 'Unblock'}
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function handlePropertyReview(id, action) {
  const token = localStorage.getItem("token");
  const method = action === 'approve' ? 'approve' : 'reject';
  
  try {
    const res = await fetchAPI(`/admin/properties/${id}/${method}`, {
      method: 'PATCH'
    });
    if (res.success) {
      alert(`Property ${action}d successfully. Review logged & Email sent to owner.`);
      closeAdminModal();
      render(); // Refresh the list
    }
  } catch (err) {
    alert("Moderation action failed. Check console for logs.");
  }
}

window.viewAdminProperty = async function(id) {
  const modal = document.getElementById("adminDetailModal");
  const content = document.getElementById("adminModalContent");
  
  content.innerHTML = `<div class="loading-state"><div class="loader"></div><p>Fetching property details...</p></div>`;
  modal.classList.add("open");

  try {
    const res = await fetchAPI(`/properties/${id}`);
    const p = res.data;
    const kyc = p.owner?.kycDocuments?.[0] || {};

    content.innerHTML = `
      <h2>${p.title}</h2>
      <div class="admin-detail-grid">
        <div class="admin-detail-images">
          <p class="label" style="grid-column: span 2; color: var(--muted); font-size: 13px; text-transform: uppercase;">Property Images</p>
          ${p.images.map(img => `<img src="${img.url}" alt="Property image">`).join("")}
          ${p.images.length === 0 ? '<p class="muted" style="grid-column: span 2">No property images uploaded</p>' : ''}
          
          <p class="label mt-3" style="grid-column: span 2; color: var(--muted); font-size: 13px; text-transform: uppercase;">Verification Documents (KYC)</p>
          <div class="admin-detail-images" style="grid-column: span 2; margin-top: 0; border: 1px dashed var(--line); padding: 10px; border-radius: 8px;">
            <div style="text-align: center">
              <p class="muted" style="font-size: 11px; margin-bottom: 5px;">Aadhaar/Selfie Proof</p>
              ${kyc.selfieUrl ? `<img src="${kyc.selfieUrl}" alt="Selfie Proof" style="width: 100%; border: 1px solid var(--line)">` : '<p class="muted">Not Uploaded</p>'}
            </div>
            <div style="text-align: center">
              <p class="muted" style="font-size: 11px; margin-bottom: 5px;">Property Ownership Proof</p>
              ${kyc.propertyProofUrl ? `<img src="${kyc.propertyProofUrl}" alt="Property Proof" style="width: 100%; border: 1px solid var(--line)">` : '<p class="muted">Not Uploaded</p>'}
            </div>
          </div>
        </div>
        <div class="admin-detail-info">
          <div class="item"><span class="label">Owner:</span> <span>${p.owner?.name || 'N/A'}</span></div>
          <div class="item"><span class="label">Type:</span> <span class="badge blue">${p.type}</span></div>
          <div class="item"><span class="label">Price:</span> <span>₹${p.priceStartingFrom}</span></div>
          <div class="item"><span class="label">Address:</span> <span>${p.address}, ${p.city}</span></div>
          <div class="item"><span class="label">Rules:</span> <span>${p.rules || 'No rules specified'}</span></div>
          <div class="item"><span class="label">Description:</span> <p>${p.description || 'No description'}</p></div>
        </div>
      </div>
      <div class="admin-modal-actions">
        <button class="gradient-button small" style="background: var(--green)" onclick="handlePropertyReview('${p.id}', 'approve')">Approve Property</button>
        <button class="outline-button small" style="color: var(--danger); border-color: var(--danger)" onclick="handlePropertyReview('${p.id}', 'reject')">Reject Property</button>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<p class="error">Failed to load property details. ${err.message}</p>`;
  }
}

window.closeAdminModal = function() {
  document.getElementById("adminDetailModal").classList.remove("open");
}

async function handleToggleUser(id, action) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetchAPI(`/admin/users/${id}/${action}`, {
      method: 'PATCH'
    });
    if (res.success) {
      loadAdminData();
    }
  } catch (err) {
    alert("User action failed.");
  }
}

function renderAdminVerified() {
  const stays = adminData.verified || [];
  return `
    <h1 class="view-title">Verified Stays & Active Listings</h1>
    <div class="admin-data-table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Owner</th>
            <th>Type</th>
            <th>Featured</th>
            <th>Status</th>
            <th>Management</th>
          </tr>
        </thead>
        <tbody>
          ${stays.map(s => `
            <tr>
              <td><div class="property-cell"><img src="${s.images[0]?.url || ''}" class="thumb"><span>${s.title}</span></div></td>
              <td>${s.owner?.name}</td>
              <td><span class="badge blue">${s.type}</span></td>
              <td><input type="checkbox" ${s.isFeatured ? 'checked' : ''} onclick="handleToggleProp('${s.id}', 'toggle-feature')"></td>
              <td><span class="status-dot active"></span> Active</td>
              <td>
                <button class="outline-button small" onclick="handleToggleProp('${s.id}', 'toggle-status')">Disable</button>
                <button class="outline-button small" onclick="window.open('/#detail/${s.id}', '_blank')">View</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderAdminKyc() {
  const queue = adminData.kyc || [];
  return `
    <h1 class="view-title">KYC Verification Queue</h1>
    <div class="kyc-grid-scroller">
      ${queue.length ? queue.map(k => `
        <div class="kyc-card">
          <div class="kyc-head">
            <strong>${k.owner?.name}</strong>
            <span class="badge blue">${k.status}</span>
          </div>
          <div class="kyc-proofs">
            <div class="proof-item"><p class="microcopy">Aadhaar (Masked)</p><div class="file-preview">${k.aadhaarMasked || 'N/A'}</div></div>
            <div class="proof-item"><p class="microcopy">Live Selfie</p><img src="${k.selfieUrl || ''}" class="img-preview"></div>
          </div>
          <div class="kyc-actions">
            <button class="gradient-button small" onclick="handleKycReview('${k.id}', 'approve')">Approve</button>
            <button class="outline-button small" onclick="handleKycReview('${k.id}', 'reject')">Reject</button>
          </div>
        </div>
      `).join("") : '<div class="empty">No pending KYC verifications.</div>'}
    </div>
  `;
}

function renderAdminSettings() {
  const configs = adminData.settings || [];
  return `
    <h1 class="view-title">Platform Configuration</h1>
    <div class="settings-grid">
      <div class="settings-card card">
        <h3>Global Settings</h3>
        <p class="muted">Warning: Changes here impact the entire platform including revenue calculations.</p>
        <div class="config-table-wrap">
          ${configs.map(c => `
            <div class="config-row">
              <label>${c.label || c.key}</label>
              <div class="config-input-wrap">
                <input type="text" value="${c.value}" id="config_${c.key}">
                <button class="action-btn" onclick="handleUpdateConfig('${c.key}')">Save</button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="settings-card card">
        <h3>Admin Account</h3>
        <p class="muted">Exclusive Admin: chhotu415@gmail.com</p>
        <button class="outline-button" disabled>Change Master Credentials</button>
      </div>
    </div>
  `;
}

async function handleToggleProp(id, action) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetchAPI(`/admin/properties/${id}/${action}`, {
      method: 'PATCH'
    });
    if (res.success) loadAdminData();
  } catch (err) { alert("Action failed."); }
}

async function handleKycReview(id, action) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetchAPI(`/admin/kyc/${id}/${action}`, {
      method: 'PATCH'
    });
    if (res.success) {
      alert(`KYC ${action}d successfully.`);
      loadAdminData();
    }
  } catch (err) { alert("KYC review failed."); }
}

async function handleUpdateConfig(key) {
  const token = localStorage.getItem("token");
  const value = document.getElementById(`config_${key}`).value;
  try {
    const res = await fetchAPI(`/admin/settings`, {
      method: 'PATCH',
      body: JSON.stringify({ key, value })
    });
    if (res.success) alert("Configuration updated.");
  } catch (err) { alert("Failed to update config."); }
}

function bindAdminActions() {
  const bulkBtn = document.getElementById("bulkApprove");
  if (bulkBtn) bulkBtn.onclick = () => alert("Bulk approval triggered for current page.");
}

function bindPageEvents() {
  document.querySelectorAll(".heart").forEach((button) => {
    button.addEventListener("click", () => button.classList.toggle("saved"));
  });
  document.querySelectorAll("[data-open-auth]").forEach((button) => {
    button.addEventListener("click", openAuth);
  });
  const googleBtn = document.querySelector(".oauth-button");
  if (googleBtn) {
    googleBtn.addEventListener("click", handleGoogleLogin);
  }

  const sendOtpBtn = document.querySelector(".otp-row .gradient-button");
  if (sendOtpBtn) {
    sendOtpBtn.addEventListener("click", handleSendOtp);
  }

  const mapSearch = document.getElementById("mapSearchInput");
  if (mapSearch) {
    mapSearch.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        currentSearchQuery = e.target.value;
        render();
      }
    });
  }

  const clearSearch = document.getElementById("clearMapSearch");
  if (clearSearch) {
    clearSearch.addEventListener("click", () => {
      currentSearchQuery = "";
      render();
    });
  }

  const verifyBtn = document.getElementById("verifyMapBtn");
  if (verifyBtn) {
    verifyBtn.addEventListener("click", handleVerifyOnMaps);
  }

  const saveBtn = document.getElementById("savePropertyBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", handlePropertySave);
  }

  const verifyAadhaarBtn = document.getElementById("verifyAadhaarOtpBtn");
  if (verifyAadhaarBtn) {
    verifyAadhaarBtn.addEventListener("click", () => {
      document.getElementById("aadhaarOtpRow").classList.remove("hidden");
      alert("Mock: OTP sent to your registered Aadhaar mobile number.");
    });
  }

  const aadhaarUpload = document.getElementById("aadhaarFileUpload");
  if (aadhaarUpload) {
    aadhaarUpload.addEventListener("change", (e) => {
      const btn = document.getElementById("aadhaarSaveNext");
      if (e.target.files.length >= 1) {
        btn.classList.remove("disabled");
        btn.innerHTML = "Save & Next ✅";
      } else {
        btn.classList.add("disabled");
        btn.innerHTML = "Save & Next";
      }
    });
  }

  const propertyImagesUpload = document.getElementById("propertyImagesFileUpload");
  if (propertyImagesUpload) {
    propertyImagesUpload.addEventListener("change", (e) => {
      const files = Array.from(e.target.files);
      const container = document.getElementById("imagePreviewContainer");
      if (container) {
        container.innerHTML = "";
        files.forEach((file) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const thumb = document.createElement("div");
            thumb.className = "preview-thumb";
            thumb.innerHTML = `<img src="${ev.target.result}" alt="Property Preview">`;
            container.appendChild(thumb);
          };
          reader.readAsDataURL(file);
        });
      }
      isPropertyImagesUploaded = files.length >= 1;
      onboardingFiles = files;
      checkStep3Validation();
    });
  }

  const selfieUpload = document.getElementById("selfieFileInput");
  if (selfieUpload) {
    selfieUpload.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        isSelfieCaptured = true;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const placeholder = document.getElementById("selfiePlaceholder");
          if (placeholder) placeholder.innerHTML = `<img src="${ev.target.result}" class="captured-img">`;
        };
        reader.readAsDataURL(e.target.files[0]);
        checkStep2Validation();
      }
    });
  }

  const startCameraBtn = document.getElementById("startCameraBtn");
  if (startCameraBtn) {
    startCameraBtn.addEventListener("click", handleStartCamera);
  }

  const takeSnapshotBtn = document.getElementById("takeSnapshotBtn");
  if (takeSnapshotBtn) {
    takeSnapshotBtn.addEventListener("click", handleTakeSnapshot);
  }

  const retakeBtn = document.getElementById("retakeBtn");
  if (retakeBtn) {
    retakeBtn.addEventListener("click", () => {
      isSelfieCaptured = false;
      render();
    });
  }

  const captchaInput = document.getElementById("captchaInput");
  if (captchaInput) {
    captchaInput.addEventListener("input", checkStep2Validation);
  }

  const confirmAadhaarBtn = document.getElementById("confirmAadhaarBtn");
  if (confirmAadhaarBtn) {
    confirmAadhaarBtn.addEventListener("click", () => {
      alert("Mock: Aadhaar Verified Successfully!");
      document.getElementById("aadhaarOtpRow").classList.add("hidden");
    });
  }

  // Type Filter Chip Events
  document.querySelectorAll(".type-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      selectedType = chip.getAttribute("data-type");
      console.log("Selected type:", selectedType);
      render();
    });
  });

  // Profile Page Events
  const profileForm = document.getElementById("userProfileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", (e) => handleProfileUpdate(e));
  }

  const profileAvatarBig = document.getElementById("profileAvatarBig");
  const photoInput = document.getElementById("profilePhotoInput");
  if (profileAvatarBig && photoInput) {
    profileAvatarBig.addEventListener("click", () => photoInput.click());
  }

  // Sidebar Tab Switching
  document.querySelectorAll(".sidebar-item").forEach(item => {
    item.addEventListener("click", () => {
      const tab = item.getAttribute("data-tab");
      if (tab) {
        activeProfileTab = tab;
        render();
      }
    });
  });

  // Search Filter Sliders
  const priceSlider = document.getElementById("priceSlider");
  if (priceSlider) {
    priceSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value).toLocaleString();
      document.getElementById("priceVal").textContent = `Rs ${val}`;
    });
  }

  const distanceSlider = document.getElementById("distanceSlider");
  if (distanceSlider) {
    distanceSlider.addEventListener("input", (e) => {
      document.getElementById("distanceVal").textContent = `${e.target.value} km`;
    });
  }

  // Multi-type Pricing Events
  ["flat", "boys", "girls", "night"].forEach(type => {
    const checkbox = document.getElementById(`type_${type}`);
    if (checkbox) {
      checkbox.addEventListener("change", (e) => {
        selectedPropertyTypes[type].selected = e.target.checked;
        render();
      });
    }

    const priceInput = document.getElementById(`price_${type}`);
    if (priceInput) {
      priceInput.addEventListener("input", (e) => {
        selectedPropertyTypes[type].price = e.target.value;
        checkStep3Validation();
      });
    }
  });
}

function generateCaptcha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  currentCaptchaStr = "";
  for (let i = 0; i < 5; i++) {
    currentCaptchaStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
}

async function handleStartCamera() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.getElementById("selfieVideo");
    video.srcObject = localStream;
    video.classList.remove("hidden");
    document.getElementById("selfiePlaceholder").classList.add("hidden");
    document.getElementById("startCameraBtn").classList.add("hidden");
    document.getElementById("selfieUploadLabel").classList.add("hidden");
    document.getElementById("takeSnapshotBtn").classList.remove("hidden");
  } catch (err) {
    alert("Camera access denied. Please upload a photo instead.");
    console.error(err);
  }
}

function handleTakeSnapshot() {
  const video = document.getElementById("selfieVideo");
  const canvas = document.getElementById("selfieCanvas");
  const context = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Stop camera
  localStream.getTracks().forEach(track => track.stop());

  video.classList.add("hidden");
  canvas.classList.remove("hidden");
  document.getElementById("takeSnapshotBtn").classList.add("hidden");
  document.getElementById("retakeBtn").classList.remove("hidden");

  isSelfieCaptured = true;
  checkStep2Validation();
}

function checkStep2Validation() {
  const captchaInput = document.getElementById("captchaInput")?.value?.toUpperCase();
  const btn = document.getElementById("selfieSaveNext");
  if (!btn) return;

  if (isSelfieCaptured && captchaInput === currentCaptchaStr) {
    btn.classList.remove("disabled");
  } else {
    btn.classList.add("disabled");
  }
}

function checkStep3Validation() {
  const btn = document.getElementById("propertySaveNext");
  if (!btn) return;

  const hasSelectedType = Object.values(selectedPropertyTypes).some(t => t.selected && t.price.trim() !== "");

  if (isLocationVerified && isPropertyImagesUploaded && hasSelectedType) {
    btn.classList.remove("disabled");
  } else {
    btn.classList.add("disabled");
  }
}


window.handleNextStep = (step) => {
  onboardingStep = step;
  render();
};

window.handlePrevStep = (step) => {
  onboardingStep = step;
  render();
};

window.handleFinishOnboarding = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login first to list your property.");
    openAuth();
    return;
  }

  try {
    const title = onboardingData.propertyTitle;
    const address = onboardingData.streetAddress;
    const city = onboardingData.city;
    const state = onboardingData.state;
    const pincode = onboardingData.pincode?.replace(/\s/g, "");

    if (!title) return alert("Property name is required.");
    if (!address) return alert("Street address is required.");
    if (!city) return alert("City is required.");
    if (!state) return alert("State is required.");
    if (pincode && !/^\d{6}$/.test(pincode)) return alert("Pincode must be 6 digits.");

    // Find selected types
    const selectedEntries = Object.entries(selectedPropertyTypes).filter(([_, v]) => v.selected && v.price);
    if (!selectedEntries.length) return alert("Please select at least one property type and enter its price.");

    const [typeKey, typeData] = selectedEntries[0];
    
    // Map to Enum
    const typeMap = {
      boys: "BOYS_HOSTEL",
      girls: "GIRLS_HOSTEL",
      flat: "FLAT",
      night: "ROOM"
    };
    
    const genderMap = {
      boys: "BOYS",
      girls: "GIRLS",
      flat: "UNISEX",
      night: "UNISEX"
    };

    const payload = {
      title,
      address,
      city,
      state,
      pincode: pincode || undefined,
      type: typeMap[typeKey],
      genderAllowed: genderMap[typeKey],
      priceStartingFrom: parseInt(typeData.price),
      depositAmount: parseInt(typeData.price) * 2, // Default to 2 months
      wifiIncluded: true, // Default some amenities based on common PG patterns
      foodIncluded: typeKey.includes('hostel'),
      latitude: currentGeocodedResults[0]?.lat ? parseFloat(currentGeocodedResults[0].lat) : undefined,
      longitude: currentGeocodedResults[0]?.lon ? parseFloat(currentGeocodedResults[0].lon) : undefined
    };

    const response = await fetchAPI("/properties", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (response.success) {
      const propertyId = response.data.id;

      // Upload Images if any
      if (onboardingFiles.length > 0) {
        const formData = new FormData();
        onboardingFiles.forEach(file => formData.append("images", file));
        
        try {
          const imgToken = localStorage.getItem("token");
          await fetch(`${API_URL}/properties/${propertyId}/images`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${imgToken}` },
            body: formData
          });
        } catch (imgErr) {
          console.error("Image upload failed:", imgErr);
          alert("Property listed, but image upload failed. You can add them later from edit.");
        }
      }

      alert("Congratulations! Your property has been submitted and is PENDING review.");
      // Reset onboarding state
      onboardingStep = 1;
      isLocationVerified = false;
      isPropertyImagesUploaded = false;
      onboardingFiles = [];
      
      userDashboardData.fetched = false; // Force refresh
      location.hash = "#user";
      activeProfileTab = "history";
    }
  } catch (error) {
    console.error("Submission error:", error);
    alert("Property listing failed: " + error.message);
  }
};

async function loadUserDashboardData() {
  if (userDashboardData.loading) return;
  userDashboardData.loading = true;
  render();
  try {
    const res = await fetchAPI("/owner/properties");
    userDashboardData.properties = res.data;
  } catch (err) {
    console.error("Dashboard load error:", err);
  } finally {
    userDashboardData.loading = false;
    render();
  }
}

async function handleVerifyOnMaps() {
  const street = document.getElementById("streetAddress")?.value;
  const city = document.getElementById("city")?.value;
  const state = document.getElementById("state")?.value;
  const pin = document.getElementById("pincode")?.value;

  if (!street || !city) {
    alert("Please enter street address and city first.");
    return;
  }

  const query = `${street}, ${city}, ${state || ""}, ${pin || ""}`;
  const btn = document.getElementById("verifyMapBtn");
  const loader = btn.querySelector(".btn-loader");
  const text = btn.querySelector(".btn-text");
  const resultsBox = document.getElementById("locationResults");

  loader.classList.remove("hidden");
  text.classList.add("hidden");
  resultsBox.innerHTML = "";
  resultsBox.classList.add("hidden");

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`, {
      headers: { "User-Agent": "HostelDekho/1.0" }
    });
    const data = await res.json();
    currentGeocodedResults = data;

    if (!data.length) {
      alert("No locations found. Please refine your address.");
      return;
    }

    if (data.length === 1) {
      finalizeVerification(data[0]);
    } else {
      // Show multiple results list
      resultsBox.classList.remove("hidden");
      resultsBox.innerHTML = `
        <p class="small-title">Multiple matches found. Select correct one:</p>
        ${data.map((item, i) => `
          <div class="result-choice" onclick="handleSelectLocation(${i})">
            🏠 ${item.display_name}
          </div>
        `).join("")}
      `;
    }
  } catch (err) {
    console.error(err);
    alert("API Error. Please try again or enter coordinates manually.");
  } finally {
    loader.classList.add("hidden");
    text.classList.remove("hidden");
  }
}

window.handleSelectLocation = (index) => {
  const choice = currentGeocodedResults[index];
  finalizeVerification(choice);
};

function finalizeVerification(choice) {
  isLocationVerified = true;
  const resultsBox = document.getElementById("locationResults");
  resultsBox.classList.add("hidden");

  const status = document.getElementById("verifyStatus");
  status.textContent = "✅ Location Verified";
  status.className = "verify-status verified";

  checkStep3Validation();

  // Open Google Maps to let owner verify visually
  window.open(`https://www.google.com/maps/search/?api=1&query=${choice.lat},${choice.lon}`, "_blank");
}

function handlePropertySave() {
  if (!isLocationVerified) {
    alert("Please 'Verify on Maps' before saving.");
    return;
  }
  alert("Success! Property coordinates saved and listing created.");
  // Here we would call the actual backend API
}

async function handleSendOtp(e) {
  const mobileInput = document.getElementById("mobile");
  if (!mobileInput) return;
  const mobile = mobileInput.value;
  if (!mobile) return alert("Please enter mobile number");

  try {
    const response = await fetch("http://localhost:5000/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile })
    });
    const data = await response.json();
    if (data.success) {
      const msg = data.data.otp ? `OTP sent! Your code is: ${data.data.otp}` : "OTP sent successfully!";
      alert(msg);

      // Transform UI to show Verify OTP
      const row = document.querySelector(".otp-row");
      row.innerHTML = `
        <input id="otpCode" type="text" placeholder="Enter 6-digit OTP">
        <button class="gradient-button" id="verifyOtpBtn" type="button">Verify OTP</button>
      `;
      document.getElementById("verifyOtpBtn").addEventListener("click", () => handleVerifyOtp(mobile));
    }
  } catch (error) {
    alert("Error sending OTP");
  }
}

async function handleVerifyOtp(mobile) {
  const code = document.getElementById("otpCode").value;
  try {
    const response = await fetch("http://localhost:5000/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, code })
    });
    const data = await response.json();
    if (data.success) {
      alert(`Welcome back, ${data.data.user.name}!`);
      localStorage.setItem("token", data.data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      closeAuth();
      renderHeader();
      render();
    } else {
      alert("Invalid OTP");
    }
  } catch (error) {
    alert("Error verifying OTP");
  }
}

async function handleGoogleLogin() {
  if (isAuthInProgress) return;
  isAuthInProgress = true;
  
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();

    const response = await fetch("http://localhost:5000/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });

    const data = await response.json();
    if (data.success) {
      alert(`Welcome, ${data.data.user.name}!`);
      localStorage.setItem("token", data.data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      closeAuth();
      renderHeader();
      render();
    } else {
      alert("Backend login failed: " + data.message);
    }
  } catch (error) {
    console.error("Google Login Error:", error);
    if (error.code === 'auth/configuration-not-found') {
      alert("ERROR: Google Sign-in is not enabled in your Firebase Console.\n\nPlease go to Firebase Console -> Authentication -> Sign-in method -> Add 'Google' and enable it.");
    } else {
      alert("Google Login failed: " + error.message);
    }
  } finally {
    isAuthInProgress = false;
  }
}

window.toggleAdminLogin = (show) => {
  document.getElementById("standardLogin").classList.toggle("hidden", show);
  document.getElementById("adminLogin").classList.toggle("hidden", !show);
};

window.handleAdminLogin = async () => {
  const email = document.getElementById("adminEmail").value;
  const password = document.getElementById("adminPassword").value;

  if (!email || !password) return alert("Please enter both email and password.");

  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();

    if (data.success) {
      alert(`Welcome back, Master Admin!`);
      localStorage.setItem("token", data.data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      closeAuth();
      renderHeader();
      location.hash = "#admin";
    } else {
      alert("Unauthorized: " + (data.message || "Invalid credentials"));
    }
  } catch (error) {
    alert("Login Error. Please check your connection.");
  }
};

function openAuth() {
  document.getElementById("authModal").classList.add("open");
  if (isDark) document.documentElement.setAttribute("data-theme", "dark");
}

function renderPricingOptions() {
  const types = [
    { id: "flat", label: "Flat / Appartment" },
    { id: "boys", label: "Boys Hostel" },
    { id: "girls", label: "Girls Hostel" },
    { id: "night", label: "One Night Stay" }
  ];

  return `
    <div class="pricing-section-container wide">
      <h3>Property Types & Pricing</h3>
      <p class="section-hint">Select all that apply. Enter separate monthly prices for each.</p>
      <div class="types-selection-grid">
        ${types.map(t => `
          <div class="type-item-row">
            <label class="type-checkbox-label">
              <input type="checkbox" id="type_${t.id}" ${selectedPropertyTypes[t.id].selected ? "checked" : ""}>
              <span class="type-text">${t.label}</span>
            </label>
            ${selectedPropertyTypes[t.id].selected ? `
              <div class="type-price-input-wrap animate-in">
                <span class="currency-prefix">Rs</span>
                <input type="number" id="price_${t.id}" placeholder="Monthly price" value="${selectedPropertyTypes[t.id].price}">
              </div>
            ` : ""}
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function closeAuth() {
  document.getElementById("authModal").classList.remove("open");
  document.getElementById("authModal").setAttribute("aria-hidden", "true");
}

function renderHeader() {
  const userJson = localStorage.getItem("user");
  const authContainer = document.getElementById("auth-actions");
  if (!authContainer) return;

  if (userJson) {
    const user = JSON.parse(userJson);
    const firstName = user.name ? user.name.split(' ')[0] : 'User';
    const avatar = user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=1769ff&color=fff`;

    authContainer.innerHTML = `
      <div class="user-profile-meta">
        <div class="avatar-wrap">
          <img src="${avatar}" alt="${user.name}">
        </div>
        <span class="user-name">${firstName}</span>
        <div class="profile-dropdown">
          <a href="${user.role === 'ADMIN' ? '#admin' : '#user'}">${user.role === 'ADMIN' ? 'Admin Panel' : 'Dashboard'}</a>
          <button id="logoutBtn" class="logout-link">Logout</button>
        </div>
      </div>
    `;

    setTimeout(() => {
      const logoutBtn = document.getElementById("logoutBtn");
      if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
    }, 0);
  } else {
    authContainer.innerHTML = `
      <button class="ghost-button" type="button" data-open-auth>Login</button>
    `;
    const loginBtn = authContainer.querySelector("[data-open-auth]");
    if (loginBtn) loginBtn.addEventListener("click", openAuth);
  }
}

function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  alert("Logged out successfully");
  renderHeader();
  location.hash = "#home";
}

function handleProfileUpdate(e) {
  e.preventDefault();
  const name = document.getElementById("edit_name").value;
  const email = document.getElementById("edit_email").value;
  const mobile = document.getElementById("edit_mobile").value;
  const address = document.getElementById("edit_address").value;

  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : {};
  
  const updatedUser = { ...user, name, email, mobile, address };
  localStorage.setItem("user", JSON.stringify(updatedUser));
  
  alert("Profile updated successfully! ✅");
  renderHeader();
  render();
}

function handleAvatarChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : {};
    user.profileImage = ev.target.result;
    localStorage.setItem("user", JSON.stringify(user));
    
    renderHeader();
    render();
  };
  reader.readAsDataURL(file);
}

document.querySelector(".close-auth").addEventListener("click", closeAuth);
document.getElementById("authModal").addEventListener("click", (event) => {
  if (event.target.id === "authModal") closeAuth();
});
document.getElementById("adminDetailModal").addEventListener("click", (event) => {
  if (event.target.id === "adminDetailModal") closeAdminModal();
});

const sendOtpBtn = document.getElementById("sendOtpBtn");
if (sendOtpBtn) sendOtpBtn.onclick = handleSendOtp;

const googleLoginBtn = document.querySelector(".oauth-button");
if (googleLoginBtn) googleLoginBtn.onclick = handleGoogleLogin;

window.addEventListener("hashchange", render);

renderHeader();
render();
