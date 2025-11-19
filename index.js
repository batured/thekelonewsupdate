import { fetchRealtimeNews } from './services/geminiService.js';

// --- State Management ---
const state = {
  articles: [],
  groundingMetadata: null,
  loading: true,
  error: null,
  category: 'All',
  sidebarOpen: false,
  lastUpdated: null
};

const categories = [
  { id: 'All', label: 'Top Stories', icon: 'home' },
  { id: 'Politics', label: 'Politics', icon: 'globe' },
  { id: 'Business', label: 'Business', icon: 'trending-up' },
  { id: 'Sports', label: 'Sports', icon: 'activity' },
  { id: 'Tech', label: 'Technology', icon: 'cpu' },
  { id: 'Entertainment', label: 'Entertainment', icon: 'film' },
];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  renderShell();
  loadNews();
  setupEventListeners();
  
  // Poll for updates every 5 minutes
  setInterval(loadNews, 300000);
});

// --- Actions ---
async function loadNews() {
  setState({ loading: true, error: null });
  updateMainContent(); // Show loading state

  try {
    const response = await fetchRealtimeNews();
    if (response.error) {
      setState({ loading: false, error: response.error });
    } else {
      setState({
        loading: false,
        articles: response.articles,
        groundingMetadata: response.groundingMetadata,
        lastUpdated: new Date()
      });
    }
  } catch (e) {
    setState({ loading: false, error: "Failed to connect to service." });
  }
  updateMainContent();
  updateTicker();
}

function setState(newState) {
  Object.assign(state, newState);
}

function handleCategorySelect(catId) {
  setState({ category: catId, sidebarOpen: false });
  updateSidebar();
  updateMainContent();
}

// --- Rendering ---

function renderShell() {
  const root = document.getElementById('root');
  root.innerHTML = `
    ${getHeaderHTML()}
    <div id="ticker-container"></div>
    <div class="flex-1 max-w-7xl w-full mx-auto flex relative">
      ${getSidebarHTML()}
      <main id="main-content" class="flex-1 p-4 sm:p-6 lg:p-8 overflow-hidden w-full"></main>
    </div>
  `;
  lucide.createIcons();
}

function updateSidebar() {
  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.outerHTML = getSidebarHTML();
    lucide.createIcons();
  }
}

function updateTicker() {
  const container = document.getElementById('ticker-container');
  const breakingNews = state.articles.filter(a => a.isBreaking);
  
  if (breakingNews.length > 0) {
    container.innerHTML = `
      <div class="ticker-wrap shadow-sm border-b border-emerald-800">
        <div class="ticker">
           ${breakingNews.map(a => `<div class="ticker__item">BREAKING: ${a.headline}</div>`).join('')}
        </div>
      </div>
    `;
  } else {
    container.innerHTML = '';
  }
}

function updateMainContent() {
  const main = document.getElementById('main-content');
  
  const filteredArticles = state.category === 'All'
    ? state.articles
    : state.articles.filter(a => a.category?.toLowerCase().includes(state.category.toLowerCase()));

  let contentHtml = `
    <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      <div>
         <h2 class="text-2xl font-serif font-bold text-gray-900">
           ${state.category === 'All' ? 'Latest Headlines' : `${state.category} News`}
         </h2>
         <p class="text-sm text-gray-500 mt-1 flex items-center">
            ${state.lastUpdated ? `Last updated: ${state.lastUpdated.toLocaleTimeString()}` : 'Updating...'}
            <span class="mx-2">•</span>
            <span class="flex items-center gap-1 text-emerald-600 font-medium">
              <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Live Feed
            </span>
         </p>
      </div>
      
      <button id="refresh-btn" class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors ${state.loading ? 'opacity-50 cursor-not-allowed' : ''}" ${state.loading ? 'disabled' : ''}>
        ${state.loading ? '<div class="loader"></div>' : '<i data-lucide="refresh-cw" width="16"></i>'}
        <span class="ml-2">Refresh Feed</span>
      </button>
    </div>
  `;

  if (state.error) {
    contentHtml += `
      <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg flex">
        <i data-lucide="alert-circle" class="text-red-400 mr-3"></i>
        <div>
          <p class="text-sm text-red-700">${state.error}</p>
          <button id="retry-btn" class="mt-2 text-sm font-medium text-red-700 underline">Try again</button>
        </div>
      </div>
    `;
  }

  if (state.loading && state.articles.length === 0) {
    contentHtml += `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${[1, 2, 3, 4, 5, 6].map(() => `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-64 animate-pulse flex flex-col">
           <div class="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
           <div class="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
           <div class="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
           <div class="flex-1 bg-gray-100 rounded mb-4"></div>
           <div class="h-8 bg-gray-200 rounded w-full mt-auto"></div>
        </div>
      `).join('')}
    </div>`;
  } else {
    contentHtml += `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${filteredArticles.map(article => getNewsCardHTML(article)).join('')}
    </div>`;
  }

  // Grounding
  if (state.groundingMetadata && state.groundingMetadata.groundingChunks) {
    contentHtml += `
      <div class="mt-12 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h4 class="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
           <i data-lucide="shield-check" class="text-emerald-600"></i>
           Verified Sources & Grounding
        </h4>
        <div class="flex flex-wrap gap-3">
           ${state.groundingMetadata.groundingChunks.map(chunk => {
             if (!chunk.web?.uri) return '';
             return `
               <a href="${chunk.web.uri}" target="_blank" rel="noopener noreferrer"
                  class="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-emerald-50 rounded-lg text-xs text-gray-600 hover:text-emerald-700 border border-gray-200 transition-colors truncate max-w-xs">
                  <i data-lucide="external-link" width="12"></i>
                  ${chunk.web.title || new URL(chunk.web.uri).hostname}
               </a>
             `;
           }).join('')}
        </div>
      </div>
    `;
  }

  main.innerHTML = contentHtml;
  lucide.createIcons();
}

// --- Component Templates ---

function getHeaderHTML() {
  return `
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center gap-4">
            <button id="menu-btn" class="p-2 rounded-md text-gray-500 hover:text-emerald-600 hover:bg-gray-100 lg:hidden">
              <i data-lucide="menu"></i>
            </button>
            
            <div class="flex-shrink-0 flex items-center gap-2">
              <div class="bg-emerald-600 p-1.5 rounded-lg">
                <i data-lucide="radio" class="text-white"></i>
              </div>
              <span class="font-serif text-2xl font-bold text-emerald-900 tracking-tight">
                Thekelo<span class="text-emerald-600">News</span>
              </span>
            </div>

            <div class="hidden md:flex items-center space-x-8 ml-10">
              <a href="#" class="text-gray-900 font-medium border-b-2 border-emerald-500 px-1 pt-1 text-sm">Top Stories</a>
              <a href="#" class="text-gray-500 hover:text-gray-900 px-1 pt-1 text-sm font-medium">Nigeria</a>
              <a href="#" class="text-gray-500 hover:text-gray-900 px-1 pt-1 text-sm font-medium">World</a>
            </div>
          </div>

          <div class="flex items-center gap-3">
             <div class="hidden sm:flex items-center bg-gray-100 rounded-full px-3 py-1.5">
               <i data-lucide="search" class="text-gray-400" width="18"></i>
               <input type="text" placeholder="Search news..." class="bg-transparent border-none focus:outline-none text-sm ml-2 w-32 lg:w-48 text-gray-700"/>
             </div>
             <button class="p-2 text-gray-500 hover:text-emerald-600 relative">
               <i data-lucide="bell" width="20"></i>
               <span class="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </button>
          </div>
        </div>
      </div>
    </header>
  `;
}

function getSidebarHTML() {
  const overlayClass = state.sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none';
  const sidebarClass = state.sidebarOpen ? 'translate-x-0' : '-translate-x-full';

  return `
    <div id="sidebar-container">
      <!-- Mobile Overlay -->
      <div id="sidebar-overlay" class="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 transition-opacity lg:hidden ${overlayClass}"></div>

      <!-- Sidebar -->
      <div class="fixed inset-y-0 left-0 flex flex-col w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-auto lg:z-0 ${sidebarClass}">
        <div class="h-16 flex items-center px-6 border-b border-gray-200 lg:hidden">
           <span class="font-serif text-xl font-bold text-emerald-900">Thekelo News</span>
        </div>
        
        <div class="flex-1 flex flex-col overflow-y-auto py-4">
          <nav class="px-3 space-y-1">
            ${categories.map(item => {
              const isActive = state.category === item.id;
              return `
                <button data-category="${item.id}" class="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50 hover:text-emerald-600'}">
                  <i data-lucide="${item.icon}" class="mr-3 ${isActive ? 'text-emerald-600' : 'text-gray-400'}" width="20"></i>
                  ${item.label}
                </button>
              `;
            }).join('')}
          </nav>
        </div>
      </div>
    </div>
  `;
}

function getNewsCardHTML(article) {
  const getCategoryColor = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'politics': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'sports': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'business': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'entertainment': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'tech': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col h-full overflow-hidden group">
      <div class="p-5 flex-1 flex flex-col">
        <div class="flex justify-between items-start mb-3">
          <span class="px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${getCategoryColor(article.category)}">
            ${article.category || 'General'}
          </span>
          ${article.isBreaking ? `
            <span class="flex items-center gap-1 text-red-600 text-xs font-bold animate-pulse">
              <span class="w-2 h-2 bg-red-600 rounded-full"></span>
              LIVE
            </span>
          ` : ''}
        </div>
        
        <h3 class="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover:text-emerald-700 transition-colors">
          ${article.headline}
        </h3>
        
        <p class="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
          ${article.summary}
        </p>
        
        <div class="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
          <div class="flex items-center gap-2">
             <div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                ${article.source.substring(0, 1)}
             </div>
             <div class="flex flex-col">
               <span class="text-xs font-semibold text-gray-700 flex items-center gap-1">
                 ${article.source}
                 <i data-lucide="shield-check" width="12" class="text-emerald-500"></i>
               </span>
               <span class="text-[10px] text-gray-400 flex items-center gap-1">
                 <i data-lucide="clock" width="10"></i>
                 Just now
               </span>
             </div>
          </div>
          
          <div class="flex gap-2">
            <button class="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors" title="Share">
              <i data-lucide="share-2" width="16"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// --- Event Listeners ---
function setupEventListeners() {
  const root = document.getElementById('root');

  root.addEventListener('click', (e) => {
    // Menu Button
    if (e.target.closest('#menu-btn')) {
      setState({ sidebarOpen: !state.sidebarOpen });
      updateSidebar();
    }

    // Sidebar Overlay
    if (e.target.closest('#sidebar-overlay')) {
      setState({ sidebarOpen: false });
      updateSidebar();
    }

    // Category Buttons
    const categoryBtn = e.target.closest('button[data-category]');
    if (categoryBtn) {
      const cat = categoryBtn.dataset.category;
      handleCategorySelect(cat);
    }

    // Refresh Button
    if (e.target.closest('#refresh-btn') || e.target.closest('#retry-btn')) {
      loadNews();
    }
  });
}
