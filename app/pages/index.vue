<script setup lang="ts">
definePageMeta({
  middleware: 'guest'
})

const avatarImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB38Tl3ssonSC3uVwHnva4IT5sB6O_eWD5KpsgT-41eOE2qyxhij1Hgy3xmX-bQRJ3A46Xls-yImLap0YXky-chXbeFwxXatt7A1KhnGxXNMbaF57_4Hcm53B3Lc0q5CcPt6iP9yarPTD3khGjSM5v8ceMvJljWXfAoIRs4ypLrairiB9sKaXpb9p_cU31-yHj10a-lfpHAXHgcgmdaTXS8RXi2o6zLX9yHdm-phfsfgk3Rf21cIQgy8FGPxz2TR19hYkJgfRhx7sZt',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAf17iFsFP30cX-IRsNHFoG5ELcJEAvCK2vg8T8zmTpsKn-NwLucszGyRRFI7XoJOVeFHldIBXKM8IEqRK3qAlmu0lVEUkF20gtys5X5-nl85sCIaeqJnqFW6Eyvx9l43i5rZO99KWWMbuitU_S6YgbWJYAzYOlHDtRgKUR9Yd8WUjxjRXi5XL648qxan3rXw6xVb10YNzAT7xNZfPXiSDOb66Er-ux3sYt4pwuQPkCLzRW_vJG6uu85jRI69rH_ANjXtvbXMakM0_n',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDXxk8f4oFl57I_W_oNbMYEGBtdRT4uNZVIy5ukn840Nv-N-mGZ1_CswEB1lEQCyD0zF5DWJ70t9WORa9tsHJZEqf90xK8WUv491mtHbbQxu3wIDC-TNxJTryIF2k6k4jrgGswo0UY8HHUz2hZIBjpiyEi4KDk_bolTQgITJmXF-LYqgFCHwFiejoq5jaPjuMfIQ2tPJ0m8p0SKqgsMy1MbeHhtR86B5123nNcRQdmhkobmoioeEpUcJvSsuJFiGvE3drnmMC1uj1W9'
]

const heroImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDohRK18na3EVVQ-jZQzAS5dkg_gTjNkZZ4S9oyt02J4eMJ5CjLTvSzucdXp_bgZt4s-yx7ZZXem6Ba-1jtsOaaFSZlPjo3Xn_biBUn3VOG1ui0z8a4pCEscDJNbwat5l26uMSzmmZxTtchXbJwQnZP2FbVF_1FVhL8ZEQUbtF8oMpukT3XVdDKpTAZkVHIdhxLb56mrOfMslQDHK6ttw5NiR-LWy3VGAnWsKfY7ao_6mOsUN9Dz0FBi5VJ2pBCvL3s6Y-lLYpzVY-Q'
const treePreviewImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkPvWDmCySpoDsPfWSLI6-QIdTeF8zREoluRViXdWcSAabUR5Dv8iAoWtui89e9hx6X_BrKUCtBQ9UHdd6K4Dem-TTPj93AuqKIZ_GzhHu4PTVIKR3j_3bZCPtq0c-RXslzWkc_HQzb8cz4gsYle1S-26qrQjT43ZBPF6jscO1eLFpN1VcK_dVuJGnzOe18RMawlxtle8cdC5qvli4rym0gRTNsaWMb9icTo07mNcK4BtLZ5aoXVuJdxlCXFqhRvOZXJ36SiXPB57R'

const features = [
  {
    icon: 'i-lucide-infinity',
    title: 'Tanpa Batasan',
    body: 'Tambahkan anggota keluarga sebanyak yang Anda mau. Dari nenek moyang hingga generasi termuda, simpan semuanya di satu tempat.',
    tone: 'primary'
  },
  {
    icon: 'i-lucide-heart-handshake',
    title: 'Gratis Selamanya',
    body: 'Semua fitur utama dapat diakses tanpa biaya. Kami percaya bahwa sejarah keluarga adalah hak setiap individu.',
    tone: 'tertiary'
  },
  {
    icon: 'i-lucide-landmark',
    title: 'Mudah Digunakan',
    body: 'Antarmuka yang ramah untuk orang tua maupun anak muda. Navigasi intuitif yang terasa sehangat album foto fisik.',
    tone: 'secondary'
  }
]

const steps = [
  ['Daftar Akun', 'Buat profil Anda dalam hitungan detik. Cukup gunakan email atau media sosial.'],
  ['Masukkan Anggota', 'Mulai dari diri Anda, lalu tambahkan orang tua, kakek-nenek, dan sanak saudara lainnya.'],
  ['Hubungkan Generasi', 'Tautkan hubungan, unggah foto lama, dan lihat pohon keluarga Anda tumbuh mekar.']
]
</script>

<template>
  <div class="heirloom-page">
    <nav class="site-nav">
      <ULink to="/" class="brand-lockup">
        <img src="/logo/screen.png" alt="Keluarga Kita Logo" class="brand-logo">
        <span class="brand-word">Heirloom</span>
      </ULink>

      <div class="nav-links">
        <a class="nav-link nav-link-active" href="#features">Features</a>
        <a class="nav-link" href="#how-it-works">How it Works</a>
        <a class="nav-link" href="#about">About Us</a>
      </div>

      <ULink to="/register" class="nav-cta">Start Your Tree</ULink>
    </nav>

    <main class="page-main">
      <section class="hero-section">
        <div class="grain-texture" />

        <div class="hero-copy">
          <span class="eyebrow">Gratis Selamanya • Tanpa Batasan</span>
          <h1>Abadikan Silsilah Keluarga Anda, <br> Gratis Selamanya.</h1>
          <p>
            Bangun pohon keluarga Anda tanpa batasan jumlah anggota, tanpa biaya tersembunyi,
            dan mudah digunakan untuk semua generasi.
          </p>

          <div class="hero-actions">
            <ULink to="/register" class="button button-primary">Mulai Buat Pohon Anda - Gratis</ULink>
            <ULink to="/login" class="button button-outline">Lihat Contoh Pohon</ULink>
          </div>

          <div class="social-proof">
            <div class="avatar-stack">
              <img v-for="avatar in avatarImages" :key="avatar" :src="avatar" alt="Keluarga bergabung">
            </div>
            <span>+10,000 Keluarga Bergabung</span>
          </div>
        </div>

        <div class="hero-visual">
          <div class="hero-photo">
            <img :src="heroImage" alt="Keluarga multi generasi melihat pohon keluarga dan foto lama">
            <div class="photo-gradient" />
          </div>

          <div class="floating-node">
            <div class="node-icon">
              <UIcon name="i-lucide-user" class="size-4" />
            </div>
            <div>
              <p>Kakek Buyut</p>
              <span>1920 - 1995</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" class="features-section">
        <div class="section-heading">
          <h2>Dibuat untuk Warisan Abadi</h2>
          <p>
            Fitur-fitur terbaik kami dirancang untuk memastikan silsilah Anda tetap terjaga
            dengan aman dan dapat dinikmati oleh cucu-cucu Anda kelak.
          </p>
        </div>

        <div class="feature-grid">
          <article v-for="feature in features" :key="feature.title" class="feature-card">
            <div class="feature-icon" :class="`feature-${feature.tone}`">
              <UIcon :name="feature.icon" class="size-8" />
            </div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.body }}</p>
          </article>
        </div>
      </section>

      <section id="how-it-works" class="steps-section">
        <div class="steps-visual">
          <svg class="tree-lines" fill="none" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <path d="M200 350V50M200 150L100 100M200 200L300 150M200 250L120 280M200 300L280 320" stroke="currentColor" stroke-linecap="round" stroke-width="4" />
          </svg>

          <div class="step-list">
            <div v-for="(step, index) in steps" :key="step[0]" class="step-item">
              <div class="step-number">{{ index + 1 }}</div>
              <div>
                <h4>{{ step[0] }}</h4>
                <p>{{ step[1] }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="steps-copy">
          <h2>Mulai dalam 3 Langkah Sederhana</h2>
          <p>
            Kami menghilangkan kerumitan dalam mencatat sejarah keluarga. Dengan sistem seret-dan-lepas,
            membangun pohon keluarga terasa seperti menyusun puzzle yang penuh kenangan.
          </p>
          <div class="tree-preview">
            <img :src="treePreviewImage" alt="Preview antarmuka pohon keluarga digital">
          </div>
        </div>
      </section>

      <section id="about" class="final-cta-section">
        <div class="final-cta">
          <div class="cta-orb cta-orb-right" />
          <div class="cta-orb cta-orb-left" />
          <h2>Mulai perjalanan silsilah Anda hari ini.</h2>
          <p>
            Setiap keluarga memiliki cerita. Jangan biarkan cerita Anda memudar oleh waktu.
            Simpan, bagikan, dan lestarikan untuk selamanya.
          </p>
          <ULink to="/register" class="button button-inverse">Buat Akun Gratis Sekarang</ULink>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div>
        <div class="footer-brand">
          <img src="/logo/screen.png" alt="Logo" class="footer-logo">
          <span>Heirloom</span>
        </div>
        <p>Melestarikan akar untuk menumbuhkan masa depan.</p>
      </div>

      <div class="footer-column">
        <p>Navigasi</p>
        <a href="#features">Fitur</a>
        <a href="#how-it-works">Cara Kerja</a>
        <a href="#about">Tentang Kami</a>
      </div>

      <div class="footer-column">
        <p>Legal & Privasi</p>
        <a href="#">Syarat & Ketentuan</a>
        <a href="#">Kebijakan Privasi</a>
        <a href="#">Keamanan Data</a>
      </div>

      <div class="footer-column">
        <p>Media Sosial</p>
        <div class="social-icons">
          <UIcon name="i-lucide-facebook" class="size-5" />
          <UIcon name="i-lucide-camera" class="size-5" />
          <UIcon name="i-lucide-badge" class="size-5" />
        </div>
        <span class="copyright">© 2024 Heirloom Genealogy. All rights reserved.</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');

.heirloom-page {
  --background: #fff8f5;
  --surface: #fff8f5;
  --surface-low: #fbf2ed;
  --surface-container: #f5ece7;
  --surface-high: #efe6e2;
  --surface-highest: #e9e1dc;
  --surface-lowest: #ffffff;
  --primary: #283529;
  --primary-container: #3e4c3f;
  --primary-fixed: #d7e7d5;
  --primary-fixed-dim: #bbcbba;
  --on-primary: #ffffff;
  --on-primary-fixed: #121e14;
  --on-primary-container: #acbcab;
  --secondary: #5e5e5b;
  --secondary-fixed: #e4e2dd;
  --tertiary: #562205;
  --tertiary-fixed: #ffdbcc;
  --on-tertiary-fixed: #351000;
  --text: #1e1b18;
  --muted: #434843;
  --outline: #747872;
  --border: #e9e1dc;
  --hero-grain-opacity: 0.35;
  --shadow: 0 18px 50px rgb(40 53 41 / 10%);

  min-height: 100vh;
  background: var(--background);
  color: var(--text);
  color-scheme: light;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
}

:global(.dark) .heirloom-page,
:global(.dark-mode) .heirloom-page {
  --background: #161412;
  --surface: #1e1b18;
  --surface-low: #211e1b;
  --surface-container: #292521;
  --surface-high: #332f2a;
  --surface-highest: #3e3933;
  --surface-lowest: #211e1b;
  --primary: #d7e7d5;
  --primary-container: #bbcbba;
  --primary-fixed: #3e4c3f;
  --primary-fixed-dim: #546254;
  --on-primary: #121e14;
  --on-primary-fixed: #d7e7d5;
  --on-primary-container: #121e14;
  --secondary: #c8c6c2;
  --secondary-fixed: #474744;
  --tertiary: #ffdbcc;
  --tertiary-fixed: #72381a;
  --on-tertiary-fixed: #ffdbcc;
  --text: #f8efea;
  --muted: #d0c7c2;
  --outline: #aaa39f;
  --border: #3e3933;
  --hero-grain-opacity: 0.12;
  --shadow: 0 18px 50px rgb(0 0 0 / 35%);

  color-scheme: dark;
}

:global(.light) .heirloom-page,
:global(.light-mode) .heirloom-page {
  --background: #fff8f5;
  --surface: #fff8f5;
  --surface-low: #fbf2ed;
  --surface-container: #f5ece7;
  --surface-high: #efe6e2;
  --surface-highest: #e9e1dc;
  --surface-lowest: #ffffff;
  --primary: #283529;
  --primary-container: #3e4c3f;
  --primary-fixed: #d7e7d5;
  --primary-fixed-dim: #bbcbba;
  --on-primary: #ffffff;
  --on-primary-fixed: #121e14;
  --on-primary-container: #acbcab;
  --secondary: #5e5e5b;
  --secondary-fixed: #e4e2dd;
  --tertiary: #562205;
  --tertiary-fixed: #ffdbcc;
  --on-tertiary-fixed: #351000;
  --text: #1e1b18;
  --muted: #434843;
  --outline: #747872;
  --border: #e9e1dc;
  --hero-grain-opacity: 0.35;
  --shadow: 0 18px 50px rgb(40 53 41 / 10%);

  color-scheme: light;
}

.site-nav {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 40px;
  background: color-mix(in srgb, var(--background) 80%, transparent);
  box-shadow: 0 1px 12px rgb(30 27 24 / 6%);
  backdrop-filter: blur(14px);
}

.brand-lockup,
.footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--primary);
}

.brand-logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: contain;
}

.brand-word,
.footer-brand span {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-link {
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  transition: color 160ms ease;
}

.nav-link:hover,
.nav-link-active {
  color: var(--primary);
}

.nav-link-active {
  border-bottom: 2px solid var(--primary);
  padding-bottom: 4px;
}

.nav-cta,
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  transition: transform 160ms ease, opacity 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
}

.nav-cta {
  background: var(--primary);
  color: var(--on-primary);
  padding: 10px 24px;
}

.button {
  min-height: 56px;
  padding: 16px 32px;
}

.nav-cta:hover,
.button-primary:hover {
  opacity: 0.9;
}

.nav-cta:active,
.button:active {
  transform: scale(0.95);
}

.page-main {
  overflow-x: hidden;
  padding-top: 96px;
}

.hero-section {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 1fr);
  align-items: center;
  gap: 48px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 48px 40px;
}

.grain-texture {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: var(--hero-grain-opacity);
  background-image: radial-gradient(var(--outline) 0.5px, transparent 0.7px);
  background-size: 28px 28px;
}

.hero-copy {
  position: relative;
  z-index: 1;
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 24px;
  border-radius: 9999px;
  background: var(--primary-fixed);
  color: var(--on-primary-fixed);
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  line-height: 16px;
}

.hero-copy h1 {
  margin-bottom: 24px;
  color: var(--primary);
  font-family: "Playfair Display", Georgia, serif;
  font-size: 48px;
  font-weight: 700;
  line-height: 56px;
}

.hero-copy p,
.steps-copy > p {
  max-width: 576px;
  color: var(--muted);
  font-size: 18px;
  font-weight: 400;
  line-height: 28px;
}

.hero-copy p {
  margin-bottom: 40px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.button-primary {
  background: var(--primary);
  color: var(--on-primary);
}

.button-outline {
  border: 1px solid var(--primary);
  color: var(--primary);
}

.button-outline:hover {
  background: var(--primary-fixed);
}

.button-inverse {
  background: var(--background);
  color: var(--primary);
  box-shadow: var(--shadow);
}

.button-inverse:hover {
  transform: scale(1.05);
}

.social-proof {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.avatar-stack {
  display: flex;
}

.avatar-stack img {
  width: 40px;
  height: 40px;
  margin-left: -8px;
  border: 2px solid var(--background);
  border-radius: 9999px;
  object-fit: cover;
}

.avatar-stack img:first-child {
  margin-left: 0;
}

.hero-visual {
  position: relative;
  display: flex;
  justify-content: center;
}

.hero-photo {
  position: relative;
  width: 100%;
  max-width: 512px;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid var(--surface-highest);
  border-radius: 24px;
  background: var(--surface-container);
  box-shadow: var(--shadow);
}

.hero-photo img,
.tree-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, color-mix(in srgb, var(--primary) 20%, transparent), transparent);
}

.floating-node {
  position: absolute;
  top: -24px;
  right: -48px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--surface-container);
  border-radius: 12px;
  background: var(--surface-lowest);
  box-shadow: 0 10px 24px rgb(30 27 24 / 12%);
  animation: floatNode 3s ease-in-out infinite;
}

.node-icon {
  display: flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--tertiary-fixed);
  color: var(--on-tertiary-fixed);
}

.floating-node p {
  color: var(--text);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.floating-node span {
  color: var(--muted);
  font-size: 10px;
}

@keyframes floatNode {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.features-section {
  background: var(--surface-low);
  padding: 80px 40px;
}

.section-heading {
  max-width: 1280px;
  margin: 0 auto 64px;
  text-align: center;
}

.section-heading h2,
.steps-copy h2 {
  margin-bottom: 16px;
  color: var(--primary);
  font-family: "Playfair Display", Georgia, serif;
  font-size: 32px;
  font-weight: 600;
  line-height: 40px;
}

.section-heading p {
  max-width: 672px;
  margin: 0 auto;
  color: var(--muted);
  font-size: 16px;
  line-height: 24px;
}

.feature-grid {
  display: grid;
  max-width: 1280px;
  margin: 0 auto;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.feature-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px;
  border: 1px solid var(--surface-container);
  border-radius: 16px;
  background: var(--surface-lowest);
  box-shadow: 0 8px 22px rgb(30 27 24 / 6%);
  text-align: center;
  transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 300ms ease;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow);
}

.feature-icon {
  display: flex;
  width: 64px;
  height: 64px;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  border-radius: 16px;
}

.feature-primary { background: var(--primary-fixed-dim); color: var(--primary); }
.feature-tertiary { background: var(--tertiary-fixed); color: var(--tertiary); }
.feature-secondary { background: var(--secondary-fixed); color: var(--secondary); }

.feature-card h3 {
  margin-bottom: 12px;
  color: var(--primary);
  font-family: "Playfair Display", Georgia, serif;
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
}

.feature-card p {
  color: var(--muted);
  font-size: 16px;
  line-height: 24px;
}

.steps-section {
  display: grid;
  max-width: 1280px;
  margin: 0 auto;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  gap: 48px;
  padding: 96px 40px;
}

.steps-visual {
  position: relative;
  padding: 8px;
}

.tree-lines {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 400px;
  height: 400px;
  color: var(--primary);
  opacity: 0.1;
}

.step-list {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.step-number {
  display: flex;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: var(--primary-container);
  color: var(--on-primary-container);
  font-weight: 700;
}

.step-item h4 {
  margin-bottom: 4px;
  color: var(--primary);
  font-family: "Playfair Display", Georgia, serif;
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
}

.step-item p {
  color: var(--muted);
  font-size: 16px;
  line-height: 24px;
}

.steps-copy > p {
  margin-bottom: 32px;
}

.tree-preview {
  height: 256px;
  overflow: hidden;
  border: 1px solid var(--surface-highest);
  border-radius: 16px;
  box-shadow: var(--shadow);
}

.final-cta-section {
  padding: 96px 40px;
}

.final-cta {
  position: relative;
  max-width: 896px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 32px;
  background: var(--primary-container);
  color: var(--on-primary);
  padding: 64px;
  text-align: center;
  box-shadow: var(--shadow);
}

.cta-orb {
  position: absolute;
  width: 256px;
  height: 256px;
  border-radius: 9999px;
  background: rgb(255 255 255 / 5%);
  filter: blur(40px);
}

.cta-orb-right { right: -80px; bottom: -80px; }
.cta-orb-left { top: -80px; left: -80px; }

.final-cta h2 {
  position: relative;
  z-index: 1;
  margin-bottom: 24px;
  font-family: "Playfair Display", Georgia, serif;
  font-size: 32px;
  font-weight: 600;
  line-height: 40px;
}

.final-cta p {
  position: relative;
  z-index: 1;
  max-width: 672px;
  margin: 0 auto 40px;
  color: var(--on-primary-container);
  font-size: 18px;
  line-height: 28px;
}

.site-footer {
  display: grid;
  max-width: 1280px;
  margin: 48px auto 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  border-top: 1px solid var(--surface-highest);
  background: var(--surface-highest);
  padding: 48px 40px;
}

.footer-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: contain;
  filter: grayscale(1);
  opacity: 0.8;
}

.site-footer p,
.site-footer a,
.copyright {
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  line-height: 16px;
}

.footer-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-column > p {
  margin-bottom: 8px;
  color: var(--primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.footer-column a:hover {
  color: var(--primary);
  text-decoration: underline;
}

.social-icons {
  display: flex;
  gap: 16px;
  color: var(--muted);
}

@media (max-width: 1023px) {
  .hero-section,
  .steps-section {
    grid-template-columns: 1fr;
  }

  .hero-copy,
  .steps-copy {
    text-align: center;
  }

  .hero-copy p,
  .steps-copy > p {
    margin-right: auto;
    margin-left: auto;
  }

  .hero-actions,
  .social-proof {
    justify-content: center;
  }

  .floating-node {
    right: 12px;
  }
}

@media (max-width: 767px) {
  .site-nav {
    padding: 16px;
  }

  .nav-links {
    display: none;
  }

  .brand-word {
    font-size: 20px;
  }

  .page-main {
    padding-top: 88px;
  }

  .hero-section,
  .features-section,
  .steps-section,
  .final-cta-section,
  .site-footer {
    padding-right: 16px;
    padding-left: 16px;
  }

  .hero-copy h1 {
    font-size: 36px;
    line-height: 44px;
  }

  .button,
  .hero-actions {
    width: 100%;
  }

  .feature-grid,
  .site-footer {
    grid-template-columns: 1fr;
  }

  .final-cta {
    padding: 32px;
  }
}
</style>
