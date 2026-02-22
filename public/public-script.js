// ===== COMBINED PUBLIC SCRIPT: API + ENHANCED FEATURES =====
// This file combines public-script-api.js and public-script-enhanced.js

// ===== GLOBAL VARIABLES =====
let currentService = null;
let isModalTransitioning = false;
let imageCache = new Map();

// In-memory storage for booking flow (no localStorage - patient data goes to database only)
let selectedServiceData = null;

// Nomor WhatsApp klinik
const clinicWhatsApp = "6281381223811";

// Data layanan - diisi fallback dulu agar detail bisa dibuka, lalu di-overwrite oleh API
let serviceDetails = null;

// ===== CACHING UTILITIES =====
const CACHE_CONFIG = {
    SERVICES_KEY: 'alracare_services_cache',
    TTL: 60 * 60 * 1000, // 1 hour in milliseconds
    VERSION: '1.0' // Increment this to invalidate all caches
};

function getCachedData(key) {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const { data, timestamp, version } = JSON.parse(cached);
        
        // Check version
        if (version !== CACHE_CONFIG.VERSION) {
            localStorage.removeItem(key);
            return null;
        }

        // Check TTL
        const now = Date.now();
        if (now - timestamp > CACHE_CONFIG.TTL) {
            localStorage.removeItem(key);
            return null;
        }

        console.log('Cache hit:', key);
        return data;
    } catch (error) {
        console.error('Error reading cache:', error);
        return null;
    }
}

function setCachedData(key, data) {
    try {
        const cacheObject = {
            data,
            timestamp: Date.now(),
            version: CACHE_CONFIG.VERSION
        };
        localStorage.setItem(key, JSON.stringify(cacheObject));
        console.log('Cache set:', key);
    } catch (error) {
        console.error('Error setting cache:', error);
        // If localStorage is full, clear old caches
        if (error.name === 'QuotaExceededError') {
            clearOldCaches();
            try {
                localStorage.setItem(key, JSON.stringify({
                    data,
                    timestamp: Date.now(),
                    version: CACHE_CONFIG.VERSION
                }));
            } catch (retryError) {
                console.error('Failed to set cache after cleanup:', retryError);
            }
        }
    }
}

function clearOldCaches() {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('alracare_')) {
                const cached = localStorage.getItem(key);
                if (cached) {
                    const { timestamp, version } = JSON.parse(cached);
                    const now = Date.now();
                    // Remove if expired or old version
                    if (now - timestamp > CACHE_CONFIG.TTL || version !== CACHE_CONFIG.VERSION) {
                        localStorage.removeItem(key);
                    }
                }
            }
        });
        console.log('Old caches cleared');
    } catch (error) {
        console.error('Error clearing old caches:', error);
    }
}

function invalidateCache(key) {
    try {
        localStorage.removeItem(key);
        console.log('Cache invalidated:', key);
    } catch (error) {
        console.error('Error invalidating cache:', error);
    }
}

// Transform API response (categories array) to legacy format expected by UI
function transformApiServicesToLegacyFormat(categories) {
    if (!Array.isArray(categories) || categories.length === 0) return {};
    const result = {};
    for (const cat of categories) {
        const options = (cat.services || []).map(s => {
            let imgPath = '/public/images/placeholder.webp';
            if (s.image_url) {
                const raw = s.image_url.replace(/^\.\//, '');
                imgPath = raw.startsWith('/') ? raw : '/public/' + (raw.startsWith('images/') ? raw : 'images/' + raw);
            }
            return {
                id: s.id,
                name: s.name,
                price: s.price || (s.price_numeric ? 'Rp ' + Number(s.price_numeric).toLocaleString('id-ID') : 'Rp 0'),
                image: imgPath,
                category: cat.title
            };
        });
        result[cat.id] = {
            title: cat.title,
            description: cat.description || '',
            type: 'checkbox',
            options
        };
    }
    return result;
}

// Load gallery from API
async function loadGalleryFromAPI() {
    const grid = document.getElementById('galleryGrid');
    const loadingEl = document.getElementById('galleryLoading');
    if (!grid) return;

    const fallbackGallery = [
        { title: 'Tampak Depan', image_url: './images/tampakdepan.webp' },
        { title: 'Ruang Tunggu', image_url: './images/ruang_tunggu_1.webp' },
        { title: 'Ruang Tunggu', image_url: './images/ruang_tunggu_2.webp' },
        { title: 'Ruang Kecantikan', image_url: './images/ruang_kecantikan.webp' },
        { title: 'Ruang Luka', image_url: './images/ruang_luka.webp' },
        { title: 'Tim Perawat', image_url: './images/TimMedis.webp' }
    ];

    try {
        const response = await window.apiCall(window.API_CONFIG.ENDPOINTS.GALLERY);
        const items = (response && response.success && response.data) ? response.data : fallbackGallery;
        
        const getImgPath = (url) => {
            if (!url) return '/public/images/placeholder.webp';
            const raw = (url + '').replace(/^\.\//, '');
            return raw.startsWith('/') ? raw : '/public/' + (raw.startsWith('images/') ? raw : 'images/' + raw);
        };

        if (loadingEl) loadingEl.remove();
        grid.innerHTML = items.map(item => `
            <div class="gallery-item">
                <img src="${getImgPath(item.image_url)}" alt="${item.title || ''}" loading="lazy" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                <div class="gallery-fallback" style="display: none; align-items: center; justify-content: center; min-height: 200px; background: #f5f5f5; border-radius: 10px;">
                    <i class="fas fa-image" style="font-size: 3rem; color: #ccc;"></i>
                </div>
                <p>${item.title || 'Galeri'}</p>
            </div>
        `).join('');
    } catch (error) {
        console.warn('Gallery load failed, using fallback:', error);
        if (loadingEl) loadingEl.remove();
        const getImgPath = (url) => {
            if (!url) return '/public/images/placeholder.webp';
            const raw = (url + '').replace(/^\.\//, '');
            return raw.startsWith('/') ? raw : '/public/' + (raw.startsWith('images/') ? raw : 'images/' + raw);
        };
        grid.innerHTML = fallbackGallery.map(item => `
            <div class="gallery-item">
                <img src="${getImgPath(item.image_url)}" alt="${item.title || ''}" loading="lazy" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                <div class="gallery-fallback" style="display: none; align-items: center; justify-content: center; min-height: 200px; background: #f5f5f5; border-radius: 10px;">
                    <i class="fas fa-image" style="font-size: 3rem; color: #ccc;"></i>
                </div>
                <p>${item.title || 'Galeri'}</p>
            </div>
        `).join('');
    }
}

// ===== API INTEGRATION =====
async function loadServicesFromAPI() {
    try {
        // Show loading indicator
        showLoadingIndicator();

        // Try to get from cache first
        const cachedServices = getCachedData(CACHE_CONFIG.SERVICES_KEY);
        if (cachedServices) {
            serviceDetails = cachedServices;
            console.log('Services loaded from cache:', serviceDetails);
            hideLoadingIndicator();
            return;
        }

        // If no cache, fetch from API with timeout
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await window.apiCall(window.API_CONFIG.ENDPOINTS.SERVICES, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response && (response.success || Array.isArray(response))) {
                const rawData = response.success ? response.data : response;
                const transformed = transformApiServicesToLegacyFormat(rawData);
                if (Object.keys(transformed).length > 0) {
                    serviceDetails = transformed;
                    setCachedData(CACHE_CONFIG.SERVICES_KEY, serviceDetails);
                    console.log('Services loaded from API and cached');
                } else {
                    loadFallbackServices();
                }
                hideLoadingIndicator();
                return;
            }
        } catch (apiError) {
            console.warn('API call failed, using fallback:', apiError.message);
        }

        // Fallback to hardcoded data if API fails
        loadFallbackServices();
        hideLoadingIndicator();
    } catch (error) {
        console.error('Error loading services from API:', error);
        showNotification('⚠️ Gagal memuat layanan dari server. Menggunakan data lokal.', 'warning');
        // Fallback to hardcoded data if API fails
        loadFallbackServices();
        hideLoadingIndicator();
    }
}

function getImagePath(relPath) {
    if (!relPath) return '/public/images/placeholder.webp';
    const clean = relPath.replace(/^\.\//, '');
    return clean.startsWith('/') ? clean : '/public/' + (clean.startsWith('images/') ? clean : 'images/' + clean);
}

function loadFallbackServices() {
    // Fallback dengan path gambar absolut agar detail layanan bisa dibuka
    serviceDetails = {
        perawatan1: {
            title: "Perawatan Luka Modern",
            description: "Pilih jenis perawatan luka yang Anda butuhkan",
            type: "checkbox",
            options: [
                { id: "Perawatan Luka di Klinik", name: "1. Perawatan Luka di Klinik", price: "Rp 150.000", image: "/public/images/L_PERAWATANLIKADIKLINIK.webp" },
                { id: "Perawatan Luka Ke Rumah", name: "2. Perawatan Luka Ke Rumah di Area Pontianak", price: "Rp 200.000", image: "/public/images/L_PERAWATANLUKAKERUMAHPASIENDIAREAPONTIANAK_1.webp" },
                { id: "L_SENDALDIABETES", name: "3. Sendal Diabetes", price: "Rp 500.000", image: "/public/images/L_SENDALDIABETES.webp" }
            ]
        },
        perawatan2: {
            title: "Perawatan Kecantikan",
            description: "Pilih jenis perawatan kecantikan yang Anda butuhkan",
            type: "checkbox",
            options: [
                { id: "A_TAHILALAT(NEAVY)_1", name: "1. Tahi Lalat (Neavy)_1", price: "Rp 500.000", image: "/public/images/A_TAHILALAT(NEAVY).webp" },
                { id: "A_TAHILALAT(NEAVY)_2_7", name: "2. Tahi Lalat (Neavy)_2-7", price: "Rp 1.000.000", image: "/public/images/A_TAHILALAT(NEAVY).webp" },
                { id: "A_TAHILALAT(NEAVY)_>7", name: "3. Tahi Lalat (Neavy)_>7", price: "Rp 1.500.000", image: "/public/images/A_TAHILALAT(NEAVY).webp" },
                { id: "A_TOMPEL_1", name: "4. Tompel_1", price: "Rp 500.000", image: "/public/images/A_TOMPEL.webp" },
                { id: "A_TOMPEL_2_7", name: "5. Tompel_2-7", price: "Rp 1.000.000", image: "/public/images/A_TOMPEL.webp" },
                { id: "A_TOMPEL_>7", name: "6. Tompel_>7", price: "Rp 1.500.000", image: "/public/images/A_TOMPEL.webp" },
                { id: "A_KUTIL(SKINTAG)_1", name: "7. Kutil (Skin Tag)_1", price: "Rp 150.000", image: "/public/images/A_KUTIL(SKINTAG).webp" },
                { id: "A_KUTIL(SKINTAG)_2_7", name: "8. Kutil (Skin Tag)_2-7", price: "Rp 300.000", image: "/public/images/A_KUTIL(SKINTAG).webp" },
                { id: "A_KUTIL(SKINTAG)_>7", name: "9. Kutil (Skin Tag)_>7", price: "Rp 500.000", image: "/public/images/A_KUTIL(SKINTAG).webp" },
                { id: "A_MILLIA_1", name: "10. Millia_1", price: "Rp 150.000", image: "/public/images/A_MILLIA.webp" },
                { id: "A_MILLIA_2_7", name: "11. Millia_2-7", price: "Rp 300.000", image: "/public/images/A_MILLIA.webp" },
                { id: "A_MILLIA_>7", name: "12. Millia_>7", price: "Rp 500.000", image: "/public/images/A_MILLIA.webp" },
                { id: "A_SYRINGOMA_1", name: "13. Syringoma_1", price: "Rp 150.000", image: "/public/images/A_SYRINGOMA.webp" },
                { id: "A_SYRINGOMA_2_7", name: "14. Syringoma_2-7", price: "Rp 300.000", image: "/public/images/A_SYRINGOMA.webp" },
                { id: "A_SYRINGOMA_>7", name: "15. Syringoma_>7", price: "Rp 500.000", image: "/public/images/A_SYRINGOMA.webp" },
                { id: "A_XENTALASMA_1", name: "16. Xentalasma_1", price: "Rp 500.000", image: "/public/images/A_XENTALASMA.webp" },
                { id: "A_XENTALASMA_2", name: "17. Xentalasma_2", price: "Rp 750.000", image: "/public/images/A_XENTALASMA.webp" },
                { id: "A_SEBOROIKKERATOSIS_1", name: "18. Seboroik Keratosis_1", price: "Rp 500.000", image: "/public/images/A_SEBOROIKKERATOSIS.webp" },
                { id: "A_SEBOROIKKERATOSIS_2_7", name: "19. Seboroik Keratosis_2-7", price: "Rp 1.000.000", image: "/public/images/A_SEBOROIKKERATOSIS.webp" },
                { id: "A_SEBOROIKKERATOSIS_>7", name: "20. Seboroik Keratosis_>7", price: "Rp 1.500.000", image: "/public/images/A_SEBOROIKKERATOSIS.webp" },
                { id: "A_LENTIGO_1", name: "21. Lentigo_1", price: "Rp 150.000", image: "/public/images/A_LENTIGO.webp" },
                { id: "A_LENTIGO_2_7", name: "22. Lentigo_2-7", price: "Rp 300.000", image: "/public/images/A_LENTIGO.webp" },
                { id: "A_LENTIGO_>7", name: "23. Lentigo_>7", price: "Rp 500.000", image: "/public/images/A_LENTIGO.webp" },
                { id: "A_NODAKOPISUSU(CAVEAULAITMACULE)_1", name: "24. Noda Kopi Susu (Cave Au Lait Macule)_1", price: "Rp 500.000", image: "/public/images/A_NODAKOPISUSU(CAVEAULAITMACULE).webp" },
                { id: "A_NODAKOPISUSU(CAVEAULAITMACULE)_2_7", name: "25. Noda Kopi Susu (Cave Au Lait Macule)_2-7", price: "Rp 1.000.000", image: "/public/images/A_NODAKOPISUSU(CAVEAULAITMACULE).webp" },
                { id: "A_NODAKOPISUSU(CAVEAULAITMACULE)_>7", name: "26. Noda Kopi Susu (Cave Au Lait Macule)_>7", price: "Rp 1.500.000", image: "/public/images/A_NODAKOPISUSU(CAVEAULAITMACULE).webp" },
                { id: "A_BABAK(NEVUSOFOTA)", name: "27. Babak (Nevus Of Ota)", price: "Rp 1.600.000", image: "/public/images/A_BABAK(NEVUSOFOTA).webp" },
                { id: "A_NEVUSOFHORY", name: "28. Nevus Of Hory", price: "Rp 1.600.000", image: "/public/images/A_NEVUSOFHORY.webp" },
                { id: "A_FLEKHITAM(MELASMA)", name: "29. Flek Hitam (Melasma)", price: "Rp 600.000", image: "/public/images/A_FLEKHITAM(MELASMA).webp" },
                { id: "A_FLEKBULE(FREACKLES)", name: "30. Flek Bule (Freackles)", price: "Rp 600.000", image: "/public/images/A_FLEKBULE(FREACKLES).webp" },
                { id: "A_NODABEKASJERAWAT(ACNESPOT)", name: "31. Noda Bekas Jerawat (Acne Spot)", price: "Rp 600.000", image: "/public/images/A_NODABEKASJERAWAT(ACNESPOT).webp" },
                { id: "A_NODABEKASLUKA(HIPERPIGMENTASI)", name: "32. Noda Bekas Luka (Hiperpigmentasi)", price: "Rp 600.000", image: "/public/images/A_NODABEKASLUKA(HIPERPIGMENTASI).webp" },
                { id: "A_GOSONGKARENAJENUHPAKAIKRIMRACIKAN(ONCHRONOSIS)", name: "33. Gosong Karena Jenuh Pakai Krim Racikan (Onchronosis)", price: "Rp 600.000", image: "/public/images/A_GOSONGKARENAJENUHPAKAIKRIMRACIKAN(ONCHRONOSIS).webp" },
                { id: "A_MENCERAHKAN(BRIGHTENING)", name: "34. Mencerahkan (Brightening)", price: "Rp 600.000", image: "/public/images/A_MENCERAHKAN(BRIGHTENING).webp" },
                { id: "A_BLOODSPOT_1", name: "35. Blood Spot_1", price: "Rp 150.000", image: "/public/images/A_BLOODSPOT.webp" },
                { id: "A_BLOODSPOT_2_7", name: "36. Blood Spot_2-7", price: "Rp 300.000", image: "/public/images/A_BLOODSPOT.webp" },
                { id: "A_BLOODSPOT_>7", name: "37. Blood Spot_>7", price: "Rp 500.000", image: "/public/images/A_BLOODSPOT.webp" },
                { id: "A_SPIDERVEIN", name: "38. Spider Vein", price: "Rp 600.000", image: "/public/images/A_SPIDERVEIN.webp" },
                { id: "A_JERAWAT(ACNE)", name: "39. Jerawat (Acne)", price: "Rp 600.000", image: "/public/images/A_JERAWAT(ACNE).webp" },
                { id: "A_KOMEDOHITAM(BLACKHEAD)", name: "40. Komedo Hitam (Blackhead)", price: "Rp 300.000", image: "/public/images/A_KOMEDOHITAM(BLACKHEAD).webp" },
                { id: "A_KOMEDOPUTIH(WHITEHEAD)", name: "41. Komedo Putih (Whitehead)", price: "Rp 300.000", image: "/public/images/A_KOMEDOPUTIH(WHITEHEAD).webp" },
                { id: "A_BOPENG(ACNESCAR)", name: "42. Bopeng (Acne Scar)", price: "Rp 600.000", image: "/public/images/A_BOPENG(ACNESCAR).webp" },
                { id: "A_BEKASLUKACEKUNG(SCAR)", name: "43. Bekas Luka Cekung (Scar)", price: "Rp 600.000", image: "/public/images/A_BEKASLUKACEKUNG(SCAR).webp" },
                { id: "A_BEKASCACAR(SMALLPOXSCAR)", name: "44. Bekas Cacar (Smallpox Scar)", price: "Rp 600.000", image: "/public/images/A_BEKASCACAR(SMALLPOXSCAR).webp" },
                { id: "A_STRETCHMARK", name: "45. Stretch Mark", price: "Rp 600.000", image: "/public/images/A_STRETCHMARK.webp" },
                { id: "A_KELLOID", name: "46. Kelloid", price: "Rp 600.000", image: "/public/images/A_KELLOID.webp" },
                { id: "A_KERIPUT(WRINCLE)", name: "47. Keriput (Wrincle)", price: "Rp 600.000", image: "/public/images/A_KERIPUT(WRINCLE).webp" },
                { id: "A_KANTUNGMATA(EYEBAG)", name: "48. Kantung Mata (Eye Bag)", price: "Rp 600.000", image: "/public/images/A_KANTUNGMATA(EYEBAG).webp" },
                { id: "A_MATAIKAN(CLAVUS)", name: "49. Mata Ikan (Clavus)", price: "Rp 300.000", image: "/public/images/A_MATAIKAN(CLAVUS).webp" },
                { id: "A_KAPALAN(CALLOUS)", name: "50. Kapalan (Callous)", price: "Rp 300.000", image: "/public/images/A_KAPALAN(CALLOUS).webp" },
                { id: "A_KAKIPECAH-PECAH(FISURA)", name: "51. Kaki Pecah-Pecah (Fisura)", price: "Rp 300.000", image: "/public/images/A_KAKIPECAH-PECAH(FISURA).webp" },
                { id: "A_CHEMICALPEELING", name: "52. Chemical Peeling", price: "Rp 600.000", image: "/public/images/A_CHEMICALPEELING.webp" },
                { id: "A_BB_GLOW", name: "53. BB Glow", price: "Rp 600.000", image: "/public/images/A_BB_GLOW.webp" },
                { id: "A_DETOX", name: "54. Detox", price: "Rp 600.000", image: "/public/images/A_DETOX.webp" },
                { id: "A_RFSLIMING", name: "55. RF Sliming", price: "Rp 600.000", image: "/public/images/A_RFSLIMING.webp" },
                { id: "A_LASERTATO4X4CM", name: "56. Laser Tato 4x4 cm", price: "Rp 600.000", image: "/public/images/A_LASERTATO4X4CM.webp" }
            ]
        },
        perawatan3: {
            title: "Sunat Modern",
            description: "Pilih metode sunat yang sesuai dengan kebutuhan",
            type: "checkbox",
            options: [
                { id: "S_RING", name: "1. Sunat Ring", price: "Rp 1.200.000", image: "/public/images/S_RING.webp" },
                { id: "S_RING(EXTRAMAINAN)", name: "2. Sunat Ring Extra Mainan", price: "Rp 1.500.000", image: "/public/images/S_RING(EXTRAMAINAN).webp" },
                { id: "S_TEKNOSEALER", name: "3. Sunat Tekno Sealer", price: "Rp 2.500.000", image: "/public/images/S_TEKNOSEALER.webp" },
                { id: "S_TEKNOSEALER(EXTRAMAINAN)", name: "4. Sunat Tekno Sealer Extra Mainan", price: "Rp 2.800.000", image: "/public/images/S_TECHNOSEALER(EXTRAMAINAN).webp" },
                { id: "S_CIRCLECLAMP", name: "5. Sunat Circle Clamp", price: "Rp 1.200.000", image: "/public/images/S_CIRCLECLAMP.webp" },
                { id: "S_CIRCLECLAMP(EXTRAMAINAN)", name: "6. Sunat Circle Clamp Extra Mainan", price: "Rp 1.500.000", image: "/public/images/S_CIRCLECLAMP(EXTRAMAINAN).webp" }
            ]
        },
        perawatan4: {
            title: "Hipnoterapi",
            description: "Pilih jenis terapi hipnoterapi yang sesuai dengan kebutuhan Anda",
            type: "checkbox",
            options: [
                { id: "H_BERHENTIJUDOL", name: "1. Berhenti Judol", price: "Rp 500.000", image: "/public/images/H_BERHENTIJUDOL.webp" },
                { id: "H_BERHENTIMEROKOK", name: "2. Berhenti Merokok", price: "Rp 500.000", image: "/public/images/H_BERHENTIMEROKOK.webp" },
                { id: "H_BERHENTISELINGKUH", name: "3. Berhenti Selingkuh", price: "Rp 500.000", image: "/public/images/H_BERHENTISELINGKUH.webp" },
                { id: "H_MELUPAKANMANTAN", name: "4. Melupakan Mantan", price: "Rp 500.000", image: "/public/images/H_MELUPAKANMANTAN.webp" },
                { id: "H_MENGHILANGKANFOBIA", name: "5. Menghilangkan Fobia", price: "Rp 500.000", image: "/public/images/H_MENGHILANGKANFOBIA.webp" }
            ]
        },
        perawatan5: {
            title: "Skincare",
            description: "Pilih produk skincare yang sesuai dengan kebutuhan kulit Anda",
            type: "checkbox",
            options: [
                { id: "SK_BBCREAMACNE", name: "1. BB Cream Acne", price: "Rp 160.000", image: "/public/images/SK_BBCREAMACNE.webp" },
                { id: "SK_FACIALSOAPSALICID", name: "2. Facial Soap Salicid", price: "Rp 170.000", image: "/public/images/SK_FACIALSOAPSALICID.webp" },
                { id: "SK_HYDROGENPUDDINGMOISTURIZING", name: "3. Hydrogen Pudding Moisturizing", price: "Rp 210.000", image: "/public/images/SK_HYDROGENPUDDINGMOISTURIZING.webp" },
                { id: "SK_KRIMACNEMALAM", name: "4. Krim Acne Malam", price: "Rp 160.000", image: "/public/images/SK_FACIALSOAPSALICID.webp" },
                { id: "SK_PAKETPEMBERSIHLIGHTENING", name: "5. Paket Pembersih Lightening", price: "Rp 440.000", image: "/public/images/SK_PAKETPEMBERSIHLIGHTENING.webp" },
                { id: "SK_SERUMGLOWING", name: "6. Serum Glowing", price: "Rp 170.000", image: "/public/images/SK_SERUMGLOWING.webp" },
                { id: "SK_SUNSCREENACNE", name: "7. Sunscreen Acne", price: "Rp 150.000", image: "/public/images/SK_SUNSCREENACNE.webp" },
                { id: "SK_SUNSCREENPUDDING", name: "8. Sunscreen Pundding", price: "Rp 200.000", image: "/public/images/SK_SUNSCREENPUDDING.webp" },
                { id: "SK_WHITENING", name: "9. Whitening", price: "Rp 215.000", image: "/public/images/SK_WHITENING.webp" }
            ]
        }
    };
    console.log('Fallback services loaded with ALL 76 services:', serviceDetails);
}

// ===== UTILITY FUNCTIONS =====
function extractPrice(priceString) {
    if (!priceString) return 0;
    const match = priceString.match(/(\d+\.?\d*)/g);
    return match ? parseInt(match[0].replace(/\./g, '')) : 0;
}

function formatPrice(price) {
    return 'Rp ' + price.toLocaleString('id-ID');
}

function preloadImage(src) {
    return new Promise((resolve, reject) => {
        if (imageCache.has(src)) {
            resolve(imageCache.get(src));
            return;
        }

        const img = new Image();
        img.onload = () => {
            imageCache.set(src, {
                width: img.width,
                height: img.height,
                aspectRatio: img.width / img.height
            });
            resolve(imageCache.get(src));
        };
        img.onerror = () => {
            const fallback = {
                width: 400,
                height: 300,
                aspectRatio: 4/3,
                isFallback: true
            };
            imageCache.set(src, fallback);
            resolve(fallback);
        };
        img.src = src;
    });
}

function getImageContainerClass(orientation) {
    if (orientation.aspectRatio < 0.8) return 'portrait';
    if (orientation.aspectRatio > 1.2) return 'landscape';
    return 'square';
}

// ===== WHATSAPP FUNCTION =====
async function contactViaWhatsApp(bookingId = null) {
    let message = "Halo Alra Care, saya ingin bertanya tentang layanan yang tersedia.";
    
    if (bookingId) {
        try {
            // Try to get booking from API
            const response = await window.apiCall(window.API_CONFIG.ENDPOINTS.BOOKING_CHECK(bookingId));
            if (response.success && response.data) {
                const booking = response.data;
                message = `Halo Alra Care, saya ${booking.patient_name} dengan nomor booking ${bookingId}. Saya ingin konfirmasi booking untuk layanan pada ${booking.appointment_date} jam ${booking.appointment_time}.`;
            }
        } catch (error) {
            console.error('Error fetching booking:', error);
        }
    }
    
    const whatsappUrl = `https://wa.me/${clinicWhatsApp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// ===== LOADING INDICATOR FUNCTIONS =====
function showLoadingIndicator() {
    // Remove existing loading indicator
    hideLoadingIndicator();

    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'global-loading-indicator';
    loadingDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            flex-direction: column;
        ">
            <div style="
                width: 50px;
                height: 50px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
            "></div>
            <div style="
                color: #667eea;
                font-family: 'Segoe UI', sans-serif;
                font-size: 16px;
                font-weight: 500;
            ">
                Memuat layanan Alra Care...
            </div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(loadingDiv);
}

function hideLoadingIndicator() {
    const loadingDiv = document.getElementById('global-loading-indicator');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// ===== MODAL MANAGEMENT =====
const modalManager = {
    openModal: function(modalId) {
        try {
            if (isModalTransitioning) return;
            isModalTransitioning = true;
            
            const modal = document.getElementById(modalId);
            if (!modal) {
                throw new Error(`Modal dengan ID ${modalId} tidak ditemukan`);
            }
            
            modal.style.display = 'block';
            modal.scrollTop = 0;
            
            document.body.style.overflow = 'hidden';
            
            setTimeout(() => {
                modal.classList.add('show');
                isModalTransitioning = false;
            }, 10);
        } catch (error) {
            console.error('Modal error:', error);
            showNotification('Terjadi error saat membuka modal', 'error');
            isModalTransitioning = false;
        }
    },
    
    closeModal: function(modalId) {
        try {
            if (isModalTransitioning) return;
            isModalTransitioning = true;
            
            const modal = document.getElementById(modalId);
            if (!modal) {
                isModalTransitioning = false;
                return;
            }
            
            modal.classList.remove('show');
            
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
                
                if (modalId === 'serviceModal') {
                    const modalContent = document.getElementById('serviceModalContent');
                    if (modalContent) modalContent.innerHTML = '';
                }
                if (modalId === 'quickBookingModal') {
                    const modalContent = document.getElementById('quickBookingContent');
                    if (modalContent) modalContent.innerHTML = '';
                }
                isModalTransitioning = false;
            }, 300);
        } catch (error) {
            console.error('Modal close error:', error);
            isModalTransitioning = false;
        }
    },
    
    closeAll: function() {
        if (isModalTransitioning) return;
        isModalTransitioning = true;
        
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            
            setTimeout(() => {
                modal.style.display = 'none';
                
                if (modal.id === 'serviceModal') {
                    const modalContent = document.getElementById('serviceModalContent');
                    if (modalContent) modalContent.innerHTML = '';
                }
                if (modal.id === 'quickBookingModal') {
                    const modalContent = document.getElementById('quickBookingContent');
                    if (modalContent) modalContent.innerHTML = '';
                }
            }, 300);
        });
        
        document.body.style.overflow = 'auto';
        
        setTimeout(() => {
            isModalTransitioning = false;
        }, 350);
    }
};

// ===== SERVICE DETAIL MODAL FUNCTIONS =====
async function showServiceDetail(serviceId) {
    if (isModalTransitioning) return;

    if (!serviceDetails || typeof serviceDetails !== 'object') {
        if (typeof loadFallbackServices === 'function') {
            loadFallbackServices();
        }
    }
    
    const service = serviceDetails && serviceDetails[serviceId];
    if (!service) {
        console.error(`Service dengan ID ${serviceId} tidak ditemukan`);
        showNotification('❌ Layanan tidak ditemukan', 'error');
        return;
    }

    const modalContent = document.getElementById('serviceModalContent');
    if (!modalContent) {
        console.error('Element serviceModalContent tidak ditemukan');
        return;
    }

    // Show loading state
    modalContent.innerHTML = `
        <div class="loading-state">
            <div class="loading-icon">⏳</div>
            <h3>Memuat Layanan...</h3>
            <p>Sedang memuat detail layanan yang dipilih</p>
        </div>
    `;

    modalManager.openModal('serviceModal');

    try {
        // Preload images in batches for better performance
        const batchSize = 3;
        const imageOrientations = [];
        
        for (let i = 0; i < service.options.length; i += batchSize) {
            const batch = service.options.slice(i, i + batchSize);
            const batchPromises = batch.map(option => preloadImage(option.image));
            const batchResults = await Promise.all(batchPromises);
            imageOrientations.push(...batchResults);
        }

        renderServiceOptions(serviceId, service, imageOrientations);
    } catch (error) {
        console.error('Error loading service details:', error);
        showErrorState(service);
    }
}

function renderServiceOptions(serviceId, service, imageOrientations) {
    const optionsHTML = service.options.map((option, index) => {
        const orientation = imageOrientations[index] || { aspectRatio: 1 };
        const containerClass = getImageContainerClass(orientation);
        
        return `
            <div class="option-card" onclick="toggleOptionSelection('${option.id}')">
                <div class="option-header">
                    <div class="option-checkbox">
                        <input type="checkbox" id="${option.id}" name="service-option" value="${option.id}" 
                               onclick="event.stopPropagation(); updateSelectionSummary('${serviceId}')">
                    </div>
                    <div class="option-image-container ${containerClass}">
                        <img src="${option.image}" alt="${option.name}" 
                             loading="lazy"
                             onload="this.style.opacity='1'"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjZjhmOGY4IiByeD0iMjAiLz4KPHRleHQgeD0iMjAwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2NjYyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4K'; this.style.opacity='1'"
                             style="opacity: 0; transition: opacity 0.3s ease">
                    </div>
                    <div class="option-title">
                        <h3>${option.name}</h3>
                        ${option.category ? `<span class="option-category">${option.category}</span>` : ''}
                    </div>
                </div>
                
                <div class="option-details">
                    <div class="option-price">
                        <strong>💰 Harga:</strong> ${option.price}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const content = `
        <div class="service-modal-header">
            <h2>${service.title}</h2>
            <p class="service-description">${service.description}</p>
            <p class="selection-info">✅ Pilih satu atau beberapa perawatan dengan mengklik card-nya</p>
        </div>
        
        <div class="options-container">
            ${optionsHTML}
        </div>
        
        <div class="selection-summary" id="selectionSummary" style="display: none;">
            <h4>📋 Perawatan yang Dipilih:</h4>
            <div id="selectedOptionsList"></div>
            <div class="total-price">
                <strong>💰 Total Estimasi: <span id="totalPrice">Rp 0</span></strong>
            </div>
        </div>
        
        <div class="service-modal-footer">
            <button class="cta-button secondary" onclick="modalManager.closeAll()">
                <i class="fas fa-arrow-left"></i> Kembali
            </button>
            <button class="cta-button" id="bookingBtn" onclick="proceedToBooking('${serviceId}')" disabled style="opacity: 0.6; cursor: not-allowed;">
                <i class="fas fa-calendar-check"></i> Lanjut ke Booking
            </button>
        </div>
    `;

    const modalContent = document.getElementById('serviceModalContent');
    if (!modalContent) return;

    modalContent.style.opacity = '0';
    
    setTimeout(() => {
        modalContent.innerHTML = content;
        modalContent.style.opacity = '1';
        
        if (service.type === "checkbox") {
            attachCheckboxListeners(serviceId);
        }
        
        updateSelectionSummary(serviceId);
    }, 200);
}

function showErrorState(service) {
    const modalContent = document.getElementById('serviceModalContent');
    if (!modalContent) return;

    modalContent.innerHTML = `
        <div class="error-state">
            <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
            <h3>Gagal Memuat Layanan</h3>
            <p>Terjadi kesalahan saat memuat detail layanan. Silakan coba lagi.</p>
            <button class="cta-button" onclick="modalManager.closeAll()" style="margin-top: 1rem;">
                <i class="fas fa-times"></i> Tutup
            </button>
        </div>
    `;
}

function toggleOptionSelection(optionId) {
    const checkbox = document.getElementById(optionId);
    if (!checkbox) return;

    checkbox.checked = !checkbox.checked;
    
    const optionCard = checkbox.closest('.option-card');
    if (optionCard) {
        if (checkbox.checked) {
            optionCard.classList.add('selected');
        } else {
            optionCard.classList.remove('selected');
        }
    }
    
    const serviceId = Object.keys(serviceDetails).find(id => 
        serviceDetails[id].options.some(opt => opt.id === optionId)
    );
    if (serviceId) {
        updateSelectionSummary(serviceId);
    }
}

function attachCheckboxListeners(serviceId) {
    const checkboxes = document.querySelectorAll('input[name="service-option"]');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const optionCard = this.closest('.option-card');
            if (optionCard) {
                if (this.checked) {
                    optionCard.classList.add('selected');
                } else {
                    optionCard.classList.remove('selected');
                }
            }
            updateSelectionSummary(serviceId);
        });
    });
}

function updateSelectionSummary(serviceId) {
    const service = serviceDetails[serviceId];
    if (!service) return;

    const selectedCheckboxes = document.querySelectorAll('input[name="service-option"]:checked');
    const bookingBtn = document.getElementById('bookingBtn');
    const selectionSummary = document.getElementById('selectionSummary');
    const selectedOptionsList = document.getElementById('selectedOptionsList');
    const totalPriceElement = document.getElementById('totalPrice');

    if (bookingBtn) {
        bookingBtn.disabled = selectedCheckboxes.length === 0;
        
        if (selectedCheckboxes.length > 0) {
            bookingBtn.style.opacity = "1";
            bookingBtn.style.cursor = "pointer";
            bookingBtn.innerHTML = `<i class="fas fa-calendar-check"></i> Lanjut ke Booking (${selectedCheckboxes.length})`;
        } else {
            bookingBtn.style.opacity = "0.6";
            bookingBtn.style.cursor = "not-allowed";
            bookingBtn.innerHTML = `<i class="fas fa-calendar-check"></i> Lanjut ke Booking`;
        }
    }
    
    if (selectedCheckboxes.length > 0) {
        if (selectionSummary) selectionSummary.style.display = 'block';
        
        let optionsHTML = '';
        let totalPrice = 0;
        
        selectedCheckboxes.forEach(checkbox => {
            const option = service.options.find(opt => opt.id === checkbox.value);
            if (option) {
                optionsHTML += `
                    <div class="selected-option">
                        <span class="option-name">${option.name}</span>
                        <span class="option-price">${option.price}</span>
                    </div>
                `;
                
                totalPrice += extractPrice(option.price);
            }
        });
        
        if (selectedOptionsList) selectedOptionsList.innerHTML = optionsHTML;
        if (totalPriceElement) {
            totalPriceElement.textContent = formatPrice(totalPrice);
        }
        
    } else {
        if (selectionSummary) selectionSummary.style.display = 'none';
    }
}

function proceedToBooking(serviceId) {
    console.log('Memproses booking untuk service:', serviceId);
    
    const service = serviceDetails[serviceId];
    if (!service) {
        console.error('Service tidak ditemukan:', serviceId);
        showNotification('❌ Gagal memproses booking. Service tidak ditemukan.', 'error');
        return;
    }

    const selectedCheckboxes = document.querySelectorAll('input[name="service-option"]:checked');
    const selectedOptions = [];
    
    console.log('Jumlah opsi terpilih:', selectedCheckboxes.length);
    
    selectedCheckboxes.forEach(checkbox => {
        const option = service.options.find(opt => opt.id === checkbox.value);
        if (option) {
            selectedOptions.push({
                id: option.id,
                name: option.name,
                price: option.price
            });
            console.log('Opsi terpilih:', option.name);
        }
    });
    
    if (selectedOptions.length === 0) {
        showNotification('❌ Silakan pilih minimal satu perawatan sebelum booking.', 'warning');
        return;
    }
    
    const bookingData = {
        serviceId: serviceId,
        serviceName: service.title,
        selectedOptions: selectedOptions,
        type: 'checkbox',
        timestamp: new Date().toISOString()
    };
    
    try {
        // Simpan di memori (tidak pakai localStorage - data pasien hanya di database)
        selectedServiceData = bookingData;
        console.log('Data booking disimpan:', bookingData);
        showBookingForm();
    } catch (error) {
        console.error('Error menyimpan data booking:', error);
        showNotification('❌ Gagal menyimpan data booking.', 'error');
    }
}

// ===== QUICK BOOKING FUNCTION =====
function showQuickBooking() {
    const content = `
        <div class="booking-form-modal">
            <div class="booking-header">
                <h2><i class="fas fa-calendar-plus"></i> Booking Cepat</h2>
                <p class="form-description">Pilih layanan yang ingin Anda booking</p>
            </div>
            
            <div class="quick-booking-options">
                <div class="quick-service-grid">
                    ${Object.entries(serviceDetails).map(([id, service]) => `
                        <div class="quick-service-card" onclick="showServiceDetail('${id}')">
                            <div class="quick-service-icon">
                                <i class="fas fa-${getServiceIcon(id)}"></i>
                            </div>
                            <h4>${service.title}</h4>
                            <p>${service.options.length} pilihan layanan</p>
                            <button class="cta-button secondary">
                                <i class="fas fa-arrow-right"></i> Pilih
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="form-actions">
                <button class="cta-button secondary" onclick="modalManager.closeAll()">
                    <i class="fas fa-times"></i> Tutup
                </button>
                <button class="cta-button" onclick="scrollToServices()">
                    <i class="fas fa-eye"></i> Lihat Semua Layanan
                </button>
            </div>
        </div>
    `;

    const modalContent = document.getElementById('quickBookingContent');
    if (modalContent) {
        modalContent.innerHTML = content;
        modalManager.openModal('quickBookingModal');
    }
}

function getServiceIcon(serviceId) {
    const icons = {
        perawatan1: 'stethoscope',
        perawatan2: 'spa',
        perawatan3: 'user-md',
        perawatan4: 'brain',
        perawatan5: 'prescription-bottle'
    };
    return icons[serviceId] || 'heart';
}

// ===== BOOKING FORM FUNCTIONS =====
function showBookingForm() {
    const selectedData = selectedServiceData || {};
    
    console.log('Data yang akan ditampilkan di form:', selectedData);
    
    if (!selectedData.serviceId || !selectedData.selectedOptions) {
        showNotification('❌ Data booking tidak valid. Silakan pilih layanan kembali.', 'error');
        modalManager.closeAll();
        return;
    }
    
    const timeOptions = generateTimeOptions();
    const today = new Date().toISOString().split('T')[0];
    
    const servicesHTML = selectedData.selectedOptions.map(option => `
        <div class="service-summary-item">
            <div>
                <strong>${option.name}</strong>
            </div>
            <span class="service-price">${option.price}</span>
        </div>
    `).join('');

    const content = `
        <div class="booking-form-modal">
            <div class="booking-header">
                <h2><i class="fas fa-calendar-check"></i> Formulir Booking</h2>
                <p class="form-description">Lengkapi data diri Anda untuk melanjutkan booking</p>
            </div>
            
            <div class="selected-services-summary">
                <h4><i class="fas fa-shopping-cart"></i> Layanan yang Dipilih:</h4>
                ${servicesHTML}
            </div>
            
            <form id="patientBookingForm" class="booking-form">
                <div class="form-section">
                    <h4><i class="fas fa-user"></i> Data Diri Pasien</h4>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="patientName">Nama Lengkap *</label>
                            <input type="text" id="patientName" name="patientName" required 
                                   placeholder="Masukkan nama lengkap"
                                   pattern="[a-zA-Z\\s]{3,}">
                            <div class="validation-message" id="nameValidation"></div>
                        </div>
                        <div class="form-group">
                            <label for="patientPhone">Nomor Telepon *</label>
                            <input type="tel" id="patientPhone" name="patientPhone" required 
                                   placeholder="Contoh: 081234567890"
                                   pattern="[0-9]{10,13}">
                            <div class="validation-message" id="phoneValidation"></div>
                        </div>
                    </div>
                    
                    <div class="form-group full-width">
                        <label for="patientAddress">Alamat Lengkap *</label>
                        <textarea id="patientAddress" name="patientAddress" rows="4" required 
                                  placeholder="Masukkan alamat lengkap (jalan, RT/RW, kelurahan, kecamatan, kota)"></textarea>
                        <div class="validation-message" id="addressValidation"></div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h4><i class="fas fa-calendar-alt"></i> Jadwal Perawatan</h4>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="appointmentDate">Tanggal Perawatan *</label>
                            <input type="date" id="appointmentDate" name="appointmentDate" 
                                   min="${today}" required>
                            <small class="date-note">Pilih tanggal mulai hari ini</small>
                            <div class="validation-message" id="dateValidation"></div>
                        </div>
                        <div class="form-group">
                            <label for="appointmentTime">Jam Perawatan *</label>
                            <select id="appointmentTime" name="appointmentTime" required>
                                <option value="">Pilih Jam</option>
                                ${timeOptions}
                            </select>
                            <small class="time-note">Jam praktik: 08:00 - 17:00</small>
                            <div class="validation-message" id="timeValidation"></div>
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h4><i class="fas fa-notes-medical"></i> Informasi Tambahan</h4>
                    <div class="form-group full-width">
                        <label for="patientNotes">Catatan Tambahan (opsional)</label>
                        <textarea id="patientNotes" name="patientNotes" rows="4" 
                                  placeholder="Keluhan khusus, alergi, riwayat penyakit, atau informasi lain yang perlu kami ketahui..."></textarea>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="cta-button secondary" onclick="goBackToServiceSelection()">
                        <i class="fas fa-arrow-left"></i> Kembali ke Pilihan Layanan
                    </button>
                    <button type="submit" class="cta-button">
                        <i class="fas fa-paper-plane"></i> Konfirmasi Booking
                    </button>
                </div>
            </form>
        </div>
    `;

    const modalContent = document.getElementById('serviceModalContent');
    if (!modalContent) return;

    modalContent.innerHTML = content;
    
    setDefaultAppointmentDate();
    setupEnhancedFormValidation();
    
    const form = document.getElementById('patientBookingForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitBookingForm();
        });
    }
}

function generateTimeOptions() {
    let options = '';
    for (let hour = 8; hour <= 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            if (hour === 17 && minute > 0) break;
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            options += `<option value="${time}">${time}</option>`;
        }
    }
    return options;
}

function setDefaultAppointmentDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
    
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        dateInput.value = tomorrowFormatted;
    }
}

function setupEnhancedFormValidation() {
    const phoneInput = document.getElementById('patientPhone');
    const nameInput = document.getElementById('patientName');
    const addressInput = document.getElementById('patientAddress');
    const dateInput = document.getElementById('appointmentDate');
    const timeInput = document.getElementById('appointmentTime');

    // Real-time phone validation
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            const value = this.value.replace(/[^0-9]/g, '');
            this.value = value;
            
            const validationElement = document.getElementById('phoneValidation');
            if (value.length >= 10 && value.length <= 13) {
                this.style.borderColor = 'var(--success-color)';
                if (validationElement) {
                    validationElement.textContent = '✓ Nomor telepon valid';
                    validationElement.style.color = 'var(--success-color)';
                }
            } else {
                this.style.borderColor = 'var(--error-color)';
                if (validationElement) {
                    validationElement.textContent = 'Nomor telepon harus 10-13 digit';
                    validationElement.style.color = 'var(--error-color)';
                }
            }
        });
    }

    // Name validation
    if (nameInput) {
        nameInput.addEventListener('input', function(e) {
            const value = this.value.trim();
            const words = value.split(/\s+/).filter(word => word.length > 0);
            const validationElement = document.getElementById('nameValidation');
            
            if (words.length >= 2) {
                this.style.borderColor = 'var(--success-color)';
                if (validationElement) {
                    validationElement.textContent = '✓ Nama lengkap valid';
                    validationElement.style.color = 'var(--success-color)';
                }
            } else {
                this.style.borderColor = 'var(--error-color)';
                if (validationElement) {
                    validationElement.textContent = 'Minimal 2 kata (nama lengkap)';
                    validationElement.style.color = 'var(--error-color)';
                }
            }
        });
    }

    // Date validation
    if (dateInput) {
        dateInput.addEventListener('change', function(e) {
            const selectedDate = new Date(this.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const validationElement = document.getElementById('dateValidation');
            
            if (selectedDate < today) {
                this.style.borderColor = 'var(--error-color)';
                if (validationElement) {
                    validationElement.textContent = 'Tidak bisa memilih tanggal yang sudah lewat';
                    validationElement.style.color = 'var(--error-color)';
                }
            } else {
                this.style.borderColor = 'var(--success-color)';
                if (validationElement) {
                    validationElement.textContent = '✓ Tanggal valid';
                    validationElement.style.color = 'var(--success-color)';
                }
            }
        });
    }

    // Real-time validation for all fields
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() !== '' && this.checkValidity()) {
                this.style.borderColor = 'var(--success-color)';
            } else if (this.checkValidity() === false) {
                this.style.borderColor = 'var(--error-color)';
            }
        });
    });
}

function goBackToServiceSelection() {
    const selectedData = selectedServiceData || {};
    
    if (selectedData.serviceId) {
        showServiceDetail(selectedData.serviceId);
    } else {
        modalManager.closeAll();
    }
}

// ===== SUBMIT BOOKING TO API =====
async function submitBookingForm() {
    const form = document.getElementById('patientBookingForm');
    if (!form) return;

    const formData = new FormData(form);
    const selectedData = selectedServiceData || {};
    
    if (!validateBookingForm(formData)) {
        return;
    }
    
    // Prepare data for API
    const bookingPayload = {
        patient_name: formData.get('patientName'),
        patient_phone: formData.get('patientPhone'),
        patient_address: formData.get('patientAddress'),
        patient_notes: formData.get('patientNotes') || 'Tidak ada catatan',
        appointment_date: formData.get('appointmentDate'),
        appointment_time: formData.get('appointmentTime'),
        selected_services: selectedData.selectedOptions
    };
    
    try {
        // Show loading
        showNotification('⏳ Menyimpan booking...', 'info');
        
        // Call API
        const response = await window.apiCall(window.API_CONFIG.ENDPOINTS.BOOKINGS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingPayload)
        });
        
        if (response.success) {
            showBookingConfirmation(response.data);
            selectedServiceData = null;
        } else {
            throw new Error(response.message || 'Gagal menyimpan booking');
        }
        
    } catch (error) {
        console.error('Error saving booking:', error);
        showNotification('❌ ' + error.message, 'error');
    }
}

function validateBookingForm(formData) {
    const name = formData.get('patientName');
    const phone = formData.get('patientPhone');
    const address = formData.get('patientAddress');
    const date = formData.get('appointmentDate');
    const time = formData.get('appointmentTime');
    
    if (!name || !phone || !address || !date || !time) {
        showNotification('Harap lengkapi semua field yang wajib diisi', 'error');
        return false;
    }
    
    const nameWords = name.trim().split(/\s+/);
    if (nameWords.length < 2) {
        showNotification('Harap masukkan nama lengkap (minimal 2 kata)', 'error');
        return false;
    }
    
    if (phone.length < 10 || phone.length > 13) {
        showNotification('Nomor telepon harus 10-13 digit', 'error');
        return false;
    }
    
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showNotification('Tidak bisa memilih tanggal yang sudah lewat', 'error');
        return false;
    }
    
    return true;
}

function showBookingConfirmation(bookingData) {
    const appointmentDate = new Date(bookingData.appointment_datetime);
    const formattedDate = appointmentDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const servicesHTML = bookingData.booking_services ? bookingData.booking_services.map(service => `
        <div class="detail-item">
            <span><strong>${service.service_name}</strong></span>
            <span>${service.service_price}</span>
        </div>
    `).join('') : '';
    
    const content = `
        <div class="confirmation-modal">
            <div class="confirmation-icon">✅</div>
            <h2>Booking Berhasil!</h2>
            
            <div class="confirmation-details">
                <div class="detail-item">
                    <strong>Nomor Booking:</strong>
                    <span>${bookingData.id}</span>
                </div>
                <div class="detail-item">
                    <strong>Nama Pasien:</strong>
                    <span>${bookingData.patient_name}</span>
                </div>
                <div class="detail-item">
                    <strong>Telepon:</strong>
                    <span>${bookingData.patient_phone}</span>
                </div>
                ${servicesHTML}
                <div class="detail-item">
                    <strong>Tanggal & Jam:</strong>
                    <span>${formattedDate}, ${bookingData.appointment_time}</span>
                </div>
                <div class="detail-item">
                    <strong>Status:</strong>
                    <span class="status-pending">Menunggu Konfirmasi</span>
                </div>
            </div>
            
            <div class="confirmation-message">
                <p>📞 <strong>Konfirmasi Booking:</strong> Kami akan menghubungi Anda di <strong>${bookingData.patient_phone}</strong> 
                   dalam 1x24 jam untuk konfirmasi jadwal.</p>
                
                <div class="whatsapp-contact">
                    <p>💬 <strong>Butuh Bantuan Cepat?</strong></p>
                    <p>Hubungi kami via WhatsApp:</p>
                    <div class="whatsapp-number">
                        <button class="whatsapp-btn large" onclick="contactViaWhatsApp('${bookingData.id}')">
                            <i class="fa-brands fa-whatsapp"></i>
                            6281381223811
                        </button>
                    </div>
                    <small>Klik tombol di atas untuk chat langsung via WhatsApp</small>
                </div>
                
                <p>📍 <strong>Ketentuan:</strong> Pastikan Anda datang 15 menit sebelum jadwal perawatan.</p>
                <p>💳 <strong>Pembayaran:</strong> Siapkan pembayaran sesuai dengan layanan yang dipilih.</p>
                <p>📝 <strong>Catatan:</strong> ${bookingData.patient_notes}</p>
            </div>
            
            <div class="confirmation-actions">
                <button class="cta-button whatsapp-btn" onclick="contactViaWhatsApp('${bookingData.id}')">
                    <i class="fa-brands fa-whatsapp"></i> Hubungi via WhatsApp
                </button>
                <button class="cta-button" onclick="modalManager.closeAll(); showNotification('Terima kasih telah membooking layanan kami!', 'success')">
                    <i class="fas fa-check"></i> Tutup & Selesai
                </button>
            </div>
        </div>
    `;

    const modalContent = document.getElementById('serviceModalContent');
    if (modalContent) {
        modalContent.innerHTML = content;
    }
}

// ===== PHASE 2: ENHANCED FEATURES =====

// ===== CHECK BOOKING STATUS =====
function showCheckBookingModal() {
    const content = `
        <div class="booking-form-modal">
            <div class="booking-header">
                <h2><i class="fas fa-search me-2"></i>Cek Status Booking</h2>
                <p class="form-description">Masukkan nomor booking Anda untuk mengecek status</p>
            </div>
            
            <form id="checkBookingForm" class="booking-form">
                <div class="form-group">
                    <label for="checkBookingId">Nomor Booking *</label>
                    <input type="text" id="checkBookingId" name="checkBookingId" required 
                           placeholder="Contoh: BK1234567890ABCDEF"
                           pattern="BK[0-9A-Z]+"
                           style="text-transform: uppercase;">
                    <small class="form-hint">Format: BK diikuti angka dan huruf (contoh: BK1234567890ABCDEF)</small>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="cta-button secondary" onclick="modalManager.closeAll()">
                        <i class="fas fa-times"></i> Batal
                    </button>
                    <button type="submit" class="cta-button">
                        <i class="fas fa-search"></i> Cek Status
                    </button>
                </div>
            </form>
        </div>
    `;
    
    const modalContent = document.getElementById('checkBookingContent');
    if (modalContent) {
        modalContent.innerHTML = content;
        modalManager.openModal('checkBookingModal');
        
        // Setup form submission
        const form = document.getElementById('checkBookingForm');
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                const bookingId = document.getElementById('checkBookingId').value.trim().toUpperCase();
                await checkBookingStatus(bookingId);
            });
        }
    }
}

async function checkBookingStatus(bookingId) {
    try {
        showNotification('⏳ Mengecek status booking...', 'info');
        
        const response = await apiCall(API_CONFIG.ENDPOINTS.BOOKING_CHECK(bookingId));
        
        if (response.success && response.data) {
            displayBookingStatus(response.data);
        } else {
            throw new Error(response.message || 'Booking tidak ditemukan');
        }
        
    } catch (error) {
        console.error('Error checking booking:', error);
        showNotification('❌ ' + error.message, 'error');
    }
}

function displayBookingStatus(booking) {
    const appointmentDate = new Date(booking.appointment_datetime);
    const formattedDate = appointmentDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const servicesHTML = booking.booking_services ? booking.booking_services.map(service => `
        <div class="service-summary-item">
            <div>
                <strong>${service.service_name}</strong>
            </div>
            <span class="service-price">${service.service_price}</span>
        </div>
    `).join('') : '';
    
    // Determine timeline status
    const statusMap = {
        'pending': { step: 1, text: 'Menunggu Konfirmasi', icon: 'clock', color: '#f39c12' },
        'confirmed': { step: 2, text: 'Dikonfirmasi', icon: 'check-circle', color: '#27ae60' },
        'completed': { step: 3, text: 'Selesai', icon: 'check-double', color: '#27ae60' },
        'cancelled': { step: 0, text: 'Dibatalkan', icon: 'times-circle', color: '#e74c3c' }
    };
    
    const currentStatus = statusMap[booking.status] || statusMap['pending'];
    
    const content = `
        <div class="booking-form-modal">
            <div class="booking-header">
                <h2><i class="fas fa-info-circle me-2"></i>Status Booking</h2>
                <p class="booking-id">Nomor Booking: <strong>${booking.id}</strong></p>
            </div>
            
            ${booking.status !== 'cancelled' ? `
            <div class="status-timeline">
                <div class="timeline-step ${currentStatus.step >= 1 ? 'completed' : ''}">
                    <div class="timeline-icon">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="timeline-label">Booking Dibuat</div>
                </div>
                
                <div class="timeline-step ${currentStatus.step >= 2 ? 'active' : ''} ${currentStatus.step > 2 ? 'completed' : ''}">
                    <div class="timeline-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="timeline-label">Dikonfirmasi</div>
                </div>
                
                <div class="timeline-step ${currentStatus.step >= 3 ? 'active' : ''}">
                    <div class="timeline-icon">
                        <i class="fas fa-check-double"></i>
                    </div>
                    <div class="timeline-label">Selesai</div>
                </div>
            </div>
            ` : `
            <div class="alert alert-danger" style="margin: 1rem 0; padding: 1rem; border-radius: 8px; background: #ffeaea; border-left: 4px solid #e74c3c;">
                <i class="fas fa-times-circle me-2"></i>
                <strong>Booking Dibatalkan</strong>
            </div>
            `}
            
            <div class="booking-details" style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0;">
                <h4 style="margin-bottom: 1rem; color: var(--text-dark);">
                    <i class="fas fa-user me-2"></i>Informasi Pasien
                </h4>
                <div class="detail-row">
                    <span class="detail-label">Nama:</span>
                    <span class="detail-value">${booking.patient_name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Telepon:</span>
                    <span class="detail-value">${booking.patient_phone}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Alamat:</span>
                    <span class="detail-value">${booking.patient_address}</span>
                </div>
            </div>
            
            <div class="booking-details" style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0;">
                <h4 style="margin-bottom: 1rem; color: var(--text-dark);">
                    <i class="fas fa-calendar-alt me-2"></i>Jadwal Perawatan
                </h4>
                <div class="detail-row">
                    <span class="detail-label">Tanggal:</span>
                    <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Jam:</span>
                    <span class="detail-value">${booking.appointment_time}</span>
                </div>
            </div>
            
            <div class="booking-details" style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0;">
                <h4 style="margin-bottom: 1rem; color: var(--text-dark);">
                    <i class="fas fa-concierge-bell me-2"></i>Layanan
                </h4>
                ${servicesHTML}
            </div>
            
            ${booking.patient_notes && booking.patient_notes !== 'Tidak ada catatan' ? `
            <div class="booking-details" style="background: #fff3e0; padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0;">
                <h4 style="margin-bottom: 0.5rem; color: var(--text-dark);">
                    <i class="fas fa-sticky-note me-2"></i>Catatan
                </h4>
                <p style="margin: 0; color: var(--text-light);">${booking.patient_notes}</p>
            </div>
            ` : ''}
            
            <div class="form-actions" style="margin-top: 2rem;">
                ${booking.status === 'pending' || booking.status === 'confirmed' ? `
                <button type="button" class="cta-button secondary" onclick="showRescheduleModal('${booking.id}', '${booking.patient_phone}')">
                    <i class="fas fa-calendar-alt"></i> Reschedule
                </button>
                ` : ''}
                <button type="button" class="cta-button" onclick="downloadBookingPDF('${booking.id}')">
                    <i class="fas fa-download"></i> Download Bukti
                </button>
                <button type="button" class="cta-button" onclick="contactViaWhatsApp('${booking.id}')">
                    <i class="fa-brands fa-whatsapp"></i> Hubungi Klinik
                </button>
            </div>
        </div>
    `;
    
    const modalContent = document.getElementById('checkBookingContent');
    if (modalContent) {
        modalContent.innerHTML = content;
    }
}

// ===== BOOKING HISTORY =====
function showBookingHistoryModal() {
    const content = `
        <div class="booking-form-modal">
            <div class="booking-header">
                <h2><i class="fas fa-history me-2"></i>Riwayat Booking</h2>
                <p class="form-description">Masukkan nomor telepon untuk melihat riwayat booking Anda</p>
            </div>
            
            <form id="bookingHistoryForm" class="booking-form">
                <div class="form-group">
                    <label for="historyPhone">Nomor Telepon *</label>
                    <input type="tel" id="historyPhone" name="historyPhone" required 
                           placeholder="Contoh: 081234567890"
                           pattern="[0-9]{10,13}">
                    <small class="form-hint">Masukkan nomor telepon yang Anda gunakan saat booking</small>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="cta-button secondary" onclick="modalManager.closeAll()">
                        <i class="fas fa-times"></i> Batal
                    </button>
                    <button type="submit" class="cta-button">
                        <i class="fas fa-search"></i> Lihat Riwayat
                    </button>
                </div>
            </form>
        </div>
    `;
    
    const modalContent = document.getElementById('bookingHistoryContent');
    if (modalContent) {
        modalContent.innerHTML = content;
        modalManager.openModal('bookingHistoryModal');
        
        // Setup form submission
        const form = document.getElementById('bookingHistoryForm');
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                const phone = document.getElementById('historyPhone').value.trim();
                await loadBookingHistory(phone);
            });
        }
    }
}

async function loadBookingHistory(phone, status = 'all') {
    try {
        showNotification('⏳ Memuat riwayat booking...', 'info');
        
        const endpoint = status === 'all' 
            ? API_CONFIG.ENDPOINTS.BOOKING_HISTORY(phone)
            : API_CONFIG.ENDPOINTS.BOOKING_HISTORY(phone) + `?status=${status}`;
        
        const response = await apiCall(endpoint);
        
        if (response.success) {
            displayBookingHistory(response.data, phone, status);
        } else {
            throw new Error(response.message || 'Gagal memuat riwayat booking');
        }
        
    } catch (error) {
        console.error('Error loading booking history:', error);
        showNotification('❌ ' + error.message, 'error');
    }
}

function displayBookingHistory(bookings, phone, currentFilter = 'all') {
    const content = `
        <div class="booking-form-modal">
            <div class="booking-header">
                <h2><i class="fas fa-history me-2"></i>Riwayat Booking</h2>
                <p class="form-description">Nomor Telepon: <strong>${phone}</strong></p>
                <p class="form-description">Total: <strong>${bookings.length}</strong> booking</p>
            </div>
            
            <div class="filter-buttons">
                <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" 
                        onclick="loadBookingHistory('${phone}', 'all')">
                    <i class="fas fa-list"></i> Semua
                </button>
                <button class="filter-btn ${currentFilter === 'pending' ? 'active' : ''}" 
                        onclick="loadBookingHistory('${phone}', 'pending')">
                    <i class="fas fa-clock"></i> Menunggu
                </button>
                <button class="filter-btn ${currentFilter === 'confirmed' ? 'active' : ''}" 
                        onclick="loadBookingHistory('${phone}', 'confirmed')">
                    <i class="fas fa-check-circle"></i> Dikonfirmasi
                </button>
                <button class="filter-btn ${currentFilter === 'completed' ? 'active' : ''}" 
                        onclick="loadBookingHistory('${phone}', 'completed')">
                    <i class="fas fa-check-double"></i> Selesai
                </button>
                <button class="filter-btn ${currentFilter === 'cancelled' ? 'active' : ''}" 
                        onclick="loadBookingHistory('${phone}', 'cancelled')">
                    <i class="fas fa-times-circle"></i> Dibatalkan
                </button>
            </div>
            
            <div class="booking-history-list">
                ${bookings.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-calendar-times"></i>
                        <h3>Tidak Ada Booking</h3>
                        <p>Tidak ada riwayat booking untuk nomor telepon ini</p>
                        <button class="cta-button" onclick="modalManager.closeAll(); showQuickBooking()">
                            <i class="fas fa-plus"></i> Buat Booking Baru
                        </button>
                    </div>
                ` : bookings.map(booking => {
                    const appointmentDate = new Date(booking.appointment_datetime);
                    const formattedDate = appointmentDate.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    });
                    
                    const statusMap = {
                        'pending': { text: 'Menunggu', class: 'status-pending', icon: 'clock' },
                        'confirmed': { text: 'Dikonfirmasi', class: 'status-confirmed', icon: 'check-circle' },
                        'completed': { text: 'Selesai', class: 'status-completed', icon: 'check-double' },
                        'cancelled': { text: 'Dibatalkan', class: 'status-cancelled', icon: 'times-circle' }
                    };
                    
                    const status = statusMap[booking.status] || statusMap['pending'];
                    
                    return `
                        <div class="booking-history-item">
                            <div class="booking-header">
                                <div class="booking-id">${booking.id}</div>
                                <span class="status-badge ${status.class}">
                                    <i class="fas fa-${status.icon}"></i> ${status.text}
                                </span>
                            </div>
                            <div class="booking-info">
                                <div class="info-row">
                                    <i class="fas fa-calendar-alt"></i>
                                    <span>${formattedDate} • ${booking.appointment_time}</span>
                                </div>
                                <div class="info-row">
                                    <i class="fas fa-concierge-bell"></i>
                                    <span>${booking.booking_services?.[0]?.service_name || 'N/A'}</span>
                                </div>
                            </div>
                            <div class="booking-actions">
                                <button class="cta-button secondary btn-sm" onclick="checkBookingStatus('${booking.id}')">
                                    <i class="fas fa-eye"></i> Detail
                                </button>
                                ${booking.status === 'pending' || booking.status === 'confirmed' ? `
                                <button class="cta-button btn-sm" onclick="showRescheduleModal('${booking.id}', '${phone}')">
                                    <i class="fas fa-calendar-alt"></i> Reschedule
                                </button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="form-actions" style="margin-top: 2rem;">
                <button type="button" class="cta-button secondary" onclick="showBookingHistoryModal()">
                    <i class="fas fa-arrow-left"></i> Cari Nomor Lain
                </button>
                <button type="button" class="cta-button" onclick="modalManager.closeAll(); showQuickBooking()">
                    <i class="fas fa-plus"></i> Booking Baru
                </button>
            </div>
        </div>
    `;
    
    const modalContent = document.getElementById('bookingHistoryContent');
    if (modalContent) {
        modalContent.innerHTML = content;
    }
}

// ===== RESCHEDULE BOOKING =====
function showRescheduleModal(bookingId, phone) {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
    
    const timeOptions = generateTimeOptions();
    
    const content = `
        <div class="booking-form-modal">
            <div class="booking-header">
                <h2><i class="fas fa-calendar-alt me-2"></i>Reschedule Booking</h2>
                <p class="form-description">Nomor Booking: <strong>${bookingId}</strong></p>
                <p class="form-description">Pilih tanggal dan jam baru untuk perawatan Anda</p>
            </div>
            
            <form id="rescheduleForm" class="booking-form">
                <input type="hidden" id="rescheduleBookingId" value="${bookingId}">
                <input type="hidden" id="reschedulePhone" value="${phone}">
                
                <div class="form-group">
                    <label for="rescheduleDate">Tanggal Baru *</label>
                    <input type="date" id="rescheduleDate" name="rescheduleDate" 
                           min="${today}" value="${tomorrowFormatted}" required>
                    <small class="form-hint">Pilih tanggal mulai hari ini</small>
                </div>
                
                <div class="form-group">
                    <label for="rescheduleTime">Jam Baru *</label>
                    <select id="rescheduleTime" name="rescheduleTime" required>
                        <option value="">Pilih Jam</option>
                        ${timeOptions}
                    </select>
                    <small class="form-hint">Jam praktik: 08:00 - 17:00</small>
                </div>
                
                <div class="alert alert-info" style="margin: 1rem 0; padding: 1rem; border-radius: 8px; background: #e3f2fd; border-left: 4px solid #2196f3;">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Catatan:</strong> Setelah reschedule, status booking akan kembali menjadi "Menunggu Konfirmasi". 
                    Tim kami akan menghubungi Anda untuk konfirmasi jadwal baru.
                </div>
                
                <div class="form-actions">
                    <button type="button" class="cta-button secondary" onclick="checkBookingStatus('${bookingId}')">
                        <i class="fas fa-arrow-left"></i> Kembali
                    </button>
                    <button type="submit" class="cta-button">
                        <i class="fas fa-save"></i> Simpan Jadwal Baru
                    </button>
                </div>
            </form>
        </div>
    `;
    
    const modalContent = document.getElementById('checkBookingContent');
    if (modalContent) {
        modalContent.innerHTML = content;
        modalManager.openModal('checkBookingModal');
        
        // Setup form submission
        const form = document.getElementById('rescheduleForm');
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                await submitReschedule();
            });
        }
    }
}

async function submitReschedule() {
    try {
        const bookingId = document.getElementById('rescheduleBookingId').value;
        const phone = document.getElementById('reschedulePhone').value;
        const date = document.getElementById('rescheduleDate').value;
        const time = document.getElementById('rescheduleTime').value;
        
        if (!date || !time) {
            showNotification('Harap pilih tanggal dan jam', 'error');
            return;
        }
        
        showNotification('⏳ Menyimpan jadwal baru...', 'info');
        
        const response = await apiCall(API_CONFIG.ENDPOINTS.BOOKING_RESCHEDULE(bookingId), {
            method: 'PUT',
            body: JSON.stringify({
                appointment_date: date,
                appointment_time: time,
                patient_phone: phone
            })
        });
        
        if (response.success) {
            showNotification('✅ Jadwal berhasil diubah! Tim kami akan menghubungi Anda untuk konfirmasi.', 'success');
            setTimeout(() => {
                checkBookingStatus(bookingId);
            }, 1500);
        } else {
            throw new Error(response.message || 'Gagal reschedule booking');
        }
        
    } catch (error) {
        console.error('Error rescheduling:', error);
        showNotification('❌ ' + error.message, 'error');
    }
}

// ===== DOWNLOAD BOOKING PDF =====
function downloadBookingPDF(bookingId) {
    showNotification('⏳ Mempersiapkan bukti booking...', 'info');
    
    // Open print dialog for the booking
    // In a real implementation, this would generate a proper PDF
    // For now, we'll use the browser's print functionality
    
    setTimeout(async () => {
        try {
            const response = await apiCall(API_CONFIG.ENDPOINTS.BOOKING_CHECK(bookingId));
            
            if (response.success && response.data) {
                const booking = response.data;
                printBookingReceipt(booking);
            } else {
                throw new Error('Gagal memuat data booking');
            }
        } catch (error) {
            console.error('Error downloading PDF:', error);
            showNotification('❌ ' + error.message, 'error');
        }
    }, 500);
}

function printBookingReceipt(booking) {
    const appointmentDate = new Date(booking.appointment_datetime);
    const formattedDate = appointmentDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const servicesHTML = booking.booking_services ? booking.booking_services.map(service => `
        <div style="background: #f9f9f9; padding: 12px; margin: 8px 0; border-radius: 8px; border-left: 4px solid #3498db;">
            <div style="font-weight: bold; font-size: 14px;">${service.service_name}</div>
            <div style="color: #666; font-size: 13px;">${service.service_price}</div>
        </div>
    `).join('') : '';
    
    const statusMap = {
        'pending': 'Menunggu Konfirmasi',
        'confirmed': 'Dikonfirmasi',
        'completed': 'Selesai',
        'cancelled': 'Dibatalkan'
    };
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showNotification('Tidak dapat membuka jendela print. Pastikan pop-up diizinkan.', 'error');
        return;
    }
    
    const printContent = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>Bukti Booking - ${booking.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.6; color: #333; }
                    .header { text-align: center; border-bottom: 4px solid #3498db; padding-bottom: 20px; margin-bottom: 30px; }
                    .details { margin: 30px 0; }
                    .detail-item { margin: 15px 0; padding: 12px 0; border-bottom: 2px solid #eee; display: flex; justify-content: space-between; font-size: 14px; }
                    .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; padding-top: 20px; border-top: 2px solid #ddd; }
                    .status { background: #fff3e0; color: #f39c12; padding: 6px 15px; border-radius: 25px; font-weight: bold; font-size: 12px; border: 2px solid #f39c12; display: inline-block; }
                    .qr-code { text-align: center; margin: 20px 0; }
                    @media print { 
                        body { margin: 20px; }
                        .header { border-bottom-color: #000; }
                        .footer { page-break-inside: avoid; }
                    }
                    @page { margin: 1cm; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 style="margin: 0; color: #3498db; font-size: 28px;">Alra Care</h1>
                    <h2 style="margin: 10px 0; color: #333; font-size: 22px;">Bukti Booking</h2>
                    <p style="margin: 0; color: #666; font-size: 16px;">Kesehatan & Kecantikan Profesional</p>
                </div>
                
                <div class="qr-code">
                    <p style="font-size: 12px; color: #666; margin-bottom: 10px;">Scan untuk cek status booking</p>
                    <div style="display: inline-block; padding: 20px; border: 2px solid #ddd; border-radius: 10px;">
                        <div style="font-size: 48px; font-weight: bold; color: #3498db;">${booking.id}</div>
                    </div>
                </div>
                
                <div class="details">
                    <div class="detail-item"><strong>Nomor Booking:</strong> <span>${booking.id}</span></div>
                    <div class="detail-item"><strong>Status:</strong> <span class="status">${statusMap[booking.status] || 'Menunggu'}</span></div>
                    <div class="detail-item"><strong>Nama Pasien:</strong> <span>${booking.patient_name}</span></div>
                    <div class="detail-item"><strong>Telepon:</strong> <span>${booking.patient_phone}</span></div>
                    <div class="detail-item"><strong>Alamat:</strong> <span>${booking.patient_address}</span></div>
                    <div class="detail-item"><strong>Tanggal Perawatan:</strong> <span>${formattedDate}</span></div>
                    <div class="detail-item"><strong>Jam Perawatan:</strong> <span>${booking.appointment_time}</span></div>
                    <div class="detail-item" style="border-bottom: none;">
                        <strong>Layanan:</strong>
                    </div>
                    ${servicesHTML}
                    ${booking.patient_notes && booking.patient_notes !== 'Tidak ada catatan' ? `
                    <div class="detail-item"><strong>Catatan:</strong> <span>${booking.patient_notes}</span></div>
                    ` : ''}
                    <div class="detail-item"><strong>Tanggal Booking:</strong> <span>${new Date(booking.created_at).toLocaleString('id-ID')}</span></div>
                </div>
                
                <div class="footer">
                    <p style="font-weight: bold; font-size: 14px;">⚠️ PENTING</p>
                    <p>✓ Harap datang 15 menit sebelum jadwal perawatan</p>
                    <p>✓ Bawa bukti booking ini saat datang ke klinik</p>
                    <p>✓ Untuk reschedule atau pembatalan, hubungi kami minimal 24 jam sebelumnya</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-weight: bold;">Terima kasih atas kepercayaan Anda kepada Alra Care</p>
                    <p>📍 Jl. Akcaya, Pontianak • 📞 0813-8122-3811</p>
                    <p>🌐 www.alracare.com • ✉️ rahmadramadhanaswin@gmail.com</p>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 1000);
                    };
                </script>
            </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    showNotification('✅ Bukti booking siap dicetak!', 'success');
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (notification && notificationText) {
        notificationText.textContent = message;
        
        // Set styles based on type
        if (type === 'error') {
            notification.style.borderLeftColor = 'var(--error-color)';
            notification.style.background = '#ffeaea';
        } else if (type === 'success') {
            notification.style.borderLeftColor = 'var(--success-color)';
            notification.style.background = '#f0f9f0';
        } else if (type === 'warning') {
            notification.style.borderLeftColor = 'var(--warning-color)';
            notification.style.background = '#fff3e0';
        } else {
            notification.style.borderLeftColor = 'var(--primary-color)';
            notification.style.background = '#f0f9f0';
        }
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
}

// ===== NAVIGATION FUNCTIONS =====
function scrollToServices() {
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
        servicesSection.scrollIntoView({
            behavior: 'smooth'
        });
    }
    modalManager.closeAll();
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Alra Care Public Website initialized successfully!');
    
    loadFallbackServices();
    
    try {
        clearOldCaches();
        await loadServicesFromAPI();
        loadGalleryFromAPI();
        
        console.log('Services loaded successfully');
    } catch (error) {
        console.error('Error during initialization:', error);
        showNotification('⚠️ Terjadi error saat memuat halaman. Beberapa fitur mungkin tidak berfungsi dengan baik.', 'warning');
        // Continue with fallback services
        loadFallbackServices();
        hideLoadingIndicator();
    }
    
    // Smooth scroll untuk anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            if (href === '#admin' || href === '#') return;
            
            e.preventDefault();
            
            const targetElement = document.querySelector(href);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Close mobile menu if open
                const hamburger = document.querySelector('.hamburger');
                const navMenu = document.querySelector('.nav-menu');
                if (hamburger && navMenu) {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            }
        });
    });

    // Mobile Navigation
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                if (hamburger && navMenu) {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            });
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modalManager.closeAll();
            }
        });
    });

    // Escape key to close modal
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            modalManager.closeAll();
        }
    });

    // Add CSS for validation messages
    const style = document.createElement('style');
    style.textContent = `
        .validation-message {
            font-size: 0.875rem;
            margin-top: 0.25rem;
            min-height: 1.25rem;
        }
        .option-category {
            display: inline-block;
            background: var(--primary-light);
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.875rem;
            margin-top: 0.5rem;
        }
        .quick-booking-options {
            margin: 2rem 0;
        }
        .quick-service-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        .quick-service-card {
            background: white;
            padding: 2rem;
            border-radius: var(--border-radius);
            text-align: center;
            box-shadow: var(--shadow);
            transition: var(--transition);
            cursor: pointer;
        }
        .quick-service-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-hover);
        }
        .quick-service-icon {
            font-size: 3rem;
            color: var(--primary-color);
            margin-bottom: 1rem;
        }
        .quick-service-card h4 {
            margin-bottom: 0.5rem;
            color: var(--text-dark);
        }
        .quick-service-card p {
            color: var(--text-light);
            margin-bottom: 1.5rem;
        }
    `;
    document.head.appendChild(style);
});

// Export functions for global access
window.showCheckBookingModal = showCheckBookingModal;
window.checkBookingStatus = checkBookingStatus;
window.showBookingHistoryModal = showBookingHistoryModal;
window.loadBookingHistory = loadBookingHistory;
window.showRescheduleModal = showRescheduleModal;
window.downloadBookingPDF = downloadBookingPDF;
window.contactViaWhatsApp = contactViaWhatsApp;
window.showServiceDetail = showServiceDetail;
window.showQuickBooking = showQuickBooking;
window.scrollToServices = scrollToServices;
window.modalManager = modalManager;
window.showLoadingIndicator = showLoadingIndicator;
window.hideLoadingIndicator = hideLoadingIndicator;

console.log('✅ Combined public script loaded: API + Enhanced Features');
