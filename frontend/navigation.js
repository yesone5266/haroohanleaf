class BottomNav extends HTMLElement {
    connectedCallback() {
        const active = this.getAttribute('active') || 'home';
        this.innerHTML = `
            <nav class="bottom-nav">
                <a href="/" class="bottom-nav-item ${active === 'home' ? 'active' : ''}">
                    <img src="http://localhost:3845/assets/497c841bd3932f72db08501e6a8d63976f97bfd1.svg" alt="홈" class="bottom-nav-icon">
                    <span class="bottom-nav-label">홈</span>
                </a>
                <a href="/inventory" class="bottom-nav-item ${active === 'inventory' ? 'active' : ''}">
                    <img src="http://localhost:3845/assets/3234baad2f05ab58947e450f734db65fd6e17bae.svg" alt="인벤토리" class="bottom-nav-icon">
                    <span class="bottom-nav-label">인벤토리</span>
                </a>
                <a href="/mypage" class="bottom-nav-item ${active === 'mypage' ? 'active' : ''}">
                    <img src="http://localhost:3845/assets/ef05583eaf6927be628415511612ae7e7595346c.svg" alt="마이페이지" class="bottom-nav-icon">
                    <span class="bottom-nav-label">마이페이지</span>
                </a>
            </nav>
        `;
    }
}

customElements.define('bottom-nav', BottomNav);
