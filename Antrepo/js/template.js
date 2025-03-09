// Config kontrolü
if (!window.APP_CONFIG) {
    console.error('Config yüklenemedi!');
}

document.addEventListener('DOMContentLoaded', function() {
    window.apiHeaders = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    };
});

// Token doğrulama fonksiyonu
async function validateToken(token) {
    try {
        const response = await fetch('/api/auth/validate', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Token geçersiz');
        }

        return true;
    } catch (error) {
        console.error('Token validation error:', error);
        throw error;
    }
}

class Template {
    constructor() {
        const path = window.location.pathname;
        this.rootPath = path.includes('/pages/') ? '../' : './';
        
        // Header şablonu: Logo sol, search ve user icon sağa hizalı
        this.headerTemplate = `
            <header class="topbar">
                <div class="topbar-left">
                    <span class="logo">ANTREPO</span>
                </div>
                <div class="topbar-right">
                    <input type="text" placeholder="Ara..." class="topbar-search">
                    <img src="${this.rootPath}assets/user-icon.png" alt="User Icon" class="topbar-user-icon">
                </div>
            </header>
        `;
        
        // Updated sidebar template: add divider before "Admin Paneli"
        this.sidebarTemplate = `

        <div class="sidebar">
            <ul class="sidebar-section section-1">
                <li><a href="${this.rootPath}index.html"><i class="fas fa-home"></i> Anasayfa</a></li>
                <li><a href="${this.rootPath}pages/antrepo-giris-formu.html"><i class="fas fa-file-import"></i> Antrepo Giriş Formu</a></li>
                <li><a href="${this.rootPath}pages/antrepo-giris-form-list.html"><i class="fas fa-list"></i> Antrepo Giriş Formları</a></li>
                <li><a href="${this.rootPath}pages/maliyet-analizi-index.html"><i class="fas fa-list"></i>   Maliyet analizi</a></li>
                <li><a href="${this.rootPath}pages/antrepo-list.html"><i class="fas fa-warehouse"></i> Antrepolar</a></li>
                <li><a href="${this.rootPath}pages/company-list.html"><i class="fas fa-building"></i> Antrepo Şirketleri</a></li>
                <li><a href="${this.rootPath}pages/product-list.html"><i class="fas fa-building"></i> Ürünler</a></li>
                <li><a href="${this.rootPath}pages/customs-list.html"><i class="fas fa-globe"></i> Gümrükler</a></li>
                <li><a href="${this.rootPath}pages/contract-list.html"><i class="fas fa-file-contract"></i> Sözleşmeler</a></li>
                <li><a href="${this.rootPath}pages/unit-list.html"><i class="fas fa-ruler"></i> Ölçü Birimleri</a></li>
                <li><a href="${this.rootPath}pages/hizmet-list.html"><i class="fas fa-cogs"></i> Hizmetler</a></li>
                
            </ul>

            <div class="divider-dashes">--- --- ---</div>

            <ul class="sidebar-section section-2">
            <li><a href="/pages/admin-panel.html"><i class="fas fa-user-shield"></i> Admin Panel</a></li>
            <!-- İsterseniz burada departman, organizasyon vb. admin öğeleri ekleyebilirsiniz -->
            <li><a href="/pages/organizations.html"><i class="fas fa-building"></i> Organizasyonlar</a></li>
            <li><a href="/pages/departments.html"><i class="fas fa-sitemap"></i> Departmanlar</a></li>
            </ul>
        </div>
        `;
    }

    init() {
        // Header render ediliyor
        this.renderHeader();
        this.renderSidebar();
        this.setActivePage();
        this.handleLinks();
    }
    
    renderHeader() {
        let headerContainer = document.querySelector('header.topbar');
        if (!headerContainer) {
            // Eğer header container mevcut değilse, oluşturup body'nin en üstüne ekleyin.
            headerContainer = document.createElement('header');
            headerContainer.className = 'topbar';
            document.body.prepend(headerContainer);
        }
        headerContainer.innerHTML = this.headerTemplate;
    }

    renderSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.innerHTML = this.sidebarTemplate;
        }
    }

    handleLinks() {
        document.querySelectorAll('.sidebar a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = link.href;
            });
        });
    }

    setActivePage() {
        const currentPath = window.location.pathname;
        const links = document.querySelectorAll('.sidebar a');
        
        links.forEach(link => {
            if (currentPath.endsWith(link.getAttribute('href'))) {
                link.classList.add('active');
            }
        });
    }
}

class Sidebar {
    constructor() {
        this.sidebarContainer = document.getElementById('sidebar-container');
        this.init();
    }

    init() {
        this.loadSidebar();
        this.setActiveMenuItem();
    }

    async loadSidebar() {
        const user = JSON.parse(localStorage.getItem('user'));
        const isAdmin = user?.role === 'admin';

        const sidebarHtml = `
            <nav class="sidebar">
                <ul>
                    <li>
                        <a href="/pages/dashboard.html" class="nav-link">
                            <i class="fas fa-home"></i> Dashboard
                        </a>
                    </li>
                    ${isAdmin ? `
                        <li>
                            <a href="/pages/organizations.html" class="nav-link">
                                <i class="fas fa-building"></i> Organizasyonlar
                            </a>
                        </li>
                        <li>
                            <a href="/pages/departments.html" class="nav-link">
                                <i class="fas fa-sitemap"></i> Departmanlar
                            </a>
                        </li>
                    ` : ''}
                    <li>
                        <a href="/pages/contracts.html" class="nav-link">
                            <i class="fas fa-file-contract"></i> Sözleşmeler
                        </a>
                    </li>
                    <li>
                        <a href="/pages/antrepo-list.html" class="nav-link">
                            <i class="fas fa-warehouse"></i> Antrepolar
                        </a>
                    </li>
                    <!-- Diğer menü öğeleri -->
                </ul>
            </nav>
        `;
        if (this.sidebarContainer) {
            this.sidebarContainer.innerHTML = sidebarHtml;
        }
    }

    setActiveMenuItem() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            if (currentPath === link.getAttribute('href')) {
                link.classList.add('active');
            }
        });
    }
}

// Ensure template is initialized on all pages
document.addEventListener('DOMContentLoaded', function() {
    // Initialize template for all pages
    const template = new Template();
    template.init();

    // Remove the old sidebar initialization
    if (document.getElementById('sidebar-container')) {
        new Sidebar();
    }
});

// Remove or comment out the individual template initialization
// const template = new Template();
// template.init();