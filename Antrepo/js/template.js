class Template {
    constructor() {
        this.rootPath = window.location.pathname.includes('/pages/') ? '../' : './';
        
        this.headerTemplate = `
            <div class="topbar-left">
                <span class="logo">ANTREPO</span>
            </div>
            <div class="topbar-right">
                <input type="text" placeholder="Ara..." class="topbar-search" />
                <img src="${this.rootPath}assets/user-icon.png" alt="User Icon" class="topbar-user-icon" />
            </div>
        `;

        this.sidebarTemplate = `
            <ul>
            <li><a href="${this.rootPath}index.html">Anasayfa</a></li>
            <li><a href="${this.rootPath}pages/antrepo-giris-formu.html">Antrepo Giriş Formu</a></li>
            <li><a href="${this.rootPath}pages/antrepo-giris-form-list.html">Antrepo Giriş Formları</a></li>
            <li><a href="${this.rootPath}pages/company-list.html">Antrepo Şirket Listesi</a></li>
            <li><a href="${this.rootPath}pages/antrepo-list.html">Antrepolar</a></li>
            <li><a href="${this.rootPath}pages/contract-list.html">Sözleşmeler</a></li>
            <li><a href="${this.rootPath}pages/product-list.html">Ürünler</a></li>
            <li><a href="${this.rootPath}pages/maliyet-analizi-index.html">Maliyet Analiz</a></li>
            <li><a href="${this.rootPath}pages/customs-list.html">Gümrükler</a></li>
            <li><a href="${this.rootPath}pages/unit-list.html">Ölçü Birimleri</a></li>
            <li><a href="${this.rootPath}pages/hizmet-list.html">Hizmetler (Maliyet Kalemleri)</a></li>

            

            </ul> 
        `;
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.renderHeader();
            this.renderSidebar();
            this.setActivePage();
            this.handleLinks();
        });
    }

    renderHeader() {
        const header = document.querySelector('.topbar');
        if (header) {
            header.innerHTML = this.headerTemplate;
        }
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

const template = new Template();
template.init();