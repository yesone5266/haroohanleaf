class BottomNav extends HTMLElement {
    connectedCallback() {
        const active = this.getAttribute('active') || 'home';
        this.innerHTML = `
            <nav class="bottom-nav">
                <a href="/" class="bottom-nav-item ${active === 'home' ? 'active' : ''}">
                    <img src="/assets/home.svg" alt="홈" class="bottom-nav-icon">
                    <span class="bottom-nav-label">홈</span>
                </a>
                <a href="/inventory" class="bottom-nav-item ${active === 'inventory' ? 'active' : ''}">
                    <img src="/assets/inventory.svg" alt="인벤토리" class="bottom-nav-icon">
                    <span class="bottom-nav-label">인벤토리</span>
                </a>
                <a href="/mypage" class="bottom-nav-item ${active === 'mypage' ? 'active' : ''}">
                    <img src="/assets/profile.svg" alt="마이페이지" class="bottom-nav-icon">
                    <span class="bottom-nav-label">마이페이지</span>
                </a>
            </nav>
        `;
    }
}

customElements.define('bottom-nav', BottomNav);
